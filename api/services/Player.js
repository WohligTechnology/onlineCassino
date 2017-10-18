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
    password: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        default: 'Fold',
        enum: ['Fold', 'Play', 'Paid']
    },
    dealer:{
        type: String,
        default: 'no',
        enum: ['Yes', 'No']
    },

    cards: [{
        type:Schema.Types.ObjectId,
        ref:'Card'
    }]
    
          
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
getPlayers: function (callback){
    Player.find( { } ).deepPopulate("cards").exec(function (err, userData){
        var playerData ={};
        var finalHands = [] ;
        var deckCards = ['5h', '6h', '7h', '8h', '4h'];
      //  console.log(userData);
       // var hand1 = Hand.solve(['Ad', 'As', 'Ac', 'Ah', '2d', '3c', 'Kd']);
        //console.log("hand1");
       // console.log(hand1.name);
     //  callback(err, hand1);
     _.forEach(userData, function(value, key) {
         var finalCards = [];
         var hand = {};
         _.forEach(value.cards, function(value, key){
            finalCards.push(value.name);     
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

       //var hand2 = Hand.solve(['ad', '2d', 'Jc', 'Th', '2d', 'Qs', 'Qd']);
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
    


};
module.exports = _.assign(module.exports, exports, model);