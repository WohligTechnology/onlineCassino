var schema = new Schema({
    cardNo: {
        type: Number,
        required: true
    },
    isOpen:{
        type: Boolean,
        required: true
    },
    cardValue:{
        type: Schema.Types.ObjectId,
        ref: 'Card',
        required: true
    }
});
schema.plugin(deepPopulate, {
    populate: {
        'cardValue': {
            select: ''
        }
    }
});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);
module.exports = mongoose.model('CommunityCards', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema, 'cardValue', 'cardValue'));
var model = {};
module.exports = _.assign(module.exports, exports, model);