module.exports = _.cloneDeep(require("sails-wohlig-controller"));
var controller = {
    createCards : function(req, res){
        CommunityCards.createCards(res.callback); 
    }
};
module.exports = _.assign(module.exports, controller);
