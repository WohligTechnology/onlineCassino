/*var schema = new Schema({
    name: {
        type: String,
        required: true,
      //  unique: true,
      //  uniqueCaseInsensitive: true,
        excel: {
            name: "Name"
        }
    }
});*/
var schema = new Schema({
    playerNo: {
        type: Number,
        required: true,
        unique: true,
       // excel: true,
    },
    isTurn: {
        type: Boolean,
        default:false
    },
    isActive:{
        type: Boolean,
        default:false
        
    },
    isFold: {
        type: Boolean,
        default:false
        
    },
    isDealer:{
        type: Boolean,
        default:false
    },
    cards:[String],
    // cards: [{
    //     type:Schema.Types.ObjectId,
    //     ref:'Card'
    // }],

    cardsServe:{
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
var exports = _.cloneDeep(require("sails-wohlig-service")(schema,"cards","cards"));
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
      updatePlayer: function(data, callback){

               var playerData = _.clone(data, true);
               //console.log(playerData);
               delete playerData.playerNo;
               console.log(playerData);
               console.log(data);
               // var error = playerData.validateSync();   
              // console.log(error);
                Player.update({"playerNo":data.playerNo}, playerData, {new: true,runValidators:true}, function(err, doc){
                    console.log(doc);
                    if(err){
                        callback(err);
                    }else{
                        callback(err,doc);
                    }
        });
        },
       deletePlayer:  function(data, callback){
        Player.findOne({"playerNo":data.playerNo}).exec(function (err, userData){
            console.log(userData);
            if(!_.isEmpty(userData)){
                userData.remove(function(err, data){
                    callback(err,"Deleted successfully");
                });
            }else{
            callback(err,userData);
            }
    });
},
   findWinner : function(data, callback){
    Player.find().exec(function (err, userData){
        console.log(userData);
        callback(err, userData);
       /* _.forEach(, function(value, key) {
            console.log(key);
          });*/
});
},
getAll: function(data, callback){
    var cards = {}
    Player.find({}).exec(
        function(err, plData){
            console.log(plData);
            cards.playerCards = plData ;
            var aggregate = [ { $match : { isOpen : true } },
                              { $group : { _id : "cardValue", comCards: { $push: "$cardValue" } } },
                              {$project: {_id:0, comCards:1}}
                            ];
            CommunityCards.aggregate(
               aggregate, function(err, cumData){
                   console.log(cumData);
                if(!_.isEmpty(cumData)){
                cards.communityCards = cumData[0].comCards;
                }
                
                callback(err, cards);
               }
            );      
       } 
    );    
},

getTabDetail: function(data, callback){
    var cards = {};
     Player.find({playerNo:data.tabId}).select('cards -_id' ).exec(
        function(err, playerCards){
            //console.log(playerCards[0].cards);
             cards.playerCards = playerCards[0].cards ;
             var aggregate = [ { $match : { isOpen : true } },
                               { $group : { _id : "cardValue", comCards: { $push: "$cardValue" } } },
                               {$project: {_id:0, comCards:1}}
                             ];
             CommunityCards.aggregate(
                aggregate,
                function(err, cumData){
                    //console.log(cumData);
                    if(!_.isEmpty(cumData)){
                    cards.communityCards = cumData[0].comCards;
                    }
                    callback(err, cards);
                   }
             )      
        }
     );
     
},
showWinner: function (callback){
    Player.find( {isActive:true, isFold: false } ).exec(function (err, userData){
        var playerData ={};
        var finalHands = [] ;
        var deckCards = [];
        CommunityCards.find({}).exec(function(err, deckCardsData){
              _.each(deckCardsData, function(value, key) {
                 //  _.each(value.cardValue, function(value1, key1){
                    deckCards.push(value.cardValue);  
               // });    
            });
        });
      //  console.log(userData);
       // var hand1 = Hand.solve(['Ad', 'As', 'Ac', 'Ah', '2d', '3c', 'Kd']);
        //console.log("hand1");
       // console.log(hand1.name);
     //  callback(err, hand1);
     _.forEach(userData, function(value, key) {
         var finalCards = [];
         var hand = {};
         _.forEach(value.cards, function(value, key){
            finalCards.push(value);     
         });

         _.forEach(deckCards, function(value, key){
            finalCards.push(value);     
         });
         console.log(finalCards);
          //var  cards =    value.cards;
          //console.log(value.cards);
          //finalCards.push(value.cards);
         // finalCards.push(deckCards);
          console.log(hand);
          hand = Hand.solve(finalCards);
          finalHands.push(hand);

        playerData[value.playerNo] = hand;
       // console.log("....."); 
        //console.log(value);

      });
     // callback(null, playerData);

       //var hand2 = Hand.solve(['ad', '2d',qty 'Jc', 'Th', '2d', 'Qs', 'Qd']);
     //callback(err, hand2);
    // //     console.log("hand2");
    // //     console.log(hand2.name);
    var winner = Hand.winners(finalHands);
    var PlayerNos = [];
    _.forEach(winner, function(WinnerData, key){
    _.forEach(playerData, function(value, key){
        if(JSON.stringify(WinnerData) === JSON.stringify(value) ){
           // callback(null, key);          
           console.log(key); 
           console.log(value); 
           console.log("Matched");
           PlayerNos.push({"player": key, "type":value.name});
           // break;  
           //winner
      
           //callback(null, {"player": key, "type":value.name});          
           
        }
     });
    });
    callback(null, PlayerNos);          
    //callback(null,winner[0]);
    //   console.log(winner[0]);
    //   if(JSON.stringify(winner[0]) === JSON.stringify(hand2) ){
    //     callback(null,"hand2");
    //   }else if(JSON.stringify(winner[0]) === JSON.stringify(hand1)){
    //     callback(null,"hand1");
    //   }else{
    //     callback(null,winner);
    //   }
    // //     //console.log(winner);
    // //    /* Player.find().exec(function (err, playerData){
    // //            console.log(playerData);
    // //     });*/

    });
},
revealCards: function(data, callback){

    CommunityCards.find({isOpen: true}).exec(function(err, cardsData){
             console.log(cardsData.length);
             var revealNo = cardsData.length;
             
   switch (revealNo){
       case 0: 
        CommunityCards.update({cardNo:{ $lt: 4}},{$set:{isOpen:true}},{multi:true},function(err, data){
       console.log(data);     
        callback(err,data);
 });
       break;
       case 3:
       CommunityCards.update({cardNo:4},{$set:{isOpen:true}},{multi:true},function(err, data){
        callback(err,data);
 });
       break;
       case 4:
       CommunityCards.update({cardNo:5},{$set:{isOpen:true}},{multi:true},function(err, data){
        callback(err,data);
 });   
       default:
       callback(null, "No more cards to reveal");
   }
            });
},
newGame: function(data, callback){
    var Model = this;
    async.waterfall([
      function(fwCallback){ 
    Model.update({},{$set:{isFold:false, isDealer:false, cards:[], isTurn:false,cardsServe:0}},{multi:true},function(err, cards){
        fwCallback(err, cards);           
    });
}, function(arg1, fwCallback){
    CommunityCards.update({},{$set:{cardValue: "", isOpen: false}},{multi:true}, function(err, cumCards){
        fwCallback(err, cumCards);  
 });
}
    ],function(err, cumCards){
          callback(err, cumCards);
    });
    readLastValue = "";
},
makeDealer: function(data, callback){
    var Model = this;
    Model.findOneAndUpdate({isDealer : true},{$set:{isDealer:false}},{new:true},function(err, CurrentTab){
       
     });
    Model.findOneAndUpdate({playerNo : data.tabId},{$set:{isDealer:true}},{new:true},function(err, CurrentTab){
       callback(err, CurrentTab);
    });
},
removeDealer: function(data, callback){
    var Model = this;
    Model.findOneAndUpdate({playerNo : data.tabId},{$set:{isDealer:false}},{new:true},function(err, CurrentTab){
       callback(err, CurrentTab);
    });
},
removeTab: function(data, callback){
    var Model = this;
    Model.findOneAndUpdate({playerNo : data.tabId},{$set:{isActive:false}},{new:true},function(err, currentTab){
     
       console.log(currentTab);
       callback(err, currentTab);
    });
},
fold:function(data, callback){
    var Model = this;
    
   
            Model.findOneAndUpdate({playerNo : data.tabId},{$set:{isFold:true}},{new:true},function(err, CurrentTab){
                Model.changeTurn(data, callback);         
    });
},
addTab:function(data, callback){
    var Model = this;
    Model.findOneAndUpdate({playerNo : data.tabId},{$set:{isActive:true}},{new:true},function(err, CurrentTab){
     
       console.log(CurrentTab);
       callback(err,CurrentTab);
     
    });
},
assignCard: function(card,wfCallback){
    var Model = this;
    console.log("inside assignCard");
    Model.findOneAndUpdate({isTurn : true, cardsServe : { $lt: 2 } },{$push:{cards:card},$inc: {cardsServe: 1} },{new:true},function(err, CurrentTab){
       if(!_.isEmpty(CurrentTab)){
        readLastValue = card;
        wfCallback(err, CurrentTab);
       }else{
            //$nin    
            CommunityCards.findOneAndUpdate(  {$or:[{cardValue:{$in:["",undefined,null] }},{cardValue:{$exists:false}}]},{cardValue: card},{new:true, sort:{cardValue:1}},function(err, CurrentTab){ 
                readLastValue = card;  
              //console.log(CurrentTab); 
              if(CurrentTab instanceof Array){
                wfCallback(err, CurrentTab);
              }else{
                wfCallback(err, "Extra Card");
              }
              
              //callback(null, "Repeated Card"); 
       });
      }  //console.log(CurrentTab);
     });
},
serve: function(data, callback){
    var Model = this;
    if(readLastValue != data.card){
    Model.find({isTurn:true}).exec(function(err, player){
        if(_.isEmpty(player)){
            async.waterfall([function(wfCallback){
            Model.find({isDealer:true}).exec(function(err, dealer){   
            Model.changeTurn({tabId:dealer[0].playerNo}, wfCallback);
        });
    }, function(arg1,wfCallback){
         Model.assignCard(data.card, wfCallback); 
    }
         ], function(err, result){
             callback(err, result);
         });
    }else{
        async.waterfall([function(wfCallback){
            Model.changeTurn({tabId:player[0].playerNo}, wfCallback);
    }, function(arg1,wfCallback){
        Model.assignCard(data.card,wfCallback); 
    }
    ], function(err, result){
        callback(err, result);
    });
}
    });   
}else{
    callback(null, "Repeated Card");
} 
},
moveTurn: function(data, callback){
    Model.find({isTurn:true}).exec(function(err, player){
        
    });
},
changeTurn: function(data, callback){
var Model = this;
Model.findOneAndUpdate({playerNo : data.tabId},{$set:{isTurn:false}},{new:true},function(err, CurrentTab){
   console.log(CurrentTab);
});
Model.find({playerNo :{ $gt: data.tabId},isActive:true,isFold:false}).sort({playerNo:1}).limit(1).exec(function(err, nextTab){
     if(_.isEmpty(nextTab)){
        Model.find({isActive:true,isFold:false}).sort({playerNo:1}).limit(1).exec(function(err, firstTab){
            console.log(firstTab[0].playerNo);
            if(!_.isEmpty(firstTab)){
            Model.findOneAndUpdate({playerNo : firstTab[0].playerNo},{$set:{isTurn:true}},{new:true},function(err, CurrentTab){
                console.log(CurrentTab);
                callback(err, CurrentTab);
             });               
            }    
        });
     }else{
        Model.findOneAndUpdate({playerNo : nextTab[0].playerNo},{$set:{isTurn:true}},{new:true},function(err, CurrentTab){
            console.log(CurrentTab);
            callback(err, CurrentTab);
         });                  
     }
   //console.log(result);
 //  result.isTurn
});     
}
    


};
module.exports = _.assign(module.exports, exports, model);