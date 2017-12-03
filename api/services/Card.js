var schema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    values: [{
        type: String,
        required: true,
        index: true
    }]
});
schema.plugin(deepPopulate, {});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);
module.exports = mongoose.model('Card', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema));
var model = {
    getCard: function (value, name, suit) {

    },

    createCards: function (callback) {
        async.concatLimit(sails.config.cards, 10, function (card, callback) {
            var singleCard = Card(card);
            singleCard.save(callback);
        }, callback);
    }
};
module.exports = _.assign(module.exports, exports, model);