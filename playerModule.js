var playerModule = (function () {
    /**
     * Constructor initialize object
     * @constructor
     */
    var Player = function (name) {
        this.name = name;
        this.id = id;
    };

    Player.prototype.print = function () {
        console.log('Name is :'+ this.name);
    };

    return {
        Player: Player
    }
}());


//class Player {
//   constructor(name, id){
//  this.name = name;
//   this.id = id;
//   }
//}

module.exports = playerModule;