var schema = new Schema({
    playerNo: {
        type: Number,
        required: true,
        unique: true,
        // excel: true,
    },
    isTurn: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: false

    },
    isFold: {
        type: Boolean,
        default: false

    },
    isDealer: {
        type: Boolean,
        default: false
    },
    cards: [String],
    cardsServe: {
        type: Number,
        default: 0
    }

});
schema.plugin(deepPopulate, {
    populate: {
        'cards': {
            select: 'name _id'
        }
    }
});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);
module.exports = mongoose.model('Player', schema);
var exports = _.cloneDeep(require("sails-wohlig-service")(schema, "cards", "cards"));
var Hand = require('pokersolver').Hand;

var model = {
    addPlayer: function (data, callback) {
        Player.saveData(data, function (err, data2) {
            if (err) {
                callback(err, data2);
            } else {
                data3 = data2.toObject();
                delete data3.password;
                callback(err, data3);
            }
        });
    },
    updatePlayer: function (data, callback) {

        var playerData = _.clone(data, true);
        delete playerData.playerNo;
        Player.update({
            "playerNo": data.playerNo
        }, playerData, {
            new: true,
            runValidators: true
        }, function (err, doc) {
            if (err) {
                callback(err);
            } else {
                callback(err, doc);
            }
        });
    },
    deletePlayer: function (data, callback) {
        Player.findOne({
            "playerNo": data.playerNo
        }).exec(function (err, userData) {
            if (!_.isEmpty(userData)) {
                userData.remove(function (err, data) {
                    callback(err, "Deleted successfully");
                });
            } else {
                callback(err, userData);
            }
        });
    },
    findWinner: function (data, callback) {
        Player.find().exec(function (err, userData) {
            callback(err, userData);
        });
    },

    getAll: function (data, callback) {
        var cards = {};
        async.parallel({
            playerCards: function (callback) {
                Player.find({}, {
                    playerNo: 1,
                    isTurn: 1,
                    isActive: 1,
                    isDealer: 1,
                    isFold: 1,
                    cards: 1,
                    _id: 0
                }).exec(callback);
            },
            communityCards: function (callback) {
                CommunityCards.find({}, {
                    cardNo: 1,
                    cardValue: 1,
                    isOpen: 1,
                    _id: 0
                }).exec(callback);
            }
        }, callback);
    },
    getTabDetail: function (data, callback) {
        async.parallel({
            playerCards: function (callback) {
                Player.find({
                    playerNo: data.tabId
                }, {
                    playerNo: 1,
                    isTurn: 1,
                    isActive: 1,
                    isDealer: 1,
                    isFold: 1,
                    cards: 1,
                    _id: 0
                }).exec(callback);
            },
            communityCards: function (callback) {
                CommunityCards.find({}, {
                    cardNo: 1,
                    cardValue: 1,
                    isOpen: 1,
                    _id: 0
                }).exec(callback);
            }
        }, callback);

    },
    showWinner: function (callback) {

        async.parallel({
            players: function (callback) {
                Player.find({
                    isActive: true,
                    isFold: false
                }).lean().exec(callback);
            },
            communityCards: function (callback) {
                CommunityCards.find().lean().exec(callback);
            }
        }, function (err, data) {
            if (err) {
                callback(err);
            } else {
                //Check All Player Cards are Placed
                var playerCardsNotPresent = _.findIndex(data.players, function (player) {
                    return player.cards.length === 0;
                });
                if (playerCardsNotPresent >= 0) {
                    callback("Cards not Distributed");
                    return 0;
                }

                //Check All Community Cards are Distributed
                var communityCardsNoDistributed = _.findIndex(data.communityCards, function (commu) {
                    return commu.cardValue === "";
                });
                if (communityCardsNoDistributed >= 0) {
                    callback("Community Cards not Distributed");
                    return 0;
                }

                _.each(data.players, function (player) {
                    player.allCards = _.cloneDeep(player.cards);
                    _.each(data.communityCards, function (commu) {
                        player.allCards.push(commu.cardValue);
                    });
                    player.hand = Hand.solve(player.allCards);
                    player.winName = player.hand.name;
                    player.descr = player.hand.descr;
                });
                var winners = Hand.winners(_.map(data.players, "hand"));
                _.each(data.players, function (player) {
                    var index = _.findIndex(winners, function (winner) {
                        return player.hand == winner;
                    });
                    if (index >= 0) {
                        player.winner = true;
                        player.winName = player.hand.name;
                        player.descr = player.hand.descr;
                    }
                    player.hand = undefined;
                });

                // var finalWin = _.filter(data.players, function (player) {
                //     return player.winner;
                // });
                Player.blastSocketWinner();
                callback(null, {
                    winners: data.players,
                    communityCards: data.communityCards
                });


            }
        });


    },
    revealCards: function (data, callback) {

        CommunityCards.find({
            isOpen: true
        }).exec(function (err, cardsData) {
            var revealNo = cardsData.length;
            switch (revealNo) {
                case 0:
                    CommunityCards.update({
                        cardNo: {
                            $lt: 4
                        }
                    }, {
                        $set: {
                            isOpen: true
                        }
                    }, {
                        multi: true
                    }, function (err, data) {
                        Player.blastSocket();
                        callback(err, data);
                    });
                    break;
                case 3:
                    CommunityCards.update({
                        cardNo: 4
                    }, {
                        $set: {
                            isOpen: true
                        }
                    }, {
                        multi: true
                    }, function (err, data) {
                        Player.blastSocket();
                        callback(err, data);
                    });
                    break;
                case 4:
                    CommunityCards.update({
                        cardNo: 5
                    }, {
                        $set: {
                            isOpen: true
                        }
                    }, {
                        multi: true
                    }, function (err, data) {
                        Player.blastSocket();
                        callback(err, data);
                    });
                    break;
                default:
                    callback(null, "No more cards to reveal");
            }
        });
    },
    newGame: function (data, callback) {
        var Model = this;
        async.waterfall([
            function (fwCallback) {
                Model.update({}, {
                    $set: {
                        isFold: false,
                        isDealer: false,
                        cards: [],
                        isTurn: false,
                        cardsServe: 0
                    }
                }, {
                    multi: true
                }, function (err, cards) {
                    fwCallback(err, cards);
                });
            },
            function (arg1, fwCallback) {
                CommunityCards.update({}, {
                    $set: {
                        cardValue: "",
                        isOpen: false
                    }
                }, {
                    multi: true
                }, function (err, cumCards) {
                    fwCallback(err, cumCards);
                });
            }
        ], function (err, cumCards) {
            Player.blastSocket();
            callback(err, cumCards);
        });
        readLastValue = "";
        cardServed = false;
    },
    makeDealer: function (data, callback) {
        Player.find({
            isActive: true
        }).exec(function (err, players) {
            if (err) {
                callback(err);
            } else {
                var playerIndex = _.findIndex(players, function (player) {
                    return player.playerNo == parseInt(data.tabId);
                });
                if (playerIndex >= 0) {
                    async.parallel({
                        addDealer: function (callback) {
                            players[playerIndex].isDealer = true;
                            players[playerIndex].save(callback);
                        },
                        addTurn: function () {
                            var turnIndex = (playerIndex + 1) % players.length;
                            players[turnIndex].isTurn = true;
                            players[turnIndex].save(callback);
                        }
                    }, function (err, data) {
                        callback(err, data);
                        Player.blastSocket();
                    });
                } else {
                    callback("No Such Player");
                }
            }

        });
    },
    removeDealer: function (data, callback) {
        var Model = this;
        Model.findOneAndUpdate({
            playerNo: data.tabId
        }, {
            $set: {
                isDealer: false
            }
        }, {
            new: true
        }, function (err, CurrentTab) {
            callback(err, CurrentTab);
        });
    },
    removeTab: function (data, callback) {
        var Model = this;
        Model.findOneAndUpdate({
            playerNo: data.tabId
        }, {
            $set: {
                isActive: false
            }
        }, {
            new: true
        }, function (err, currentTab) {
            Player.blastSocket();
            callback(err, currentTab);
        });
    },
    fold: function (data, callback) {
        Player.find({
            isActive: true,
            isFold: false
        }).exec(function (err, players) {
            if (err) {
                callback(err);
            } else {
                var turnIndex = _.findIndex(players, function (player) {
                    return player.isTurn;
                });
                if (turnIndex >= 0) {
                    async.parallel({
                        removeTurn: function (callback) {
                            var player = players[turnIndex];
                            player.isTurn = false;
                            player.isFold = true;
                            player.save(callback);
                        },
                        addTurn: function (callback) {
                            var newTurnIndex = (turnIndex + 1) % players.length;
                            var player = players[newTurnIndex];
                            player.isTurn = true;
                            player.save(callback);
                        }
                    }, function (err, data) {
                        callback(err, data);
                        Player.blastSocket();
                    });
                } else {
                    callback("No Element Remaining");
                }

            }
        });
    },

    addTab: function (data, callback) {
        var Model = this;
        Model.findOneAndUpdate({
            playerNo: data.tabId
        }, {
            $set: {
                isActive: true
            }
        }, {
            new: true
        }, function (err, CurrentTab) {
            Player.blastSocket();
            callback(err, CurrentTab);
        });
    },
    assignCard: function (card, wfCallback) {
        var Model = this;
        Model.findOneAndUpdate({
            isTurn: true,
            cardsServe: {
                $lt: 2
            }
        }, {
            $push: {
                cards: card
            },
            $inc: {
                cardsServe: 1
            }
        }, {
            new: true
        }, function (err, CurrentTab) {
            if (!_.isEmpty(CurrentTab)) {
                readLastValue = card;
                wfCallback(err, CurrentTab);
            } else {
                //$nin    
                CommunityCards.findOneAndUpdate({
                    $or: [{
                        cardValue: {
                            $in: ["", undefined, null]
                        }
                    }, {
                        cardValue: {
                            $exists: false
                        }
                    }]
                }, {
                    cardValue: card
                }, {
                    new: true,
                    sort: {
                        cardValue: 1
                    }
                }, function (err, CurrentTab) {
                    readLastValue = card;
                    if (!_.isEmpty(CurrentTab)) {
                        if (CurrentTab.cardNo == 5) {
                            cardServed = true;
                            Model.changeTurnWithDealer(wfCallback);
                        } else {
                            wfCallback(err, CurrentTab);
                        }
                    } else {
                        wfCallback(err, "Extra Card");
                    }

                    //callback(null, "Repeated Card"); 
                });
            }
        });
    },

    serve: function (data, callback) {
        if (data.card && data.card.length == 2) {
            async.parallel({
                players: function (callback) {
                    Player.find({
                        isActive: true
                    }).exec(callback);
                },
                communityCards: function (callback) {
                    CommunityCards.find().exec(callback);
                }
            }, function (err, response) {
                // Initialize all variables
                var allCards = [];
                var playerCards = [];
                var playerCount = response.players.length;
                var communityCards = [];
                var communityCardCount = 0;
                var dealerNo = -1;
                var maxCommunityCard = 5;
                var maxCardsPerPlayer = 2;
                _.each(response.players, function (player, index) {
                    playerCards = _.concat(playerCards, player.cards);
                    if (player.isDealer) {
                        dealerNo = index;
                    }
                });

                _.each(response.communityCards, function (commuCard) {
                    if (commuCard.cardValue && commuCard.cardValue !== "") {
                        communityCards = _.concat(communityCards, commuCard.cardValue);
                    }
                });
                communityCardCount = communityCards.length;
                allCards = _.concat(communityCards, playerCards);


                // check whether no of players are greater than 1
                if (playerCount <= 1) {
                    callback("Less Players - No of Players selected are too less");
                    return 0;
                }

                // check whether dealer is provided or not
                if (dealerNo < 0) {
                    callback("Dealer is not selected");
                    return 0;
                }

                // Check whether Card is in any Current Cards List
                var cardIndex = _.indexOf(allCards, data.card);
                if (cardIndex >= 0) {
                    callback("Duplicate Entry - Card Already Used");
                    return 0;
                }
                if (playerCards.length < (playerCount * maxCardsPerPlayer)) {
                    // Add card to Players
                    var remainder = playerCards.length % playerCount;
                    var toServe = (dealerNo + remainder + 1) % playerCount;
                    var toServePlayer = response.players[toServe];
                    toServePlayer.cards.push(data.card);
                    toServePlayer.save(function (err, data) {
                        if (err) {
                            callback(err);
                        } else {
                            callback(err, "Card Provided to Player " + (toServe + 1));
                            Player.blastSocket();
                        }
                    });
                } else if (communityCardCount < maxCommunityCard) {
                    // Add card to Community Cards
                    var toServeCommuCard = response.communityCards[communityCardCount];
                    toServeCommuCard.cardValue = data.card;
                    toServeCommuCard.save(function (err, data) {
                        if (err) {
                            callback(err);
                        } else {
                            callback(err, "Card Provided to Community Card No " + (communityCardCount + 1));
                            Player.blastSocket();
                        }
                    });
                } else {
                    callback("All Cards are Served");
                    return 0;
                }
            });
        } else {
            callback("Incorrect Card - Please enter a valid Card");
            return 0;
        }

    },

    moveTurn: function (data, callback) {
        Player.find({
            isActive: true,
            isFold: false
        }).exec(function (err, players) {
            if (err) {
                callback(err);
            } else {
                var turnIndex = _.findIndex(players, function (player) {
                    return player.isTurn;
                });
                if (turnIndex >= 0) {
                    async.parallel({
                        removeTurn: function (callback) {
                            var player = players[turnIndex];
                            player.isTurn = false;
                            player.save(callback);
                        },
                        addTurn: function (callback) {
                            var newTurnIndex = (turnIndex + 1) % players.length;
                            var player = players[newTurnIndex];
                            player.isTurn = true;
                            player.save(callback);
                        }
                    }, function (err, data) {
                        callback(err, data);
                        Player.blastSocket();
                    });
                } else {
                    callback("No Element Remaining");
                }

            }
        });
    },

    blastSocket: function () {
        Player.getAll({}, function (err, data) {
            if (err) {
                console.log(err);
            } else {
                sails.sockets.blast("Update", data);
            }
        });
    },
    blastSocketWinner: function () {
        sails.sockets.blast("Winner", {});
    }



};
module.exports = _.assign(module.exports, exports, model);