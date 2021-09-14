let $ = require('jquery');

var numPlayers = 0;
var numPoules = 0;

var players = [];
var gameFormat = [[0, 1], [0, 2], [1, 2], [0, 3], [1, 3], [2, 3], [0, 4], [1, 4], [2, 4], [3, 4]];

const subBtn = document.getElementById('subBtn');
subBtn.onclick = getGameInfo;

const makePoulesBtn = document.getElementById('mkPoulesBtn');

$(document.getElementById('playerInputDiv')).hide();
$(document.getElementById('poulesDiv')).hide();

class pouleGames{
    constructor(pouleNum){
        this.pouleNum = pouleNum;
        this.players = [];
    }

    makePoule(){
        console.log(`Making poule ${this.pouleNum}`);
        var poulesDiv = document.getElementById('poulesDiv');

        if(typeof this.players !== 'undefined' && this.players.length > 0){
            var playerDiv = $(`<div id="poule${this.pouleNum}" class="pouleDiv"></div>`);
            var pouleHeader = $(`<header class="pouleHeader"><h2>Poule ${this.pouleNum}:</h2><hr/><header>`);
            var pouleTable = $(`<table class="pouleTable" id="poule${this.pouleNum}Table"></table>`);
            var pouleTableHeader = $('<tr><th>Speler</th><th>Score</th></tr>');

            $(poulesDiv).append(playerDiv);
            $(playerDiv).append(pouleHeader);
            $(playerDiv).append(pouleTable);
            $(pouleTable).append(pouleTableHeader);

            for(let i in this.players){
                var tableEntry = $(`<tr><td>${this.players[i][0]}</td><td>${this.players[i][1]}</td></tr>`);
                $(pouleTable).append(tableEntry);
            }
        }
    }

    makeGames(){
        console.log("Making games");
        var gamesDiv = document.getElementById('pouleGames');
        var pouleGamesDiv = $(`<div id='poule${this.pouleNum}Games' class='pouleGamesDiv'></div>`);
        var pouleGamesHeader = $(`<header class="pouleGamesHeader"><h1>Poule ${this.pouleNum}:</h1></header><hr>`);

        $(gamesDiv).append(pouleGamesDiv);
        $(pouleGamesDiv).append(pouleGamesHeader);

        var numGames = (this.factorial(this.players.length)/(2*this.factorial(this.players.length-2)));

        for(let i = 0; i < numGames; i++){
            var gameTable = $('<table class="pouleGamesTable"></table>');
            $(pouleGamesDiv).append(gameTable);
            $(pouleGamesDiv).append($('<hr>'));

            var gameLabels = $(`<tr><td><p1 id="game${this.pouleNum}${i+1}1Name">${this.players[gameFormat[i][0]][0]}</p1></td><td><p1>-</p1></td><td><p1 id="ame${this.pouleNum}${i+1}2Name">${this.players[gameFormat[i][1]][0]}</p1></td></tr>`);
            var gameInputs = $(`<tr><td><input id="game${this.pouleNum}${i+1}1Score" type="number" class="gameScore"></td><td><p1>-</p1></td><td><input id="game${this.pouleNum}${i+1}2Score" type="number" class="gameScore"></td></tr>`);
            $(gameTable).append(gameLabels);
            $(gameTable).append(gameInputs);
        }

        $(gamesDiv).show();
    }

    factorial(n){
        if(n === 0 || n === 1){
            return n;
        }

        var result = 1;

        for(let i = 1; i <= n; i++){
            result = result*i;
        }
        return result;
    }

    addPlayer(playerInfo){
        this.players.append(playerInfo);
    }

    sort(){
        this.players.sort(function(a,b){return(b[1]-a[1])});
        console.log(this.players);

        var pouleTable = document.getElementById(`poule${this.pouleNum}Table`);
        var pouleTableHeader = $('<tr><th>Speler</th><th>Score</th></tr>');

        $(pouleTable).empty();
        $(pouleTable).append(pouleTableHeader);

        for(let i in this.players){
            var tableEntry = $(`<tr><td>${this.players[i][0]}</td><td>${this.players[i][1]}</td></tr>`);
            $(pouleTable).append(tableEntry);
        }
    }
}

let pouleA = new pouleGames("A");
let pouleB = new pouleGames("B");
let pouleC = new pouleGames("C");
let pouleD = new pouleGames("D");

function getGameInfo(){
    numPlayers = document.getElementById("numPlayers").value;
    numPoules = document.getElementById('numPoules').value;

    console.log(numPlayers);
    console.log(numPoules);

    //$(document.getElementById('gameSetup')).hide();
    $("div").hide();
    $(document.getElementById('playerInputDiv')).show();
    $(document.getElementById('playerInputSubDiv')).show();

    var playerInputForm = document.getElementById('playerInputForm');

    for(let i = 0; i < numPlayers; i++){
        //var playerInput = $(`<input type='text' id='player${i}'></input>`).attr(`Speler ${i}`);
        var playerInput = document.createElement("input");
        playerInput.setAttribute("id", `player${i}`);
        playerInput.setAttribute("placeholder", `Speler ${i+1}`);
        playerInput.setAttribute("class", "playerInput");
        $(playerInputForm).append(playerInput);
    }

    makePoulesBtn.onclick = makePoules;
}

function makePoules(){
    console.log("Making poules");
    $("div").hide();

    var poulesDiv = document.getElementById('poulesDiv');

    for(let i = 0; i < numPlayers; i++){
        var playerName = document.getElementById(`player${i}`).value;
        players.push(playerName);
    }

    players.sort(function(a,b){return 0.5 - Math.random()});
    console.log(players);
    
    var PLAYERS_PER_POULE = numPlayers/numPoules;
    console.log(PLAYERS_PER_POULE);

    for(let i = 0; i < numPlayers; i++){
        if(i < PLAYERS_PER_POULE){
            var tempArray = [players[i], i];
            pouleA.players.push(tempArray);
        }else if(PLAYERS_PER_POULE <= i && i < (2*PLAYERS_PER_POULE)){
            var tempArray = [players[i], i];
            pouleB.players.push(tempArray);
        }else if((2*PLAYERS_PER_POULE) <= i && i < (3*PLAYERS_PER_POULE)){
            var tempArray = [players[i], i];
            pouleC.players.push(tempArray);
        }else if((3*PLAYERS_PER_POULE) <= i && i < (4*PLAYERS_PER_POULE)){
            var tempArray = [players[i], i];
            pouleD.players.push(tempArray);
        }
    }

    if(typeof pouleA.players !== 'undefined' && pouleA.players.length > 0){
        pouleA.makePoule();
        pouleA.makeGames();
    }

    if(typeof pouleB.players !== 'undefined' && pouleB.players.length > 0){
        pouleB.makePoule();
        pouleB.makeGames();
    }

    if(typeof pouleC.players !== 'undefined' && pouleC.players.length > 0){
        pouleC.makePoule();
        pouleC.makeGames();
    }

    if(typeof pouleD.players !== 'undefined' && pouleD.players.length > 0){
        pouleD.makePoule();
        pouleD.makeGames();
    }

    console.log(pouleA.players);
    console.log(pouleB.players);
    console.log(pouleC.players);
    console.log(pouleD.players);
    
    $(poulesDiv).show();
}
setInterval(function sortPoules(){
    console.log("Poules sorteren...");

    if(typeof pouleA.players !== 'undefined' && pouleA.players.length > 0){
        pouleA.sort();
    }

    if(typeof pouleB.players !== 'undefined' && pouleB.players.length > 0){
        pouleB.sort();
    }

    if(typeof pouleC.players !== 'undefined' && pouleC.players.length > 0){
        pouleC.sort();
    }

    if(typeof pouleD.players !== 'undefined' && pouleD.players.length > 0){
        pouleD.sort();
    }
}, 500);