module.exports = _.cloneDeep(require("sails-wohlig-controller"));
var controller = {
    createCards: function (req, res) {
        Card.createCards(res.callback);
    }
};
module.exports = _.assign(module.exports, controller);