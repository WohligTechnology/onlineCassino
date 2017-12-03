var schema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    value: [{
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
    getCard: function (value, callback) {
        Card.findOne({
            value: value
        }).exec(callback);
    }
};
module.exports = _.assign(module.exports, exports, model);