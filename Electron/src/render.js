let $ = require('jquery');
let fs = require('fs');
let path = require('path');
const { parse } = require('path');
const {app, ipcRenderer} = require('electron');
const exp = require('constants');
const { randomInt } = require('crypto');
const { default: jsPDF } = require('jspdf');
const {address} = require('ip');
const { PassThrough } = require('stream');
const httpServer = require('http').createServer();
const io = require('socket.io')(httpServer, {
    cors: {
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling']
    },
    allowEIO3: true
});

var numPlayers = 0;
var numPoules = 0;
var appSettings = [];

io.on('connection', (socket) => {
    console.log("Websocket connection astablished");
    /*if(pouleExists(pouleA) || pouleExists(pouleB) || pouleExists(pouleC) || pouleExists(pouleD)){
        socket.emit('pouleInfo', exportGameInfo(false));
    }else{
        socket.emit('pouleInfo', "No active game");
    }*/
    var msg = [];
    var pouleTempArray = [];

    if(pouleExists(pouleA)){
        pouleTempArray.push('pouleA');
    }
    if(pouleExists(pouleB)){
        pouleTempArray.push('pouleB');
    }
    if(pouleExists(pouleC)){
        pouleTempArray.push('pouleC');
    }
    if(pouleExists(pouleD)){
        pouleTempArray.push('pouleD');
    }

    msg.push(pouleTempArray);
    msg.push(appSettings);
    console.log(`Pouleinfo msg: ${msg}`);
    console.log(appSettings);
    socket.emit('pouleInfo', msg);

    socket.on('pouleAInfoRequest', (data) => {
          console.log(`Poule A Info request: ${data}`);
          if(pouleExists(pouleA)){
                pouleA.updatePoints();
                let msg = [pouleA.rankings, pouleA.sendPouleGames(), 'poule'];
                socket.emit('pouleARanks', msg);
                console.log(msg);
          }else{
                let msg = [["No active", "game"]];
                socket.emit('pouleARanks', msg);
          }
    });
    socket.on('pouleBInfoRequest', (data) => {
          console.log(`Poule B Info request: ${data}`);
          if(pouleExists(pouleB)){
            pouleB.updatePoints();
            var msg = [pouleB.rankings, pouleB.sendPouleGames(), 'poule'];
            console.log(msg);
            socket.emit('pouleBRanks', msg);
          }else{
            let msg = [["No active", "game"]];
            socket.emit('pouleBRanks', msg);
          }
    });
    socket.on('pouleCInfoRequest', (data) => {
        console.log(`Poule C Info request: ${data}`);
        if(pouleExists(pouleC)){
            pouleC.updatePoints();
            var msg = [pouleC.rankings, pouleC.sendPouleGames(), 'poule'];
            console.log(msg);
            socket.emit('pouleCRanks', msg);
        }else{
          let msg = [["No active", "game"]];
          socket.emit('pouleCRanks', msg);
        }
    });
    socket.on('pouleDInfoRequest', (data) => {
        console.log(`Poule D Info request: ${data}`);
        if(pouleExists(pouleD)){
            pouleD.updatePoints();
            var msg = [pouleD.rankings, pouleD.sendPouleGames(), 'poule'];
            console.log(msg);
            socket.emit('pouleDRanks', msg);
        }else{
            let msg = [["No active", "game"]];
            socket.emit('pouleDRanks', msg);
        }
    });
    socket.on('finalsInfoRequest', (data) => {
    })
    socket.on('gamePlayed', (data) => {
        var dataArray = data.split(',');
        console.log(`Game played: ${dataArray}`);
        console.log(dataArray[1]);
        console.log(typeof(dataArray));
        document.getElementById(`game${dataArray[0]}1Score`).value = dataArray[1];
        document.getElementById(`game${dataArray[0]}2Score`).value = dataArray[2];
    });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`server listening at http://${address()}:${PORT}`);
});

var players = [];

let tieBreakersEnabled = document.getElementById('tieBreakerCheckbox').checked;

const newGameBtn = document.getElementById('newGameBtn');
newGameBtn.onclick = drawSetup;

const loadGameBtn = document.getElementById('loadGameBtn');
loadGameBtn.onclick = loadGame;

const subBtn = document.getElementById('subBtn');
subBtn.onclick = getGameInfo;

const exportBtn = document.getElementById('exportBtn');
exportBtn.onclick = preparePDFExport;

const saveBtn = document.getElementById('saveBtn');
saveBtn.onclick = exportGameInfo;

const returnBtn = document.getElementById('returnBtn');
returnBtn.onclick = returnToHome;

const makePoulesBtn = document.getElementById('mkPoulesBtn');

$(document.getElementById('gameSetup')).hide();
$(document.getElementById('controlBtnDiv')).hide();
$(document.getElementById('playerInputDiv')).hide();
$(document.getElementById('poulesDiv')).hide();
$(document.getElementById('gameDiv')).hide();

class pouleGames{
    constructor(pouleNum){
        this.pouleNum = pouleNum;
        this.players = [];
        this.tiedPlayers = [];
        this.winner = "";
        this.secondPlace = "";
        this.numGames;
        this.tieDetected = false;
        this.tiedPoulesDrawn = false;
        this.numTiedGames;
        this.gameFormat;
        this.tiedGameFormat;
        this.rankings = [];
        this.lastRankings = [];
    }

    reset(){
        this.players = [];
        this.tiedPlayers = [];
        this.rankings = [];
        this.lastRankings = [];
        this.winner = "";
        this.secondPlace = "";
        this.numGames;
        this.tieDetected = false;
        this.tiedPoulesDrawn = false;
        this.numTiedGames;
        this.gameFormat;
        this.tiedGameFormat;
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
        let numPlayers = this.players.length;
        var gameTable;
        var gamesDiv;

        if(numPlayers == 1){
            let singlePlayerDiv = $(`<div id="singlePlayerDiv" class="singlePlayerDiv"><h3>Winnaar:</h3><h4>${this.players[0][0]}!</h4><p1>Leuk geprobeerd, hier heb ik aan gedacht</p1></div>`);
            $(singlePlayerDiv).appendTo(document.body);
            $(document.getElementById('saveBtnDiv')).hide();
            $(document.getElementById('exportBtnDiv')).hide();
        }else{
            gamesDiv = document.getElementById('pouleGames');
            var pouleGamesDiv = $(`<div id='poule${this.pouleNum}Games' class='pouleGamesDiv'></div>`);
            var pouleGamesHeader = $(`<header class="pouleGamesHeader"><h1>Poule ${this.pouleNum}:</h1></header><hr>`);
            gameTable = $('<table class="pouleGamesTable"></table>');

            $(gamesDiv).append(pouleGamesDiv);
            $(pouleGamesDiv).append(pouleGamesHeader);
            $(pouleGamesDiv).append(gameTable);
        }
        
        if(numPlayers == 2){
            this.numGames = 1;
        }else{
            this.numGames = (this.factorial(numPlayers)/(2*this.factorial(numPlayers-2)));
        }
        console.log(`Number of players for poule ${this.pouleNum}: ${numPlayers}`)
        console.log(`Number of games for poule ${this.pouleNum}: ${this.numGames}`);

        switch(numPlayers){
            case 2:
                this.gameFormat = [[0, 1]];
            break;
            case 3:
                this.gameFormat = [[0,1], [1,2], [0,2]];
            break;
            case 4:
                this.gameFormat = [[0,1], [0,2], [1,3], [0,3], [1,2], [2,3]];
            break;
            case 5:
                this.gameFormat = [[0,1], [0,2], [1,4], [3,4], [1,2], [2,3], [0,4], [1,3], [2,4], [0,3]]
        }

        for(let i = 0; i < this.numGames; i++){
            var gameLabels = $(`<tr><td><p1 id="game${this.pouleNum}${i+1}1Name">${this.players[this.gameFormat[i][0]][0]}</p1></td><td><p1>-</p1></td><td><p1 id="game${this.pouleNum}${i+1}2Name">${this.players[this.gameFormat[i][1]][0]}</p1></td></tr>`);
            var gameInputs = $(`<tr><td><input id="game${this.pouleNum}${i+1}1Score" type="number" class="gameScore"></td><td><p1>-</p1></td><td><input id="game${this.pouleNum}${i+1}2Score" type="number" class="gameScore"></td></tr><hr>`);
            $(gameTable).append(gameLabels);
            $(gameTable).append(gameInputs);
        }

        $(gamesDiv).show();
    }

    factorial(n){
        if(n === 0 || n === 1 || n === 2){
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
        this.rankings = []
        Array.prototype.push.apply(this.rankings, this.players);
        this.rankings.sort(function(a,b){return(b[1]-a[1])});

        var pouleTable = document.getElementById(`poule${this.pouleNum}Table`);
        var pouleTableHeader = $('<tr><th>Speler</th><th>Score</th></tr>');

        $(pouleTable).empty();
        $(pouleTable).append(pouleTableHeader);

        for(let i in this.rankings){
            if(typeof this.rankings[i][1] == 'undefined'){
                this.rankings[i][1] = 0;
            }

            var tableEntry = $(`<tr><td>${this.rankings[i][0]}</td><td>${this.rankings[i][1]}</td></tr>`);
            $(pouleTable).append(tableEntry);
        }
    

        /*for(let i = 0; i < this.rankings.length; i++){
            if(this.rankings[i] == this.lastRankings[i]){
                console.log(`Rankings: ${this.rankings}`);
                console.log(`Last rankings: ${this.lastRankings}`);
                continue;
            }else{
                io.emit(`poule${this.pouleNum}Ranks`, this.rankings);
                this.lastRankings = JSON.parse(JSON.stringify(this.rankings));
                break;
            }
        }*/
        if(JSON.stringify(this.rankings) != JSON.stringify(this.lastRankings)){
            this.lastRankings = JSON.parse(JSON.stringify(this.rankings));
        }
    }

    sendPouleGames(){
        var games = [];
        for(let i = 0; i < this.numGames; i++){
            let player1 = document.getElementById(`game${this.pouleNum}${i+1}1Name`).innerHTML;
            let player2 = document.getElementById(`game${this.pouleNum}${i+1}2Name`).innerHTML;
            let score1 = document.getElementById(`game${this.pouleNum}${i+1}1Score`).value;
            let score2 = document.getElementById(`game${this.pouleNum}${i+1}2Score`).value;
    
            var gamePlayed = true;
            if(!score1 && !score2){
                gamePlayed = false;
            }
    
            var tempArray = [player1, player2, gamePlayed];
            games.push(tempArray);
        }
        return games;
    }

    updatePoints(){
        var points = [];
        for(let i = 0; i < this.players.length; i++){
            points.push(0);
        }

        for(let i = 0; i < this.numGames; i++){
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

            points[this.gameFormat[i][0]] = points[this.gameFormat[i][0]] + points1;
            points[this.gameFormat[i][1]] = points[this.gameFormat[i][1]] + points2;
        }

        if(this.tieDetected && tieBreakersEnabled){
            for(let i = 0; i < this.numTiedGames; i++){
                var points1 = document.getElementById(`tie${this.pouleNum}${i+1}1Score`).value;
                var points2 = document.getElementById(`tie${this.pouleNum}${i+1}2Score`).value;
    
                points1 = parseInt(points1);
                points2 = parseInt(points2);
    
                if(isNaN(points1)){
                    points1 = 0;
                }
    
                if(isNaN(points2)){
                    points2 = 0;
                }
    
                //Punten worden berekend door punten te tellen en in array te zetten op de index van de speler (0 voor speler 1, 1 voor speler 2 etc.)
                //Deze index wordt vervolgens in de players array geplaatst.
                //Daarom moet de locatie in de tiedPlayers array worden vertaald naar de juiste locatie in de players array, zodat de punten bij de juiste spelers komen.
                var playersEqIndex1;
                var playersEqIndex2;
                console.log("For loop moet nu beginnen");
                for(let j = 0; j < this.players.length; j++){
                    if(this.players[j][0] === this.tiedPlayers[this.tiedGameFormat[i][0]][0]){
                        playersEqIndex1 = j;
                    }else if(this.players[j][0] === this.tiedPlayers[this.tiedGameFormat[i][1]][0]){
                        playersEqIndex2 = j;
                    }
                }
                console.log("For loop moet nu klaar zijn")
                points[playersEqIndex1] = points[playersEqIndex1] + points1;    //Punten toewijzen aan die speler
                points[playersEqIndex2] = points[playersEqIndex2] + points2;
            }
        }

        for(let i = 0; i < this.players.length; i++){
            this.players[i][1] = points[i];
        }

        this.sort();

        if(this.allGamesPlayed() && !this.winnerPrinted){
            var playersCopy = [];
            Array.prototype.push.apply(playersCopy, this.players);
            playersCopy.sort(function(a,b){return(b[1]-a[1])})

            console.log(`Winnaar poule ${this.pouleNum}: ${playersCopy[0][0]}`);
            console.log(`Tweede plaats poule ${this.pouleNum}: ${playersCopy[1][0]}`);
            this.winnerPrinted = true;
        }
    }

    allGamesPlayed(){
        for(let i = 0; i < this.numGames; i++){
            var points1 = document.getElementById(`game${this.pouleNum}${i+1}1Score`).value;
            var points2 = document.getElementById(`game${this.pouleNum}${i+1}2Score`).value;

            points1 = parseInt(points1);
            points2 = parseInt(points2);

            if(isNaN(points1) || isNaN(points2)){
                return false;
            }
        }

        if(tieBreakersEnabled){
            let newTiedPlayers = this.isTie();
        
            if(newTiedPlayers.length != 0 && this.newTieDetected(this.tiedPlayers, newTiedPlayers)){
                this.tiedPlayers = newTiedPlayers;
                this.tieDetected = true;
                this.drawTiedPoules();
            }

            if(this.tieDetected){
                for(let i = 0; i < this.numTiedGames; i++){
                    var points1 = document.getElementById(`tie${this.pouleNum}${i+1}1Score`).value;
                    var points2 = document.getElementById(`tie${this.pouleNum}${i+1}2Score`).value;

                    points1 = parseInt(points1);
                    points2 = parseInt(points2);

                    if(isNaN(points1) || isNaN(points2)){
                        return false;
                    }
                }
            }
        }

        var playersCopy = [];
        Array.prototype.push.apply(playersCopy, this.players);
        playersCopy.sort(function(a,b){return b[1] - a[1]});
        this.winner = playersCopy[0][0];
        this.secondPlace = playersCopy[1][0];
        return true;
    }

    newTieDetected(firstTie, secondTie){
        if(firstTie.length != secondTie.length){
            return true;
        }

        for(let i = 0; i < firstTie.length; i++){
            if(firstTie[i][0] != secondTie[i][0]){
                return true;
            }
        }

        return false;
    }

    drawTiedPoules(){
        let pouleGamesDiv = document.getElementById(`poule${this.pouleNum}Games`);
        $(pouleGamesDiv).append(`<hr id="tieBreaker"><header class="pouleGamesHeader" id="tieBreaker"><h1 id="tieBreaker">Tiebreakers:</h1></header><hr><table class="pouleGamesTable" id="poule${this.pouleNum}TiedGames"></table>`);
        let tieBreakerTable = document.getElementById(`poule${this.pouleNum}TiedGames`);
        switch(this.tiedPlayers.length){
            case 2:
                this.tiedGameFormat = [[0, 1]];
            break;
            case 3:
                this.tiedGameFormat = [[0,1], [1,2], [0,2]];
            break;
            case 4:
                this.tiedGameFormat = [[0,1], [0,2], [1,3], [0,3], [1,2], [2,3]];
            break;
            case 5:
                this.tiedGameFormat = [[0,1], [0,2], [1,4], [3,4], [1,2], [2,3], [0,4], [1,3], [2,4], [0,3]]
        }

        if(this.tiedPlayers.length == 2){
            this.numTiedGames = 1;
        }else{
            this.numTiedGames = (this.factorial(this.tiedPlayers.length)/(2*this.factorial(this.tiedPlayers.length-2)));
        }

        for(let i = 0; i < this.numTiedGames; i++){
            $(tieBreakerTable).append(`<tr><td><p1 id="tie${this.pouleNum}${i+1}1Name">${this.tiedPlayers[this.tiedGameFormat[i][0]][0]}</p1></td><td><p1>-</p1></td><td><p1 id="tie${this.pouleNum}${i+1}2Name">${this.tiedPlayers[this.tiedGameFormat[i][1]][0]}</p1></td></tr>`);
            $(tieBreakerTable).append(`<tr><td><input id="tie${this.pouleNum}${i+1}1Score" type="number" class="gameScore"></td><td><p1>-</p1></td><td><input id="tie${this.pouleNum}${i+1}2Score" type="number" class="gameScore"></td></tr>`);
        }
    }

    isTie(){
        var playersCopy = [];
        Array.prototype.push.apply(playersCopy, this.players);
        playersCopy.sort(function(a,b){return b[1] - a[1]});

        let newTiedPlayers = [];
        if(!this.tieDetected){
            var tiedScore;
            for(let i = 0; i < numPlayers-1; i++){
                if(playersCopy[i][1] == playersCopy[i+1][1] && (i==0 || i==1)){
                    tiedScore = playersCopy[i][1];
                    break;
                }
            }

            if(tiedScore == "0"){
                return newTiedPlayers;
            }

            for(let i = 0; i < numPlayers; i++){
                if(playersCopy[i][1] == tiedScore){
                    newTiedPlayers.push(playersCopy[i]);
                }
            }
        }

        return newTiedPlayers;
    }
}

let pouleA = new pouleGames("A");
let pouleB = new pouleGames("B");
let pouleC = new pouleGames("C");
let pouleD = new pouleGames("D");

function returnToHome(){
    document.getElementById('numPlayers').value = null;
    document.getElementById('numPoules').value = null;
    $("#playerInputForm").empty();
    $("#poulesDiv").empty()
    $("#mainRosterSubDiv").empty();
    $("#pouleGames").empty();

    try{
        $(".singlePlayerDiv").remove();
    }catch{
        console.log("Single player div bestaat niet")
    }

    pouleA.reset();
    pouleB.reset();
    pouleC.reset();
    pouleD.reset();

    players = [];
    appSettings = [];
    numPlayers = 0;
    numPoules = 0;

    $(document.getElementById('gameSetup')).hide();
    $(document.getElementById('controlBtnDiv')).hide();
    $(document.getElementById('gameDiv')).hide();
    $(document.getElementById('poulesDiv')).hide();
    $(document.getElementById('playerInputDiv')).hide();
    $(document.getElementById('gameOptionsWrapper')).show();
    //$(returnBtn).hide();
    //$(saveBtn).hide();
}

function drawSetup(){
    console.log("New game...")
    $(document.getElementById('gameOptionsWrapper')).hide();
    $(document.getElementById('gameSetup')).show();
    $(document.getElementById('gameSetupSubDiv')).show();
    //$(document.getElementById('controlBtnDiv')).show();
    //$(returnBtn).show();
    $(document.getElementById('controlBtnDiv')).show();
    $(document.getElementById('saveBtnDiv')).hide();
    $(document.getElementById('exportBtnDiv')).hide();
    $(document.getElementById('ipAddressDiv')).hide();
}

function getGameFileName(action){
    var fileName;
    if(action == "save"){
        fileName = ipcRenderer.sendSync('enterFileName');
    }else if(action == "load"){
        fileName = ipcRenderer.sendSync('selectSaveFile')[0];
    }else{
        return null;
    }
    console.log(fileName)
    return fileName;
}

function loadGame(){
    var gameFileName = getGameFileName("load");
    if(gameFileName === null){
        console.log("No file selected");
        return -1;
    }

    $(document.getElementById('gameOptionsWrapper')).hide();
    $(poulesDiv).show();
    //$(document.getElementById('controlBtnDiv')).show();
    //$(saveBtn).show();
    //$(returnBtn).show();
    $(document.getElementById('controlBtnDiv')).show();
    $(document.getElementById('saveBtnDiv')).show();
    $(document.getElementById('exportBtnDiv')).show();
    $(document.getElementById('returnBtnDiv')).show();
    $(document.getElementById('ipAddressDiv')).show();
    $(document.getElementById('mainRosterDiv')).show();
    $(document.getElementById('mainRosterSubDiv')).show();
    $(document.getElementById('gameDiv')).show();

    pouleA.players = [];
    pouleB.players = [];
    pouleC.players = [];
    pouleD.players = [];


    let jsonString = fs.readFileSync(path.resolve(gameFileName), function(err){
        if(err){
            console.log(err);
        }
    });
    let jsonObj = JSON.parse(jsonString);

    numPoules = jsonObj["poules"].length;

    numPlayers = 0;
    var poule = "";

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
    document.getElementById('ipAddress').innerHTML = `IP adres: ${address()}`;
}

function loadPoulGames(pouleLetter, jsonObj){

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
        break;
    }

    for(let i = 0; i < jsonObj["poules"][indexInJson][`poule${pouleLetter}`][0]["numPlayers"]; i++){
        let playerName = jsonObj["poules"][indexInJson][`poule${pouleLetter}`][1]["players"][i]["name"];
        let playerScore = jsonObj["poules"][indexInJson][`poule${pouleLetter}`][1]["players"][i]["points"];

        pouleToEdit.players.push([playerName, playerScore]);
    }

    pouleToEdit.makePoule();
    pouleToEdit.makeGames();

    for(let i = 0; i < pouleToEdit.numGames; i++){
        let gameScore1Saved = jsonObj["poules"][indexInJson][`poule${pouleLetter}`][2]["games"][i]["score1"];
        let gameScore2Saved = jsonObj["poules"][indexInJson][`poule${pouleLetter}`][2]["games"][i]["score2"];

        if(gameScore1Saved > 0 || gameScore2Saved > 0){
            let gameScore1Field = document.getElementById(`game${pouleLetter}${i+1}1Score`);
            let gameScore2Field = document.getElementById(`game${pouleLetter}${i+1}2Score`);
            gameScore1Field.value = gameScore1Saved;
            gameScore2Field.value = gameScore2Saved;
        }
    }
}

function getGameInfo(){
    numPlayers = document.getElementById("numPlayers").value;
    numPoules = document.getElementById('numPoules').value;

    if(numPlayers == "" && numPoules == ""){
        $(document.getElementById('numPlayers')).css('border-color', 'red');
        $(document.getElementById('numPoules')).css('border-color', 'red');

        document.getElementById('setupErrorSpan').innerHTML = "Vul aantal spelers en aantal poules in.";
    }else if(numPoules == ""){
        $(document.getElementById('numPlayers')).css('border-color', '#414141');
        $(document.getElementById('numPoules')).css('border-color', 'red');

        document.getElementById('setupErrorSpan').innerHTML = "Vul aantal poules in.";
    }else if(numPlayers == ""){
        $(document.getElementById('numPlayers')).css('border-color', 'red');
        $(document.getElementById('numPoules')).css('border-color', '#414141');

        document.getElementById('setupErroSpan').innerHTML = "Vul aantal spelers in.";
    }else if(parseInt(numPlayers)/parseInt(numPoules) > 5){
        $(document.getElementById('numPlayers')).css('border-color', 'red');
        $(document.getElementById('numPoules')).css('border-color', 'red');

        /*Spelers per poule moet in het bericht afgerond zijn op twee decimalen, eerst vermeningvuldigen met 100
          om twee decimalen te bewaren, dan afronden (gaat automatisch naar 0 decimalen), dan weer delen door 100
          om de twee decimalen terug te halen*/
        let currPlayersPerPoule = Math.round((parseInt(numPlayers)/parseInt(numPoules)) * 100) /100
        document.getElementById('setupErrorSpan').innerHTML = `Aantal spelers per poule mag maximaal 5 zijn. Het is nu ${currPlayersPerPoule}.`;
    }else if(parseInt(numPlayers)/parseInt(numPoules) < 2 && numPoules > 1){
        $(document.getElementById('numPlayers')).css('border-color', 'red');
        $(document.getElementById('numPoules')).css('border-color', 'red');

        document.getElementById('setupErrorSpan').innerHTML = "Eén van de poules heeft maar één speler. Fix dat."
    }else{
        $(document.getElementById('numPlayers')).css('border-color', '#414141');
        $(document.getElementById('numPoules')).css('border-color', '#414141');
        document.getElementById('setupErrorSpan').innerHTML = "";

        numPlayers = parseInt(numPlayers);
        numPoules = parseInt(numPoules);

        console.log(`Number of total players: ${numPlayers}`);
        console.log(`Number of poules: ${numPoules}`);
        
        appSettings.push(document.getElementById('pouleScoreSelect').value);
        console.log(`PouleScoreSelect: ${document.getElementById('pouleScoreSelect').value}`);
        appSettings.push(document.getElementById('pouleLegSelect').value);
        appSettings.push(document.getElementById('quartScoreSelect').value);
        appSettings.push(document.getElementById('quartLegSelect').value);
        appSettings.push(document.getElementById('halfScoreSelect').value);
        appSettings.push(document.getElementById('halfLegSelect').value);
        appSettings.push(document.getElementById('finalScoreSelect').value);
        appSettings.push(document.getElementById('finalLegSelect').value);

        //$(document.getElementById('gameSetup')).hide();
        $(document.getElementById('gameSetup')).hide();
        $(document.getElementById('playerInputDiv')).show();
        $(document.getElementById('playerInputSubDiv')).show();
        $(document.getElementById('controlBtnDiv')).show();
        $(document.getElementById('returnBtnDiv')).show();


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
}

function makePoules(){
    var playerEmpty = false;
    players = [];

    for(let i = 0; i < numPlayers; i++){
        var playerName = document.getElementById(`player${i}`).value;
        console.log(playerName);
        players.push(playerName);
    }

    for(let i = 0; i < numPlayers; i++){
        console.log(players[i]);
        if(players[i] == ""){
            $(document.getElementById(`player${i}`)).css('border-color', 'red');
            playerEmpty = true;
            console.log(`Player${i} leeg!`);
        }else{
            $(document.getElementById(`player${i}`)).css('border-color', '#414141');
        }
    }

    if(playerEmpty){
        document.getElementById('playerInputErrorSpan').innerHTML = "Vul voor alle spelers een naam in."
    }else{
        $(document.getElementById('playerInputDiv')).hide();
        //$(document.getElementById('controlBtnDiv')).show();
        //$(saveBtn).show();
        $(document.getElementById('saveBtnDiv')).show();
        $(document.getElementById('exportBtnDiv')).show();
        $(document.getElementById('ipAddressDiv')).show();

        var poulesDiv = document.getElementById('poulesDiv');

        document.getElementById('playerInputErrorSpan').innerHTML = "";

        players.sort(function(a,b){return 0.5 - Math.random()});
        
        var PLAYERS_PER_POULE = numPlayers/numPoules;
        let PLAYERS_PER_POULE_ROUNDED = Math.round(PLAYERS_PER_POULE)
        console.log(`Players per poule: ${PLAYERS_PER_POULE}`);
        console.log(`Players per poule rounded: ${PLAYERS_PER_POULE_ROUNDED}`);

        if(PLAYERS_PER_POULE - PLAYERS_PER_POULE_ROUNDED > 0){
            for(let i = 0; i < numPlayers-1; i++){
                if(i < PLAYERS_PER_POULE_ROUNDED){
                    var tempArray = [players[i], 0];
                    pouleA.players.push(tempArray);
                }else if(PLAYERS_PER_POULE_ROUNDED <= i && i < (2*PLAYERS_PER_POULE_ROUNDED)){
                    var tempArray = [players[i], 0];
                    pouleB.players.push(tempArray);
                }else if((2*PLAYERS_PER_POULE_ROUNDED) <= i && i < (3*PLAYERS_PER_POULE_ROUNDED)){
                    var tempArray = [players[i], 0];
                    pouleC.players.push(tempArray);
                }else if((3*PLAYERS_PER_POULE_ROUNDED) <= i && i < (4*PLAYERS_PER_POULE_ROUNDED)){
                    var tempArray = [players[i], 0];
                    pouleD.players.push(tempArray);
                }
            }

            var randomNumber;
            if(numPoules == 1){
                randomNumber = 0;
            }else if(numPoules == 2){
                randomNumber = Math.floor(Math.random()*2);
            }else if(numPoules == 3){
                randomNumber = Math.floor(Math.random()*3);
            }else if(numPoules == 4){
                randomNumber = Math.floor(Math.random()*4);
            }
            let playerArray = [players[numPlayers-1], 0];

            switch(randomNumber){
                case 0:
                    pouleA.players.push(playerArray);
                    console.log(`Adding ${playerArray} to poule A`);
                break;
                case 1:
                    pouleB.players.push(playerArray);
                    console.log(`Adding ${playerArray} to poule B`);
                break;
                case 2:
                    pouleC.players.push(playerArray);
                    console.log(`Adding ${playerArray} to poule C`);
                break;
                case 3:
                    pouleD.players.push(playerArray);
                    console.log(`Adding ${playerArray} to poule D`);
                break;
            }
        }else{
            for(let i = 0; i < numPlayers; i++){
                if(i < PLAYERS_PER_POULE_ROUNDED){
                    var tempArray = [players[i], 0];
                    pouleA.players.push(tempArray);
                }else if(PLAYERS_PER_POULE_ROUNDED <= i && i < (2*PLAYERS_PER_POULE_ROUNDED)){
                    var tempArray = [players[i], 0];
                    pouleB.players.push(tempArray);
                }else if((2*PLAYERS_PER_POULE_ROUNDED) <= i && i < (3*PLAYERS_PER_POULE_ROUNDED)){
                    var tempArray = [players[i], 0];
                    pouleC.players.push(tempArray);
                }else if((3*PLAYERS_PER_POULE_ROUNDED) <= i && i < (4*PLAYERS_PER_POULE_ROUNDED)){
                    var tempArray = [players[i], 0];
                    pouleD.players.push(tempArray);
                }
            }
        }

        let shouldBePrinted = document.getElementById('printCheckbox').checked;
        var filePath;

        if(shouldBePrinted){
            filePath = ipcRenderer.sendSync('selectPDFDirectory');
        }

        if(pouleExists(pouleA)){
            pouleA.makePoule();
            pouleA.makeGames();
            if(shouldBePrinted){
                exportPDF(pouleA, filePath);
            }
        }

        if(pouleExists(pouleB)){
            pouleB.makePoule();
            pouleB.makeGames();
            if(shouldBePrinted){
                exportPDF(pouleB, filePath);
            }
        }

        if(pouleExists(pouleC)){
            pouleC.makePoule();
            pouleC.makeGames();
            if(shouldBePrinted){
                exportPDF(pouleC, filePath);
            }
        }

        if(pouleExists(pouleD)){
            pouleD.makePoule();
            pouleD.makeGames();
            if(shouldBePrinted){
                exportPDF(pouleD, filePath);
            }
        }

        makeFinals(numPoules);
        
        $(poulesDiv).show();
        //$(saveBtn).show();
        $(document.getElementById('mainRosterDiv')).show();
        $(document.getElementById('mainRosterSubDiv')).show();
        $(document.getElementById('gameDiv')).show();
        startPoulesSorting();
        document.getElementById('ipAddress').innerHTML = `IP adres: ${address()}`;
        io.emit('pouleInfo', exportGameInfo(false));
    }
}

function preparePDFExport(){
    filepath = ipcRenderer.sendSync('selectPDFDirectory');
    for(let i = 0; i < numPoules; i++){
        switch(i){
            case 0:
                exportPDF(pouleA, filepath);
            break;
            case 1:
                exportPDF(pouleB, filepath);
            break;
            case 2:
                exportPDF(pouleC, filepath);
            break;
            case 3:
                exportPDF(pouleD, filepath);
            break;
        }
    }
}

function exportPDF(poule, filePath, exportToPDF){  
    const doc = new jsPDF({
        orientation: 'portrait',
    });
    
    doc.setFontSize(40);
    doc.text(`Poule ${poule.pouleNum}`, 105, 20, null, null, "center");
    doc.setFontSize(30);
    if(!exportToPDF){
        var games = [];
    }
    for(let i = 0; i < pouleA.numGames; i++){
        let player1 = document.getElementById(`game${poule.pouleNum}${i+1}1Name`).innerHTML;
        let player2 = document.getElementById(`game${poule.pouleNum}${i+1}2Name`).innerHTML;

        let gameString = player1 + " - " + player2;
        
        if(!exportToPDF){
            var tempArray = [player1, player2];
            games.push(tempArray);
        }

        doc.text(gameString, 105, 40 + (30*i), null, null, "center");
    }

    if(exportToPDF){
        doc.save(filePath + `/poule${poule.pouleNum}.pdf`);
    }else{
        return games;
    }
}

function makeFinals(numberOfPoules){
    var rosterDiv = document.getElementById('mainRosterSubDiv');
    numberOfPoules = parseInt(numberOfPoules)

    if(numberOfPoules == 4){
        let quarters = $('<table class="mainRosterTable"><tr><th colspan="3"><h2>Kwart Finale</h2></th></tr><tr><td><h2 id="M11Name"></h2></td><td><h2>-</h2></td><td><h2 id="M12Name"></h2></td></tr><tr><td><input id="M11Score" class="gameScore"></td><td><h2>-</h2></td><td><input id="M12Score" class="gameScore"></td></tr><tr><td><h2 id="M21Name"></h2></td><td><h2>-</h2></td><td><h2 id="M22Name"></h2></td></tr><tr><td><input id="M21Score" class="gameScore"></td><td><h2>-</h2></td><td><input id="M22Score" class="gameScore"></td></tr><tr><td><h2 id="M31Name"></h2></td><td><h2>-</h2></td><td><h2 id="M32Name"></h2></td></tr><tr><td><input id="M31Score" class="gameScore"></td><td><h2>-</h2></td><td><input id="M32Score" class="gameScore"></td></tr><tr><td><h2 id="M41Name"></h2></td><td><h2>-</h2></td><td><h2 id="M42Name"></h2></td></tr><tr><td><input id="M41Score" class="gameScore"></td><td><h2>-</h2></td><td><input id="M42Score" class="gameScore"></td></tr></table>')
        let halves = $('<table class="mainRosterTable"><tr><th colspan="3"><h2>Halve Finale</h2></th></tr><tr><td><h2 id="M51Name"></h2></td><td><h2>-</h2></td><td><h2 id="M52Name"></h2></td></tr><tr><td><input id="M51Score" class="gameScore"></td><td><h2>-</h2></td><td><input id="M52Score" class="gameScore"></td></tr><tr><td><h2 id="M61Name"></h2></td><td><h2>-</h2></td><td><h2 id="M62Name"></h2></td></tr><tr><td><input id="M61Score" class="gameScore"></td><td><h2>-</h2></td><td><input id="M62Score" class="gameScore"></td></tr></table>');
        $(rosterDiv).append(quarters);
        $(rosterDiv).append(halves);
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
            }else{
                if(numPoules >= 3){
                    document.getElementById('M11Name').innerHTML = "";
                    document.getElementById('M22Name').innerHTML = "";
                }else if(numPoules == 2){
                    document.getElementById('M51Name').innerHTML = "";
                    document.getElementById('M62Name').innerHTML = "";
                }else if(numPoules == 1){
                    document.getElementById('M71Name').innerHTML = "";
                    document.getElementById('M72Name').innerHTML = "";
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
            }else{
                if(numPoules >= 3){
                    document.getElementById('M21Name').innerHTML = "";
                    document.getElementById('M32Name').innerHTML = "";
                }else if(numPoules == 2){
                    document.getElementById('M61Name').innerHTML = "";
                    document.getElementById('M52Name').innerHTML = "";
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
            }else{
                if(numPoules == 4){
                    document.getElementById('M31Name').innerHTML = "";
                    document.getElementById('M42Name').innerHTML = "";
                }else if(numPoules == 3){
                    document.getElementById('M31Name').innerHTML = "";
                    document.getElementById('M12Name').innerHTML = "";
                }
            }
        }
    
        if(pouleExists(pouleD)){
            pouleD.updatePoints();

            if(pouleD.allGamesPlayed()){
                document.getElementById('M41Name').innerHTML = pouleD.winner;
                document.getElementById('M12Name').innerHTML = pouleD.secondPlace;
            }else{
                document.getElementById('M41Name').innerHTML = "";
                document.getElementById('M12Name').innerHTML = "";
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

function exportGameInfo(writeToFile = true){
    var gameFileName;
    if(writeToFile){
        gameFileName = getGameFileName("save");

        if(gameFileName === null){
            console.log("No file name given")
            return -1;
        }

        if(!gameFileName.includes(".darts")){
            gameFileName = gameFileName + ".darts"
        }
    }

    var jsonObj = {"poules":[], "games":[]};

    if(pouleExists(pouleA)){
        jsonObj["poules"].push({"pouleA":[]})
        jsonObj["poules"][0]["pouleA"].push({"numPlayers": pouleA.players.length})
        jsonObj["poules"][0]["pouleA"].push({"players":[]});
        for(let i = 0; i < pouleA.players.length; i++){
            console.log(i)
            console.log(jsonObj)

            let player = pouleA.players[i][0];
            let points = parseInt(pouleA.players[i][1]);

            if(isNaN(points)){
                points = 0;
            }

            jsonObj["poules"][0]["pouleA"][1]["players"].push({"name": player, "points": points});
        }

        jsonObj["poules"][0]["pouleA"].push({"games":[]});

        for(let i = 0; i < pouleA.numGames; i++){
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

            let player = pouleB.players[i][0];
            let points = parseInt(pouleB.players[i][1]);

            if(isNaN(points)){
                points = 0;
            }

            jsonObj["poules"][1]["pouleB"][1]["players"].push({"name": player, "points": points});
        }

        jsonObj["poules"][1]["pouleB"].push({"games":[]});

        for(let i = 0; i < pouleB.numGames; i++){
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

            let player = pouleC.players[i][0];
            let points = parseInt(pouleC.players[i][1]);

            if(isNaN(points)){
                points = 0;
            }

            jsonObj["poules"][2]["pouleC"][1]["players"].push({"name": player, "points": points});
        }

        jsonObj["poules"][2]["pouleC"].push({"games":[]});

        for(let i = 0; i < pouleC.numGames; i++){
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

            let player = pouleD.players[i][0];
            let points = parseInt(pouleD.players[i][1]);

            if(isNaN(points)){
                points = 0;
            }

            jsonObj["poules"][3]["pouleD"][1]["players"].push({"name": player, "points": points});
        }

        jsonObj["poules"][3]["pouleD"].push({"games":[]});

        for(let i = 0; i < pouleD.numGames; i++){
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

    if(writeToFile){
        fs.writeFile(path.resolve(gameFileName), JSON.stringify(jsonObj, null, 4), function(err){
            if(err){
                console.log(err);
            }else{
                console.log(`Game saved to ${gameFileName}.`);
            }
        });
    }

    return jsonObj;
}