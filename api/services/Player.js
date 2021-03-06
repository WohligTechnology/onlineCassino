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
    },
    isLastBlind: {
        type: Boolean,
        default: false
    },
    hasRaised: {
        type: Boolean,
        default: false
    },
    hasRaisedd: {
        type: Boolean,
        default: false
    },
    isAllIn: {
        type: Boolean,
        default: false
    },
    hasChecked: {
        type: Boolean,
        default: false
    },
    hasCalled: {
        type: Boolean,
        default: false
    },
    showCard: {
        type: Boolean,
        default: false
    },
    isSmallBlind: {
        type: Boolean,
        default: false
    },
    isBigBlind: {
        type: Boolean,
        default: false
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
                    isAllIn: 1,
                    hasRaised: 1,
                    hasCalled: 1,
                    hasChecked: 1,
                    isLastBlind: 1,
                    hasRaisedd: 1,
                    showCard: 1,
                    _id: 0,
                    isSmallBlind: 1,
                    isBigBlind: 1
                }).exec(callback);
            },
            communityCards: function (callback) {
                CommunityCards.find({}, {
                    cardNo: 1,
                    cardValue: 1,
                    isOpen: 1,
                    isBurn: 1,
                    _id: 0
                }).exec(callback);
            }
        }, function (err, data) {
            if (err) {
                callback(err);
            } else {
                var turnPlayer = _.find(data.playerCards, function (player) {
                    return player.isTurn;
                });
                var raiseIndex = _.findIndex(data.playerCards, function (player) {
                    return player.hasRaised;
                });
                var lastBlindIndex = _.findIndex(data.playerCards, function (player) {
                    return player.isLastBlind;
                });
                var blankCardIndex = _.findIndex(data.communityCards, function (card) {
                    return card.cardValue === "";
                });

                if (turnPlayer) {
                    data.hasTurn = true;
                    if (raiseIndex < 0 && lastBlindIndex < 0) {
                        data.isCheck = true;
                    }
                    if (turnPlayer.isLastBlind && turnPlayer.isTurn) {
                        data.isCheck = true;
                    }
                } else {
                    data.hasTurn = false;
                    if (blankCardIndex < 0) {
                        data.showWinner = true;
                    }
                }
                callback(err, data);
            }
        });
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
                CommunityCards.find({
                    isBurn: false
                }).lean().exec(callback);
            }
        }, function (err, data) {
            if (err) {
                callback(err);
            } else {
                //Check All Player Cards are Placed
                CommunityCards.findWinner(data.players, data.communityCards, function (err, finalVal) {
                    if (err) {
                        callback(err);
                    } else {
                        Player.blastSocketWinner({
                            winners: data.players,
                            communityCards: data.communityCards
                        });
                        callback(null, {
                            winners: data.players,
                            communityCards: data.communityCards
                        });
                    }
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
            function (callback) {
                GameLogs.flush(function (err, data) {
                    callback(err);
                });
            },
            function (callback) { // Next Dealer
                Model.find({
                    isActive: true
                }).exec(function (err, players) {
                    if (err) {
                        callback(err);
                    } else {
                        var turnIndex = _.findIndex(players, function (n) {
                            return n.isDealer;
                        });
                        if (turnIndex >= 0) {
                            async.parallel({
                                removeDealer: function (callback) {
                                    var player = players[turnIndex];
                                    player.isDealer = false;
                                    player.save(callback);
                                },
                                addDealer: function (callback) {
                                    var newTurnIndex = (turnIndex + 1) % players.length;
                                    var player = players[newTurnIndex];
                                    player.isDealer = true;
                                    player.save(callback);
                                }
                            }, function (err, data) {
                                callback();
                            });
                        } else {
                            callback("No Element Remaining");
                        }
                    }
                });
            },
            function (fwCallback) {
                Model.update({}, {
                    $set: {
                        isFold: false,
                        cards: [],
                        isTurn: false,
                        cardsServe: 0,
                        isLastBlind: false,
                        hasRaised: false,
                        isAllIn: false,
                        hasRaisedd: false,
                        hasChecked: false,
                        hasCalled: false,
                        showCard: false,
                        isSmallBlind: false,
                        isBigBlind: false
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
                        isOpen: false,
                        serve: false
                    }
                }, {
                    multi: true
                }, function (err, cumCards) {
                    fwCallback(err, cumCards);
                });
            }
        ], function (err, cumCards) {
            Player.blastSocket({
                newGame: true
            });
            callback(err, cumCards);
        });
        readLastValue = "";
        cardServed = false;
    },
    makeDealer: function (data, callback) {
        var Model = Player;
        async.waterfall([
            function (callback) {
                Player.update({}, {
                    $set: {
                        isDealer: false
                    }
                }, {
                    multi: true
                }, callback);
            },
            function (val, callback) {
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
                                startServe: function (callback) {
                                    CommunityCards.startServe(callback);
                                },
                                addDealer: function (callback) {
                                    players[playerIndex].isDealer = true;
                                    players[playerIndex].save(callback);
                                },
                                addSmallBlind: function (callback) {
                                    if (data.removeSmallBlind) {
                                        callback();
                                    } else {
                                        var nextPlayer = (playerIndex + 1) % players.length;
                                        players[nextPlayer].isSmallBlind = true;
                                        players[nextPlayer].save(callback);
                                    }

                                },
                                addBigBlind: function (callback) {
                                    var nextPlayer = 0;
                                    if (data.removeSmallBlind) {
                                        nextPlayer = (playerIndex + 1) % players.length;

                                    } else {
                                        nextPlayer = (playerIndex + 2) % players.length;

                                    }
                                    players[nextPlayer].isBigBlind = true;
                                    players[nextPlayer].save(callback);
                                },
                                addStraddle: function (callback) {

                                    var skipBlind = 2 + parseInt(data.straddle);
                                    if (data.removeSmallBlind) {
                                        skipBlind--;
                                    }
                                    var turnIndex = (playerIndex + skipBlind) % players.length;
                                    players[turnIndex].isLastBlind = true;
                                    players[turnIndex].save(callback);
                                }
                            }, function (err, data) {
                                Model.blastSocket();
                                callback(err, data);
                            });
                        } else {
                            callback("No Such Player");
                        }
                    }
                });
            }
        ], callback);
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

        CommunityCards.checkServe(function (err, dataserve) {
            if (err) {
                callback(err);
            } else {
                if (dataserve && dataserve.serve) {

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
                            var maxCommunityCard = 8;
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
                                        callback(err, "Card Provided to Player " + response.players[toServe].playerNo);
                                        if (playerCards.length + 1 == (playerCount * maxCardsPerPlayer)) {
                                            Player.makeTurn("LastPlayerCard", function (err, data) {
                                                Player.blastSocket({
                                                    player: true,
                                                    value: response.players[toServe].playerNo
                                                });
                                            });
                                        } else {
                                            Player.blastSocket({
                                                player: true,
                                                value: response.players[toServe].playerNo
                                            });
                                        }
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

                                        if (communityCardCount == 3 || communityCardCount == 5 || communityCardCount == 7) {
                                            Player.makeTurn(communityCardCount, function (err, data) {
                                                Player.blastSocket({
                                                    player: false,
                                                    community: true,
                                                    value: communityCardCount
                                                });
                                            });
                                        } else {
                                            Player.blastSocket({
                                                player: false,
                                                community: true,
                                                value: communityCardCount
                                            });
                                        }
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

                } else {
                    callback(dataserve);
                }
            }
        });

    },
    blastSocket: function (data, fromUndo) {
        Player.getAll({}, function (err, allData) {
            if (!fromUndo) {
                GameLogs.create(function () {});
            } else {
                allData.undo = true;
            }
            if (data && data.newGame) {
                allData.newGame = true;
            }

            if (err) {
                console.log(err);
            } else {
                if (data) {
                    allData.extra = data;
                } else {
                    allData.extra = {};
                }
                sails.sockets.blast("Update", allData);
            }
        });
    },
    blastSocketWinner: function (data) {
        var newWinner = _.filter(data.winners, function (n) {
            return n.winner;
        });
        var finalWinner = _.map(data.winners, function (n) {
            var obj = {
                cards: n.cards,
                descr: n.descr,
                playerNo: n.playerNo,
                winner: n.winner,
                showCard: n.showCard,
                rank: n.winRank
            };
            return obj;
        });
        sails.sockets.blast("ShowWinner", {
            data: finalWinner
        });
    },
    allIn: function (data, callback) {
        async.waterfall([
            function (callback) { // Remove All raise
                Player.update({}, {
                    $set: {
                        hasRaised: false,
                        isLastBlind: false,
                        hasCalled: false,
                        hasChecked: false,
                        hasRaisedd: false
                    }
                }, {
                    multi: true
                }, function (err, cards) {
                    callback(err);
                });
            },
            Player.currentTurn,
            function (player, callback) {
                player.isAllIn = true;
                player.hasRaised = true;
                player.save(function (err, data) {
                    callback(err);
                });
            },
            Player.changeTurn
        ], callback);
    },
    currentTurn: function (callback) {
        Player.findOne({
            isTurn: true
        }).exec(function (err, data) {
            if (err) {
                callback(err);
            } else if (_.isEmpty(data)) {
                callback("No Player Has Turn");
            } else {
                callback(null, data);
            }
        });
    },
    changeTurn: function (callback) {
        async.waterfall([
            Player.currentTurn,
            function (playerFromTop, callback) {
                Player.find({
                    $or: [{
                        isActive: true,
                        isFold: false,
                        isAllIn: false
                    }, {
                        isTurn: true
                    }]
                }).exec(function (err, players) {
                    if (err) {
                        callback(err);
                    } else {
                        var turnIndex = _.findIndex(players, function (n) {
                            return (n._id + "") == (playerFromTop._id + "");
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
                                Player.whetherToEndTurn(data.removeTurn[0], data.addTurn[0], function (err) {
                                    Player.blastSocket();
                                });
                            });
                        }
                    }
                });

            }
        ], callback);
    },
    makeTurn: function (cardNo, callback) {
        var findInitialObj = {};
        Player.find({
            isActive: true,
            isFold: false,
            isAllIn: false
        }).exec(function (err, data) {
            if (err || _.isEmpty(data)) {
                callback(err);
            } else {
                if (data.length > 1) {
                    async.waterfall([
                        function (callback) {
                            Player.update({}, {
                                $set: {
                                    hasRaised: false,
                                    isTurn: false
                                }
                            }, {
                                multi: true
                            }, function (err, cards) {
                                callback(err);
                            });
                        },
                        function (callback) { // There is an MAIN Error where there is no dealer or No isLastBlind
                            if (cardNo == "LastPlayerCard") {
                                async.waterfall([
                                    function (callback) {
                                        CommunityCards.closeServe(function (err, data) {
                                            callback(err);
                                        });
                                    },
                                    Player.findLastBlindNext
                                ], callback);
                            } else {
                                async.waterfall(
                                    [
                                        function (callback) {
                                            CommunityCards.closeServe(function (err) {
                                                callback(err);
                                            });
                                        },
                                        function (callback) {
                                            Player.update({}, {
                                                $set: {
                                                    hasRaised: false,
                                                    isLastBlind: false,
                                                    isTurn: false
                                                }
                                            }, {
                                                multi: true
                                            }, function (err) {
                                                callback(err);
                                            });
                                        },
                                        Player.findDealerNext
                                    ], callback);
                            }
                        },
                        function (player, callback) { // Enable turn from the same
                            player.isTurn = true;
                            player.save(callback);
                        }
                    ], callback);
                } else {
                    callback();
                }
            }
        });


    },
    raise: function (data, callback) {
        async.waterfall([
            function (callback) { // Remove All raise
                Player.update({}, {
                    $set: {
                        hasRaised: false,
                        isLastBlind: false,
                        hasCalled: false,
                        hasChecked: false,
                        hasRaisedd: false
                    }
                }, {
                    multi: true
                }, function (err, cards) {
                    callback(err);
                });
            },
            Player.currentTurn,
            function (player, callback) {
                player.hasRaised = true;
                player.hasRaisedd = true;
                player.save(function (err, data) {
                    callback(err);
                });
            },
            Player.changeTurn
        ], callback);
    },
    call: function (callback) {
        async.waterfall([
            function (callback) { // Remove All raise
                Player.update({}, {
                    $set: {
                        hasCalled: false,
                        hasChecked: false,
                        hasRaisedd: false
                    }
                }, {
                    multi: true
                }, function (err, cards) {
                    callback(err);
                });
            },
            Player.currentTurn,
            function (player, callback) {
                player.hasCalled = true;
                player.save(function (err, data) {
                    callback(err);
                });
            },
            Player.changeTurn
        ], callback);
    },
    check: function (callback) {
        async.waterfall([
            function (callback) { // Remove All raise
                Player.update({}, {
                    $set: {
                        hasCalled: false,
                        hasChecked: false,
                        hasRaisedd: false
                    }
                }, {
                    multi: true
                }, function (err, cards) {
                    callback(err);
                });
            },
            Player.currentTurn,
            function (player, callback) {
                player.hasChecked = true;
                player.save(function (err, data) {
                    callback(err);
                });
            },
            Player.changeTurn
        ], callback);
    },
    fold: function (data, callback) {
        async.waterfall([
            function (callback) { // Remove All raise
                Player.update({}, {
                    $set: {
                        hasCalled: false,
                        hasChecked: false,
                        hasRaisedd: false
                    }
                }, {
                    multi: true
                }, function (err, cards) {
                    callback(err);
                });
            },
            Player.currentTurn,
            function (player, callback) {
                player.isFold = true;
                player.save(function (err, data) {
                    callback(err);
                });
            },
            function (callback) {
                Player.find({
                    isFold: false,
                    isActive: true
                }).exec(function (err, data) {
                    if (err) {
                        callback(err);
                    } else {
                        if (data.length == 1) {
                            data[0].winner = true;
                            Player.blastSocketWinner({
                                winners: data
                            });
                            callback();
                        } else {
                            callback();
                        }
                    }

                });
            },
            Player.changeTurn
        ], callback);
    },
    whetherToEndTurn: function (fromPlayer, toPlayer, callback) {
        Player.find({
            $or: [{
                isActive: true,
                isAllIn: false
            }, {
                hasRaised: true
            }, {
                isDealer: true
            }]
        }).sort({
            playerNo: 1
        }).exec(function (err, allPlayers) {
            if (err) {
                callback(err);
            } else if (_.isEmpty(allPlayers)) {
                callback("No Players found in Whether to end turn");
            } else {

                var fromPlayerPartition = _.partition(allPlayers, function (n) {
                    return n.playerNo >= fromPlayer.playerNo;
                });

                var fromPlayerFirst = _.concat(fromPlayerPartition[0], fromPlayerPartition[1]);

                var toIndex = _.findIndex(fromPlayerFirst, function (n) {
                    return n.playerNo == toPlayer.playerNo;
                });
                var fromPlayerToPlayer = _.slice(fromPlayerFirst, 0, toIndex + 1);

                var removeAllTurn = false;
                var isWinner = false;
                // case 1 
                // When fromPlayer.isLastBlind checks
                if (fromPlayer.isLastBlind) {
                    red(1);
                    removeAllTurn = true;
                }

                // case 2
                // When toPlayer.hasRaised
                var isRaisedBetween = _.findIndex(fromPlayerToPlayer, function (n, index) {
                    return (n.hasRaised && index !== 0);
                });
                // Find Players between 
                if (isRaisedBetween > 0) {
                    red(2);
                    removeAllTurn = true;
                }

                // case 3
                // When fromPlayer.isDealer && noOne has Raised
                var lastRaise = _.findIndex(allPlayers, function (n) {
                    return n.hasRaised;
                });
                var lastBlind = _.findIndex(allPlayers, function (n) {
                    return n.isLastBlind;
                });

                var isDealerBetween = _.findIndex(fromPlayerToPlayer, function (n, index) {
                    return (n.isDealer && (index != (fromPlayerToPlayer.length - 1)));
                });
                // Find Players between 
                if (isRaisedBetween > 0) {
                    red(3);
                    removeAllTurn = true;
                }
                // Main Error in Dealer Related Search WHEN Dealer Folds
                if (lastRaise < 0 && lastBlind < 0 && isDealerBetween >= 0) {
                    removeAllTurn = true;
                }


                //case 4 from Player and To Player is Same
                if (fromPlayer.playerNo == toPlayer.playerNo) {
                    removeAllTurn = true;
                }


                if (removeAllTurn) {
                    //Show Winner to be checked
                    async.parallel({
                        removeServe: CommunityCards.startServe,
                        updatePlayers: function (callback) {
                            Player.update({}, {
                                $set: {
                                    hasRaised: false,
                                    isLastBlind: false,
                                    isTurn: false,
                                    hasCalled: false,
                                    hasChecked: false,
                                    hasRaisedd: false
                                }
                            }, {
                                multi: true
                            }, function (err) {
                                callback(err);
                            });
                        }
                    }, function (err, data) {
                        callback(err);
                    });

                } else {
                    callback(null);
                }
            }
        });


    },
    findLastBlindNext: function (callback) {
        async.waterfall([
            function (callback) {
                Player.findOne({
                    isLastBlind: true
                }).exec(callback);
            },
            Player.nextInPlay
        ], callback);

    },
    findDealerNext: function (callback) {
        async.waterfall([
            function (callback) {
                Player.findOne({
                    isDealer: true
                }).exec(callback);
            },
            Player.nextInPlay
        ], callback);
    },
    nextInPlay: function (player, callback) {
        if (player) {
            Player.find({
                isActive: true,
                isFold: false,
                isAllIn: false
            }).sort({
                playerNo: 1
            }).exec(function (err, players) {
                if (err) {
                    callback(err);
                } else if (_.isEmpty(players)) {
                    callback("No Next In Play");
                } else {
                    var finalPlayer = _.find(players, function (n) {
                        return (n.playerNo > player.playerNo);
                    });
                    if (finalPlayer) {
                        callback(err, finalPlayer);
                    } else {
                        callback(err, players[0]);
                    }
                }
            });
        } else {
            callback("No Player selected for Next");
        }
    },
    showPlayerCard: function (data, callback) {
        Player.findOne({
            "playerNo": data.playerNo
        }).exec(function (err, data) {
            if (err) {
                callback(err);
            } else {
                data.showCard = true;
                data.save(function () {
                    Player.showWinner(callback);
                });

            }
        });
    }
};
module.exports = _.assign(module.exports, exports, model);