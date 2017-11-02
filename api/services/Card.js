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
    card: function (value, name, suit) {
        this.value = value;
        this.name = name;
        this.suit = suit;
    },

    createCards: function (callback) {
        var names = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'];
        var suits = ['h', 'd', 's', 'c'];
        var cards = {};
        cards.result = [];


        var i = 0;
        for (var s = 0; s < names.length; s++) {
            for (var n = 0; n < suits.length; n++) {
                var obj = {
                    name: names[s] + suits[n],
                    rfidNo: ++i
                };
                Card.saveData(obj, function (err, data2) {
                    if (err) {
                        callback(err, data2);
                    } else {
                        data3 = data2.toObject();
                    }
                });
            }
        }

        callback(null, "Added Successfully");
    }
};
module.exports = _.assign(module.exports, exports, model);