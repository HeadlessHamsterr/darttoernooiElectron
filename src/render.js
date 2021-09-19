/*
Todo:
    - Rest van de games maken
    - CSS fixen, shit is lelijk
*/
let $ = require('jquery');
let fs = require('fs');
let path = require('path');
const { combinedDisposable } = require('custom-electron-titlebar/common/lifecycle');

var numPlayers = 0;
var numPoules = 0;

var players = [];
var gameFormat = [[0, 1], [0, 2], [1, 2], [0, 3], [1, 3], [2, 3], [0, 4], [1, 4], [2, 4], [3, 4]];

const newGameBtn = document.getElementById('newGameBtn');
newGameBtn.onclick = drawSetup;

const loadGameBtn = document.getElementById('loadGameBtn');
loadGameBtn.onclick = loadGame;

const subBtn = document.getElementById('subBtn');
subBtn.onclick = getGameInfo;

const saveBtn = document.getElementById('saveBtn');
saveBtn.onclick = exportGameInfo;

const makePoulesBtn = document.getElementById('mkPoulesBtn');

$("div").hide();
$(document.getElementById('gameOptions')).show();
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

        var playersCopy = [];
        Array.prototype.push.apply(playersCopy, this.players);
        playersCopy.sort(function(a,b){return b[1] - a[1]});

        this.winner = playersCopy[0][0];
        this.secondPlace = playersCopy[1][0]
        return true;
    }

    numGames(){
        return this.#numGames;
    }
}

let pouleA = new pouleGames("A");
let pouleB = new pouleGames("B");
let pouleC = new pouleGames("C");
let pouleD = new pouleGames("D");

function drawSetup(){
    console.log("New game...")
    $("div").hide();
    $(document.getElementById('gameSetup')).show();
    $(document.getElementById('gameSetupSubDiv')).show();

    startPoulesSorting();
}

function loadGame(){
    $("div").hide();
    pouleA.players = [];
    pouleB.players = [];
    pouleC.players = [];
    pouleD.players = [];

    let jsonString = fs.readFileSync(path.resolve(__dirname, 'game.json'), function(err){
        if(err){
            console.log(err);
        }
    });
    let jsonObj = JSON.parse(jsonString);

    var numPoules = jsonObj["poules"].length;
    
    //Load Poule A
    if(numPoules >= 1){
        loadPoulGames("A", jsonObj);
    }

    //Load Poule B
    if(numPoules >= 2){
        loadPoulGames("B", jsonObj);
    }

    //Load Poule C
    if(numPoules >= 3){
        loadPoulGames("C", jsonObj);
    }

    //Load Poule D
    if(numPoules >= 4){
        loadPoulGames("D", jsonObj);
    }

    
    $(poulesDiv).show();
    $(saveBtn).show();
    $(document.getElementById('mainRosterDiv')).show();
    $(document.getElementById('mainRosterSubDiv')).show();
    $(document.getElementById('gameDiv')).show();
    startPoulesSorting();
}

function loadPoulGames(pouleLetter, jsonObj){
    pouleLetter = pouleLetter.toUpperCase();

    var indexInJson = 0;
    var pouleToEdit;

    switch(pouleLetter){
        case "A":
            indexInJson = 0;
            pouleToEdit = pouleA;
        break;
        case "B":
            indexInJson = 1;
            pouleToEdit = pouleB;
        break;
        case "C":
            indexInJson = 2;
            pouleToEdit = pouleC;
        break;
        case "D":
            indexInJson = 3;
            pouleToEdit = pouleD;
    }

    for(let i = 0; i < jsonObj["poules"][indexInJson][`poule${pouleLetter}`][0]["numPlayers"]; i++){
        playerName = jsonObj["poules"][indexInJson][`poule${pouleLetter}`][1]["players"][i]["name"];
        playerScore = jsonObj["poules"][indexInJson][`poule${pouleLetter}`][1]["players"][i]["points"];

        tempArray = [playerName, playerScore];

        pouleToEdit.players.push([playerName, playerScore]);
    }

    pouleToEdit.makePoule();
    pouleToEdit.makeGames();

    for(let i = 0; i < pouleToEdit.numGames(); i++){
        gameScore1Saved = jsonObj["poules"][indexInJson][`poule${pouleLetter}`][2]["games"][i]["score1"];
        gameScore2Saved = jsonObj["poules"][indexInJson][`poule${pouleLetter}`][2]["games"][i]["score2"];

        if(gameScore1Saved > 0 || gameScore2Saved > 0){
            gameScore1Field = document.getElementById(`game${pouleLetter}${i+1}1Score`);
            gameScore2Field = document.getElementById(`game${pouleLetter}${i+1}2Score`);
            gameScore1Field.value = gameScore1Saved;
            gameScore2Field.value = gameScore2Saved;
        }
    }
}

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
    $(saveBtn).show();
    $(document.getElementById('mainRosterDiv')).show();
    $(document.getElementById('mainRosterSubDiv')).show();
    $(document.getElementById('gameDiv')).show();
}


function startPoulesSorting(){
    setInterval(function sortPoules(){
        if(pouleExists(pouleA)){
            pouleA.updatePoints();

            if(pouleA.allGamesPlayed()){
                document.getElementById('M11Name').innerHTML = pouleA.winner;
                document.getElementById('M22Name').innerHTML = pouleA.secondPlace;
            }
        }
    
        if(pouleExists(pouleB)){
            pouleB.updatePoints();

            if(pouleB.allGamesPlayed()){
                document.getElementById('M21Name').innerHTML = pouleB.winner;
                document.getElementById('M32Name').innerHTML = pouleB.secondPlace;
            }
        }
    
        if(pouleExists(pouleC)){
            pouleC.updatePoints();

            if(pouleC.allGamesPlayed()){
                document.getElementById('M31Name').innerHTML = pouleC.winner;
                document.getElementById('M42Name').innerHTML = pouleC.secondPlace;
            }
        }
    
        if(pouleExists(pouleD)){
            pouleD.updatePoints();

            if(pouleD.allGamesPlayed()){
                document.getElementById('M41Name').innerHTML = pouleD.winner;
                document.getElementById('M12Name').innerHTML = pouleD.secondPlace;
            }
        }
    }, 500);
}

function pouleExists(poule){
    if(typeof poule.players !== 'undefined' && poule.players.length > 0){
        return true;
    }else{
        return false;
    }
}

function exportGameInfo(){
    var jsonObj = {"poules":[]};

    if(pouleExists(pouleA)){
        jsonObj["poules"].push({"pouleA":[]})
        jsonObj["poules"][0]["pouleA"].push({"numPlayers": pouleA.players.length})
        jsonObj["poules"][0]["pouleA"].push({"players":[]});
        for(let i = 0; i < pouleA.players.length; i++){
            console.log(i)
            console.log(jsonObj)

            player = pouleA.players[i][0];
            points = parseInt(pouleA.players[i][1]);

            if(isNaN(points)){
                points = 0;
            }

            jsonObj["poules"][0]["pouleA"][1]["players"].push({"name": player, "points": points});
        }

        jsonObj["poules"][0]["pouleA"].push({"games":[]});

        for(let i = 0; i < pouleA.numGames(); i++){
            var player1 = document.getElementById(`gameA${i+1}1Name`).innerHTML;
            var score1 = document.getElementById(`gameA${i+1}1Score`).value;
            var player2 = document.getElementById(`gameA${i+1}2Name`).innerHTML;
            var score2 = document.getElementById(`gameA${i+1}2Score`).value;

            score1 = parseInt(score1);
            score2 = parseInt(score2);

            if(isNaN(score1)){
                score1 = 0;
            }

            if(isNaN(score2)){
                score2 = 0;
            }

            jsonObj["poules"][0]["pouleA"][2]["games"].push({"player1": player1, "score1": score1, "player2": player2, "score2": score2});
        }

        console.log(jsonObj);
    }

    if(pouleExists(pouleB)){
        jsonObj["poules"].push({"pouleB":[]});
        jsonObj["poules"][1]["pouleB"].push({"numPlayers": pouleB.players.length});
        jsonObj["poules"][1]["pouleB"].push({"players":[]});
        for(let i = 0; i < pouleB.players.length; i++){
            console.log(i)
            console.log(jsonObj)

            player = pouleB.players[i][0];
            points = parseInt(pouleB.players[i][1]);

            if(isNaN(points)){
                points = 0;
            }

            jsonObj["poules"][1]["pouleB"][1]["players"].push({"name": player, "points": points});
        }

        jsonObj["poules"][1]["pouleB"].push({"games":[]});

        for(let i = 0; i < pouleB.numGames(); i++){
            var player1 = document.getElementById(`gameB${i+1}1Name`).innerHTML;
            var score1 = document.getElementById(`gameB${i+1}1Score`).value;
            var player2 = document.getElementById(`gameB${i+1}2Name`).innerHTML;
            var score2 = document.getElementById(`gameB${i+1}2Score`).value;

            score1 = parseInt(score1);
            score2 = parseInt(score2);

            if(isNaN(score1)){
                score1 = 0;
            }

            if(isNaN(score2)){
                score2 = 0;
            }

            jsonObj["poules"][1]["pouleB"][2]["games"].push({"player1": player1, "score1": score1, "player2": player2, "score2": score2});
        }

        console.log(jsonObj);
    }

    if(pouleExists(pouleC)){
        jsonObj["poules"].push({"pouleC":[]});
        jsonObj["poules"][2]["pouleC"].push({"numPlayers": pouleC.players.length});
        jsonObj["poules"][2]["pouleC"].push({"players":[]});
        for(let i = 0; i < pouleC.players.length; i++){
            console.log(i)
            console.log(jsonObj)

            player = pouleC.players[i][0];
            points = parseInt(pouleC.players[i][1]);

            if(isNaN(points)){
                points = 0;
            }

            jsonObj["poules"][2]["pouleC"][1]["players"].push({"name": player, "points": points});
        }

        jsonObj["poules"][2]["pouleC"].push({"games":[]});

        for(let i = 0; i < pouleC.numGames(); i++){
            var player1 = document.getElementById(`gameC${i+1}1Name`).innerHTML;
            var score1 = document.getElementById(`gameC${i+1}1Score`).value;
            var player2 = document.getElementById(`gameC${i+1}2Name`).innerHTML;
            var score2 = document.getElementById(`gameC${i+1}2Score`).value;

            score1 = parseInt(score1);
            score2 = parseInt(score2);

            if(isNaN(score1)){
                score1 = 0;
            }

            if(isNaN(score2)){
                score2 = 0;
            }

            jsonObj["poules"][2]["pouleC"][2]["games"].push({"player1": player1, "score1": score1, "player2": player2, "score2": score2});
        }

        console.log(jsonObj);
    }

    if(pouleExists(pouleD)){
        jsonObj["poules"].push({"pouleD":[]});
        jsonObj["poules"][3]["pouleD"].push({"numPlayers": pouleD.players.length});
        jsonObj["poules"][3]["pouleD"].push({"players":[]});
        for(let i = 0; i < pouleD.players.length; i++){
            console.log(i)
            console.log(jsonObj)

            player = pouleD.players[i][0];
            points = parseInt(pouleD.players[i][1]);

            if(isNaN(points)){
                points = 0;
            }

            jsonObj["poules"][3]["pouleD"][1]["players"].push({"name": player, "points": points});
        }

        jsonObj["poules"][3]["pouleD"].push({"games":[]});

        for(let i = 0; i < pouleD.numGames(); i++){
            var player1 = document.getElementById(`gameD${i+1}1Name`).innerHTML;
            var score1 = document.getElementById(`gameD${i+1}1Score`).value;
            var player2 = document.getElementById(`gameD${i+1}2Name`).innerHTML;
            var score2 = document.getElementById(`gameD${i+1}2Score`).value;

            score1 = parseInt(score1);
            score2 = parseInt(score2);

            if(isNaN(score1)){
                score1 = 0;
            }

            if(isNaN(score2)){
                score2 = 0;
            }

            jsonObj["poules"][3]["pouleD"][2]["games"].push({"player1": player1, "score1": score1, "player2": player2, "score2": score2});
        }

        console.log(jsonObj);
    }

    fs.writeFile(path.resolve(__dirname, 'game.json'), JSON.stringify(jsonObj, null, 4), function(err){
        if(err){
            console.log(err);
        }else{
            console.log("JSON save to game.json");
        }
    });
}