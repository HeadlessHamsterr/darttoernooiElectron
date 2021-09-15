/*
Todo:
    - Rest van de games maken
    - CSS fixen, shit is lelijk
*/
let $ = require('jquery');
let jetpack = require('fs-jetpack');

var numPlayers = 0;
var numPoules = 0;

var players = [];
var gameFormat = [[0, 1], [0, 2], [1, 2], [0, 3], [1, 3], [2, 3], [0, 4], [1, 4], [2, 4], [3, 4]];

const subBtn = document.getElementById('subBtn');
subBtn.onclick = getGameInfo;

const saveBtn = document.getElementById('saveBtn');
saveBtn.onclick = exportGameInfo;

const makePoulesBtn = document.getElementById('mkPoulesBtn');

$(document.getElementById('playerInputDiv')).hide();
$(document.getElementById('poulesDiv')).hide();
$(saveBtn).hide();

class pouleGames{
    #numGames;
    #winnerPrinted = false;
    constructor(pouleNum){
        this.pouleNum = pouleNum;
        this.players = [];
        this.winner = "";
        this.secondPlace = "";
    }

    makePoule(){
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
        var gamesDiv = document.getElementById('pouleGames');
        var pouleGamesDiv = $(`<div id='poule${this.pouleNum}Games' class='pouleGamesDiv'></div>`);
        var pouleGamesHeader = $(`<header class="pouleGamesHeader"><h1>Poule ${this.pouleNum}:</h1></header><hr>`);
        var gameTable = $('<table class="pouleGamesTable"></table>');

        $(gamesDiv).append(pouleGamesDiv);
        $(pouleGamesDiv).append(pouleGamesHeader);
        $(pouleGamesDiv).append(gameTable);
        
        this.#numGames = (this.factorial(this.players.length)/(2*this.factorial(this.players.length-2)));

        for(let i = 0; i < this.#numGames; i++){
            var gameLabels = $(`<tr><td><p1 id="game${this.pouleNum}${i+1}1Name">${this.players[gameFormat[i][0]][0]}</p1></td><td><p1>-</p1></td><td><p1 id="game${this.pouleNum}${i+1}2Name">${this.players[gameFormat[i][1]][0]}</p1></td></tr>`);
            var gameInputs = $(`<tr><td><input id="game${this.pouleNum}${i+1}1Score" type="number" class="gameScore"></td><td><p1>-</p1></td><td><input id="game${this.pouleNum}${i+1}2Score" type="number" class="gameScore"></td></tr><hr>`);
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

        if(this.allGamesPlayed() && !this.#winnerPrinted){
            var playersCopy = [];
            Array.prototype.push.apply(playersCopy, this.players);
            playersCopy.sort(function(a,b){return(b[1]-a[1])})

            console.log(`Winnaar poule ${this.pouleNum}: ${playersCopy[0][0]}`);
            console.log(`Tweede plaats poule ${this.pouleNum}: ${playersCopy[1][0]}`);
            this.#winnerPrinted = true;
        }
    }

    allGamesPlayed(){
        for(let i = 0; i < this.#numGames; i++){
            var points1 = document.getElementById(`game${this.pouleNum}${i+1}1Score`).value;
            var points2 = document.getElementById(`game${this.pouleNum}${i+1}2Score`).value;

            points1 = parseInt(points1);
            points2 = parseInt(points2);

            if(isNaN(points1) || isNaN(points2)){
                return false;
            }
        }
        return true;
    }
}

let pouleA = new pouleGames("A");
let pouleB = new pouleGames("B");
let pouleC = new pouleGames("C");
let pouleD = new pouleGames("D");

function getGameInfo(){
    numPlayers = document.getElementById("numPlayers").value;
    numPoules = document.getElementById('numPoules').value;

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
    $("div").hide();
    $(saveBtn).show();

    var poulesDiv = document.getElementById('poulesDiv');

    for(let i = 0; i < numPlayers; i++){
        var playerName = document.getElementById(`player${i}`).value;
        players.push(playerName);
    }

    players.sort(function(a,b){return 0.5 - Math.random()});
    
    var PLAYERS_PER_POULE = numPlayers/numPoules;

    for(let i = 0; i < numPlayers; i++){
        if(i < PLAYERS_PER_POULE){
            var tempArray = [players[i], 0];
            pouleA.players.push(tempArray);
        }else if(PLAYERS_PER_POULE <= i && i < (2*PLAYERS_PER_POULE)){
            var tempArray = [players[i], 0];
            pouleB.players.push(tempArray);
        }else if((2*PLAYERS_PER_POULE) <= i && i < (3*PLAYERS_PER_POULE)){
            var tempArray = [players[i], 0];
            pouleC.players.push(tempArray);
        }else if((3*PLAYERS_PER_POULE) <= i && i < (4*PLAYERS_PER_POULE)){
            var tempArray = [players[i], 0];
            pouleD.players.push(tempArray);
        }
    }

    if(pouleExists(pouleA)){
        pouleA.makePoule();
        pouleA.makeGames();
    }

    if(pouleExists(pouleB)){
        pouleB.makePoule();
        pouleB.makeGames();
    }

    if(pouleExists(pouleC)){
        pouleC.makePoule();
        pouleC.makeGames();
    }

    if(pouleExists(pouleD)){
        pouleD.makePoule();
        pouleD.makeGames();
    }
    $(poulesDiv).show();
}

setInterval(function sortPoules(){
    if(pouleExists(pouleA)){
        pouleA.updatePoints();
    }

    if(pouleExists(pouleB)){
        pouleB.updatePoints();
    }

    if(pouleExists(pouleC)){
        pouleC.updatePoints();
    }

    if(pouleExists(pouleD)){
        pouleD.updatePoints();
    }
}, 500);

function pouleExists(poule){
    if(typeof poule.players !== 'undefined' && poule.players.length > 0){
        return true;
    }else{
        return false;
    }
}

function exportGameInfo(){
    var jsonStr = '{"games":[]}'

    if(pouleExists(pouleA)){
        jsonObj = JSON.parse(jsonStr)
        jsonObj["games"].push({"pouleA":[]});
        jsonStr = JSON.stringify(jsonObj);
        console.log(jsonObj);
        for(let i = 0; i < pouleA.players.length; i++){
            console.log(i)
            jsonObj = JSON.parse(jsonStr);

            jsonObj["pouleA"].push({"name": `${pouleA.players[i][0]}`, "points": `${pouleA.players[i][1]}`});
            jsonStr = JSON.stringify(jsonObj);
        }

        console.log(jsonStr);
    }

    if(pouleExists(pouleB)){
        obj["pouleGames"].push('{"pouleB":[]}');
        /*for(let i = 0; i < pouleB.players.length; i++){
            obj["pouleB"].push({i:[]});
            obj[`${i}`].push('{"name": pouleB.players[i][0], "points": pouleB.players[i][1]}');
        }*/
    }

    if(pouleExists(pouleC)){
        obj["pouleGames"].push('{"pouleC":[]}');
        for(let i = 0; i < pouleC.players.length; i++){
            obj["pouleC"].push({i:[]});
            obj[`${i}`].push('{"name": pouleC.players[i][0], "points": pouleC.players[i][1]}');
        }
    }

    if(pouleExists(pouleD)){
        obj["pouleGames"].push('{"pouleD":[]}');
        for(let i = 0; i < pouleD.players.length; i++){
            obj["pouleD"].push({i:[]});
            obj[`${i}`].push('{"name": pouleD.players[i][0], "points": pouleD.players[i][1]}');
        }
    }

    jsonObj = JSON.parse(jsonStr)
    jetpack.write('game.json', jsonObj);
}