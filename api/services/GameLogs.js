var schema = new Schema({
    players: Schema.Types.Mixed,
    cards: Schema.Types.Mixed
});

schema.plugin(deepPopulate, {});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);
module.exports = mongoose.model('GameLogs', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema));
var model = {
    create: function (callback) {
        Player.find({}).lean().exec(function (err, data) {
            var gameObject = GameLogs();
            gameObject.players = data;
            gameObject.save(callback);
        });
    },
    undo: function (callback) {

    }
};
module.exports = _.assign(module.exports, exports, model);