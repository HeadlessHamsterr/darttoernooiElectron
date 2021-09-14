/*
Todo:
    - Poule winnaar berekenen: 
      Functie returnt array foo[0] = winnaar, foo[1] = tweede plaats
      werking: copy players -> playersCopy, foo[0] = max(playersCopy), splice foo[0] uit playersCopy, foo[1] = max(playersCopy)
    - Rest van de games maken
    - CSS fixen, shit is lelijk
*/

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
    #numGames;
    constructor(pouleNum){
        this.pouleNum = pouleNum;
        this.players = [];
        this.winner = "";
        this.secondPlace = "";
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

        this.#numGames = (this.factorial(this.players.length)/(2*this.factorial(this.players.length-2)));

        for(let i = 0; i < this.#numGames; i++){
            var gameTable = $('<table class="pouleGamesTable"></table>');
            $(pouleGamesDiv).append(gameTable);
            $(pouleGamesDiv).append($('<hr>'));

            var gameLabels = $(`<tr><td><p1 id="game${this.pouleNum}${i+1}1Name">${this.players[gameFormat[i][0]][0]}</p1></td><td><p1>-</p1></td><td><p1 id="game${this.pouleNum}${i+1}2Name">${this.players[gameFormat[i][1]][0]}</p1></td></tr>`);
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
        var playersCopy = []
        Array.prototype.push.apply(playersCopy, this.players);
        playersCopy.sort(function(a,b){return(b[1]-a[1])});

        var pouleTable = document.getElementById(`poule${this.pouleNum}Table`);
        var pouleTableHeader = $('<tr><th>Speler</th><th>Score</th></tr>');

        $(pouleTable).empty();
        $(pouleTable).append(pouleTableHeader);

        for(let i in playersCopy){
            if(typeof playersCopy[i][1] == 'undefined'){
                playersCopy[i][1] = 0;
            }

            var tableEntry = $(`<tr><td>${playersCopy[i][0]}</td><td>${playersCopy[i][1]}</td></tr>`);
            $(pouleTable).append(tableEntry);
        }
    }

    updatePoints(){
        var points = [];
        for(let i = 0; i < this.players.length; i++){
            points.push(0);
        }

        for(let i = 0; i < this.#numGames; i++){
            var points1 = document.getElementById(`game${this.pouleNum}${i+1}1Score`).value;
            var points2 = document.getElementById(`game${this.pouleNum}${i+1}2Score`).value;

            points1 = parseInt(points1);
            points2 = parseInt(points2);

            if(isNaN(points1)){
                points1 = 0;
            }

            if(isNaN(points2)){
                points2 = 0;
            }

            points[gameFormat[i][0]] = points[gameFormat[i][0]] + points1;
            points[gameFormat[i][1]] = points[gameFormat[i][1]] + points2;
        }

        for(let i = 0; i < this.players.length; i++){
            this.players[i][1] = points[i];
        }

        this.sort();
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
    
    var PLAYERS_PER_POULE = numPlayers/numPoules;

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
    $(poulesDiv).show();
}

setInterval(function sortPoules(){
    if(typeof pouleA.players !== 'undefined' && pouleA.players.length > 0){
        pouleA.updatePoints();
    }

    if(typeof pouleB.players !== 'undefined' && pouleB.players.length > 0){
        pouleB.updatePoints();
    }

    if(typeof pouleC.players !== 'undefined' && pouleC.players.length > 0){
        pouleC.updatePoints();
    }

    if(typeof pouleD.players !== 'undefined' && pouleD.players.length > 0){
        pouleD.updatePoints();
    }
}, 500);
