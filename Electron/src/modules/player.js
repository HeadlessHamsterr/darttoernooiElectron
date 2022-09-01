'use strict';

module.exports = class player{
    constructor(name){
        this.name = name;
        this.legsWon = 0;
        this.legsLost = 0;
        this.hiddenPoints = 0;
        this.gamesPlayed = 0;
    }

    convertToArray = function(){
        return [this.name, this.legsWon, this.legsLost, this.gamesPlayed];
    }
    calculateHiddenPoints = function(){
        this.hiddenPoints = this.legsWon - this.legsLost;
    }
}