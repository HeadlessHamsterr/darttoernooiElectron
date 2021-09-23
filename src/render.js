/*
Todo:
    - Games laden voor minder dan 3 poules
    - CSS fixen, shit is lelijk
*/
let $ = require('jquery');
let fs = require('fs');
let path = require('path');
const { combinedDisposable } = require('custom-electron-titlebar/common/lifecycle');
const { parse } = require('path');
const {ipcRenderer} = require('electron');
const exp = require('constants');

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
saveBtn.onclick = enterGameFileName;

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
    $(poulesDiv).show();
    $(saveBtn).show();
    $(document.getElementById('mainRosterDiv')).show();
    $(document.getElementById('mainRosterSubDiv')).show();
    $(document.getElementById('gameDiv')).show();

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

    numPoules = jsonObj["poules"].length;

    numPlayers = 0;

    for(let i = 0; i < numPoules; i++){
        switch(i){
            case 0:
                poule = "pouleA";
            break;
            case 1:
                poule = "pouleB";
            break;
            case 2:
                poule = "pouleC";
            break;
            case 3:
                poule = "pouleD";
            break;
        }
        numPlayers += jsonObj["poules"][i][poule][0]["numPlayers"];
    }
    
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

    makeFinals(numPoules);

    switch(numPoules){
        case 4:
            for(let i = 0; i < 7; i++){
                let player1Name = jsonObj["games"][i]["game1Name"];
                let player1Score = jsonObj["games"][i]["game1Score"];
                let player2Name = jsonObj["games"][i]["game2Name"];
                let player2Score = jsonObj["games"][i]["game2Score"];

                document.getElementById(`M${i+1}1Name`).innerHTML = player1Name;
                document.getElementById(`M${i+1}1Score`).value = player1Score;
                document.getElementById(`M${i+1}2Name`).innerHTML = player2Name;
                document.getElementById(`M${i+1}2Score`).value = player2Score;
            }
        break;
        case 3:
            for(let i = 0; i < 5; i++){
                let player1Name = jsonObj["games"][i]["game1Name"];
                let player1Score = jsonObj["games"][i]["game1Score"];
                let player2Name = jsonObj["games"][i]["game2Name"];
                let player2Score = jsonObj["games"][i]["game2Score"];
                console.log(player1Name);
                console.log(player1Score);
                console.log(player2Name);
                console.log(player2Score);

                if(i < 3){
                    document.getElementById(`M${i+1}1Name`).innerHTML = player1Name;
                    document.getElementById(`M${i+1}1Score`).value = player1Score;
                    document.getElementById(`M${i+1}2Name`).innerHTML = player2Name;
                    document.getElementById(`M${i+1}2Score`).value = player2Score;
                }else if(i < 4){
                    document.getElementById(`M${i+2}1Name`).innerHTML = player1Name;
                    document.getElementById(`M${i+2}1Score`).value = player1Score;
                    document.getElementById(`M${i+2}2Name`).innerHTML = player2Name;
                    document.getElementById(`M${i+2}2Score`).value = player2Score;
                }else{
                    document.getElementById(`M${i+3}1Name`).innerHTML = player1Name;
                    document.getElementById(`M${i+3}1Score`).value = player1Score;
                    document.getElementById(`M${i+3}2Name`).innerHTML = player2Name;
                    document.getElementById(`M${i+3}2Score`).value = player2Score;
                }
                console.log("wtf");
            }
        break;
        case 2:
            for(let i = 0; i < 3; i++){
                console.log(i);
                let player1Name = jsonObj["games"][i]["game1Name"];
                let player1Score = jsonObj["games"][i]["game1Score"];
                let player2Name = jsonObj["games"][i]["game2Name"];
                let player2Score = jsonObj["games"][i]["game2Score"];
                
                document.getElementById(`M${i+5}1Name`).innerHTML = player1Name;
                document.getElementById(`M${i+5}1Score`).value = player1Score;
                document.getElementById(`M${i+5}2Name`).innerHTML = player2Name;
                document.getElementById(`M${i+5}2Score`).value = player2Score;
            }
        break;
        case 1:
            let player1Name = jsonObj["games"][0]["game1Name"];
            let player1Score = jsonObj["games"][0]["game1Score"];
            let player2Name = jsonObj["games"][0]["game2Name"];
            let player2Score = jsonObj["games"][0]["game2Score"];

            document.getElementById('M71Name').innerHTML = player1Name;
            document.getElementById('M71Score').value = player1Score;
            document.getElementById('M72Name').innerHTML = player2Name;
            document.getElementById('M72Score').value = player2Score;
        break;
    }

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

    makeFinals(numPoules);
    
    $(poulesDiv).show();
    $(saveBtn).show();
    $(document.getElementById('mainRosterDiv')).show();
    $(document.getElementById('mainRosterSubDiv')).show();
    $(document.getElementById('gameDiv')).show();
}

function makeFinals(numberOfPoules){
    var rosterDiv = document.getElementById('mainRosterSubDiv');
    numberOfPoules = parseInt(numberOfPoules)

    if(numberOfPoules == 4){
        let quarters = $('<table class="mainRosterTable"><tr><th colspan="3"><h2>Kwart Finale</h2></th></tr><tr><td><h2 id="M11Name"></h2></td><td><h2>-</h2></td><td><h2 id="M12Name"></h2></td></tr><tr><td><input id="M11Score" class="gameScore"></td><td><h2>-</h2></td><td><input id="M12Score" class="gameScore"></td></tr><tr><td><h2 id="M21Name"></h2></td><td><h2>-</h2></td><td><h2 id="M22Name"></h2></td></tr><tr><td><input id="M21Score" class="gameScore"></td><td><h2>-</h2></td><td><input id="M22Score" class="gameScore"></td></tr><tr><td><h2 id="M31Name"></h2></td><td><h2>-</h2></td><td><h2 id="M32Name"></h2></td></tr><tr><td><input id="M31Score" class="gameScore"></td><td><h2>-</h2></td><td><input id="M32Score" class="gameScore"></td></tr><tr><td><h2 id="M41Name"></h2></td><td><h2>-</h2></td><td><h2 id="M42Name"></h2></td></tr><tr><td><input id="M41Score" class="gameScore"></td><td><h2>-</h2></td><td><input id="M42Score" class="gameScore"></td></tr></table>')
        $(rosterDiv).append(quarters);
    }else if(numberOfPoules == 3){
        let quarters = $('<table class="mainRosterTable"><tr><th colspan="3"><h2>Kwart Finale</h2></th></tr><tr><td><h2 id="M11Name"></h2></td><td><h2>-</h2></td><td><h2 id="M12Name"></h2></td></tr><tr><td><input id="M11Score" class="gameScore"></td><td><h2>-</h2></td><td><input id="M12Score" class="gameScore"></td></tr><tr><td><h2 id="M21Name"></h2></td><td><h2>-</h2></td><td><h2 id="M22Name"></h2></td></tr><tr><td><input id="M21Score" class="gameScore"></td><td><h2>-</h2></td><td><input id="M22Score" class="gameScore"></td></tr><tr><td><h2 id="M31Name"></h2></td><td><h2>-</h2></td><td><h2 id="M32Name"></h2></td></tr><tr><td><input id="M31Score" class="gameScore"></td><td><h2>-</h2></td><td><input id="M32Score" class="gameScore"></td></tr></table>')
        let halves = $('<table class="mainRosterTable"><tr><th colspan="3"><h2>Halve Finale</h2></th></tr><tr><td><h2 id="M51Name"></h2></td><td><h2>-</h2></td><td><h2 id="M52Name"></h2></td></tr><tr><td><input id="M51Score" class="gameScore"></td><td><h2>-</h2></td><td><input id="M52Score" class="gameScore"></td></tr></table>');
        $(rosterDiv).append(quarters);
        $(rosterDiv).append(halves);
    }

    if(numberOfPoules == 2){
        let halves = $('<table class="mainRosterTable"><tr><th colspan="3"><h2>Halve Finale</h2></th></tr><tr><td><h2 id="M51Name"></h2></td><td><h2>-</h2></td><td><h2 id="M52Name"></h2></td></tr><tr><td><input id="M51Score" class="gameScore"></td><td><h2>-</h2></td><td><input id="M52Score" class="gameScore"></td></tr><tr><td><h2 id="M61Name"></h2></td><td><h2>-</h2></td><td><h2 id="M62Name"></h2></td></tr><tr><td><input id="M61Score" class="gameScore"></td><td><h2>-</h2></td><td><input id="M62Score" class="gameScore"></td></tr></table>');
        $(rosterDiv).append(halves);
    }

    switch(numberOfPoules){
        case 4:
        case 3:
        case 2:
        case 1:
            let finals = $('<table class="mainRosterTable"><tr><th colspan="3"><h2>Finale</h2></th></tr><tr><td><h2 id="M71Name"></h2></td><td><h2>-</h2></td><td><h2 id="M72Name"></h2></td></tr><tr><td><input id="M71Score" class="gameScore"></td><td><h2>-</h2></td><td><input id="M72Score" class="gameScore"></td></tr></table>');
            let winnerTable = $('<table class="mainRosterTable"><tr><td colspan="3"><h2>Winnaar:</h2></td></tr><tr><td colspan="3"><h2 id="M81Name"></h2></td></tr></table>');
            $(rosterDiv).append(finals);
            $(rosterDiv).append(winnerTable);
        break;
    }
}

function startPoulesSorting(){
    setInterval(function sortPoules(){
        if(pouleExists(pouleA)){
            pouleA.updatePoints();

            if(pouleA.allGamesPlayed()){
                if(numPoules >= 3){
                    document.getElementById('M11Name').innerHTML = pouleA.winner;
                    document.getElementById('M22Name').innerHTML = pouleA.secondPlace;
                }else if(numPoules == 2){
                    document.getElementById('M51Name').innerHTML = pouleA.winner;
                    document.getElementById('M62Name').innerHTML = pouleA.secondPlace;
                }else if(numPoules == 1){
                    document.getElementById('M71Name').innerHTML = pouleA.winner;
                    document.getElementById('M72Name').innerHTML = pouleA.secondPlace;
                }
            }
        }
    
        if(pouleExists(pouleB)){
            pouleB.updatePoints();

            if(pouleB.allGamesPlayed()){
                if(numPoules >= 3){
                    document.getElementById('M21Name').innerHTML = pouleB.winner;
                    document.getElementById('M32Name').innerHTML = pouleB.secondPlace;
                }else if(numPoules == 2){
                    document.getElementById('M61Name').innerHTML = pouleB.winner;
                    document.getElementById('M52Name').innerHTML = pouleB.secondPlace;
                }
            }
        }
    
        if(pouleExists(pouleC)){
            pouleC.updatePoints();

            if(pouleC.allGamesPlayed()){
                if(numPoules == 4){
                    document.getElementById('M31Name').innerHTML = pouleC.winner;
                    document.getElementById('M42Name').innerHTML = pouleC.secondPlace;
                }else if(numPoules == 3){
                    document.getElementById('M31Name').innerHTML = pouleC.winner;
                    document.getElementById('M12Name').innerHTML = pouleC.secondPlace;
                }
            }
        }
    
        if(pouleExists(pouleD)){
            pouleD.updatePoints();

            if(pouleD.allGamesPlayed()){
                document.getElementById('M41Name').innerHTML = pouleD.winner;
                document.getElementById('M12Name').innerHTML = pouleD.secondPlace;
            }
        }

        switch(parseInt(numPoules)){
            case 4:
                getFinalsWinner("M11", "M12", "M51");
                getFinalsWinner("M21", "M22", "M52");
                getFinalsWinner("M31", "M32", "M61");
                getFinalsWinner("M41", "M42", "M62");

                getFinalsWinner("M51", "M52", "M71");
                getFinalsWinner("M61", "M62", "M72");

                getFinalsWinner("M71", "M72", "M81");
            break;
            case 3:
                getFinalsWinner("M11", "M12", "M51");
                getFinalsWinner("M21", "M22", "M52");

                getFinalsWinner("M31", "M32", "M72");

                getFinalsWinner("M51", "M52", "M71");
                getFinalsWinner("M71", "M72", "M81");
            break;
            case 2:
                getFinalsWinner("M51", "M52", "M71");
                getFinalsWinner("M61", "M62", "M72");

                getFinalsWinner("M71", "M72", "M81");
            break;
            case 1:
                getFinalsWinner("M71", "M72", "M81");
            break;
        }
    }, 500);
}

function getFinalsWinner(player1, player2, destination){
    var player1Score = parseInt(document.getElementById(`${player1}Score`).value);
    var player1Name = document.getElementById(`${player1}Name`).innerHTML;
    var player2Score = parseInt(document.getElementById(`${player2}Score`).value);
    var player2Name = document.getElementById(`${player2}Name`).innerHTML;

    if(!isNaN(player1Score) && !isNaN(player2Score)){
        if(player1Score > player2Score){
            document.getElementById(`${destination}Name`).innerHTML = player1Name;
        }else if(player2Score > player1Score){
            document.getElementById(`${destination}Name`).innerHTML = player2Name;
        }
    }
}

function pouleExists(poule){
    if(typeof poule.players !== 'undefined' && poule.players.length > 0){
        return true;
    }else{
        return false;
    }
}

function exportFinalsGame(gameNum){
    let player1Score = parseInt(document.getElementById(`M${gameNum}1Score`).value);
    let player1Name = document.getElementById(`M${gameNum}1Name`).innerHTML;
    let player2Score = parseInt(document.getElementById(`M${gameNum}2Score`).value);
    let player2Name = document.getElementById(`M${gameNum}2Name`).innerHTML;

    return [player1Score, player1Name, player2Score, player2Name];
}

function enterGameFileName(){
    ipcRenderer.invoke('enterFileName').then((result)=>{
        exportGameInfo(result);
    });
}

function exportGameInfo(gameFileName){
    var jsonObj = {"poules":[], "games":[]};

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

    switch(parseInt(numPoules)){
        case 4:
            var games = [];

            games.push(exportFinalsGame("1"));
            games.push(exportFinalsGame("2"));
            games.push(exportFinalsGame("3"));
            games.push(exportFinalsGame("4"));
            games.push(exportFinalsGame("5"));
            games.push(exportFinalsGame("6"));
            games.push(exportFinalsGame("7"));

            console.log(games);

            for(let i = 0; i < 7; i++){
                let game1Name = `M${i+1}1Name`;
                let game1Score = `M${i+1}1Score`;
                let game2Name = `M${i+1}2Name`;
                let game2Score = `M${i+1}2Score`;
                jsonObj["games"].push({game1Name:games[i][1], game1Score:games[i][0], game2Name:games[i][3], game2Score:games[i][2]});
            }
        break;
        case 3:
            var games = [];

            games.push(exportFinalsGame("1"));
            games.push(exportFinalsGame("2"));
            games.push(exportFinalsGame("3"));
            games.push(exportFinalsGame("5"));
            games.push(exportFinalsGame("7"));

            for(let i = 0; i < 5; i++){
                if(i < 4){
                    let game1Name = `M${i+1}1Name`;
                    let game1Score = `M${i+1}1Score`;
                    let game2Name = `M${i+1}2Name`;
                    let game2Score = `M${i+1}2Score`;
                }else{
                    let game1Name = `M${i+3}1Name`;
                    let game1Score = `M${i+3}1Score`;
                    let game2Name = `M${i+3}2Name`;
                    let game2Score = `M${i+3}2Score`;
                }
                jsonObj["games"].push({game1Name:games[i][1], game1Score:games[i][0], game2Name:games[i][3], game2Score:games[i][2]});
            }
        break;
        case 2:
            var games = [];
            games.push(exportFinalsGame("5"));
            games.push(exportFinalsGame("6"));
            games.push(exportFinalsGame("7"));

            for(let i = 0; i < 3; i++){
                let game1Name = `M${i+1}1Name`;
                let game1Score = `M${i+1}1Score`;
                let game2Name = `M${i+1}2Name`;
                let game2Score = `M${i+1}2Score`;
                jsonObj["games"].push({game1Name:games[i][1], game1Score:games[i][0], game2Name:games[i][3], game2Score:games[i][2]});
            }
        break;
        case 1:
            var games = [];

            games.push(exportFinalsGame("7"));

            for(let i = 0; i < 1; i++){
                let game1Name = `M${i+1}1Name`;
                let game1Score = `M${i+1}1Score`;
                let game2Name = `M${i+1}2Name`;
                let game2Score = `M${i+1}2Score`;
                jsonObj["games"].push({game1Name:games[i][1], game1Score:games[i][0], game2Name:games[i][3], game2Score:games[i][2]});
            }
        break;
    }

    fs.writeFile(path.resolve(gameFileName), JSON.stringify(jsonObj, null, 4), function(err){
        if(err){
            console.log(err);
        }else{
            console.log("JSON save to game.json");
        }
    });
}