module.exports = _.cloneDeep(require("sails-wohlig-controller"));

var controller = {
     addPlayer: function(req, res){
          Player.addPlayer(req.body, res.callback);   
     },
     updatePlayer: function(req, res){
        Player.updatePlayer(req.body, res.callback);   
    },
    deletePlayer: function(req, res){
        Player.deletePlayer(req.body, res.callback);   
   },
   getPlayers: function(req, res){
    Player.getPlayers( res.callback);   
   },
   findWinner: function(req, res){
    Player.findWinner(req.body, res.callback);   
   }


};

module.exports = _.assign(module.exports, controller);
