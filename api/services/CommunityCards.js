var schema = new Schema({
    cardNo: {
        type: Number,
        required: true
    },
    isOpen: {
        type: Boolean,
        default: false,
        required: true
    },
    cardValue: {
        type: String,
        default: "",

    },
    isBurn: {
        type: Boolean,
        default: false
    }

});
schema.plugin(deepPopulate, {


});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);
module.exports = mongoose.model('CommunityCards', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema));
var model = {
    createCards: function (callback) {
        var Model = this;
        var cardsNo = [1, 2, 3, 4, 5];
        //      async.waterfall([ function(wfCallback){
        _.each(cardsNo, function (value, key) {
            Model.saveData({
                cardNo: value
            }, function (err, data2) {
                if (err) {
                    if (value == 1) {
                        callback(err, data2);
                    }
                } else {}
            });
        });

        //}, ]);
        callback(null, "cards Created");
    }
};
module.exports = _.assign(module.exports, exports, model);