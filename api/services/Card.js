var schema = new Schema({
    rfidNo: {
        type: String,
        required: true,
        unique: true,
        
    },
    name: {
        type: String,
        required: true,
        required: true
    }
});
schema.plugin(deepPopulate, {});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);
module.exports = mongoose.model('Card', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema));
var model = {
    card :function (value, name, suit){
        this.value = value;
        this.name = name;
        this.suit = suit;
    },
    
   createCards: function (callback){
        var names = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'];
        var suits = ['h','d','s','c'];
        var cards = {};
        cards.result = [];

        
       
        for( var s = 0; s < names.length; s++ ) {
            for( var n = 0; n < suits.length; n++ ) {
                cards.result.push( names[s] + suits[n]);
            }
        }
       console.log(cards);
        callback(null,cards);
    }
};
module.exports = _.assign(module.exports, exports, model);