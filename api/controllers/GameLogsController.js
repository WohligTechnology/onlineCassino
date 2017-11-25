module.exports = _.cloneDeep(require("sails-wohlig-controller"));
var controller = {
    undo: function (req, res) {
        Player.undo(res.callback);
    }
};
module.exports = _.assign(module.exports, controller);