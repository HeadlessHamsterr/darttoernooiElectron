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
const {createHttpTerminator} = require('http-terminator');
const { Socket } = require('socket.io');
const uuid = require('uuid')
/*
const updater = require('update-electron-app')({
    repo: 'https://github.com/HeadlessHamsterr/darttoernooiElectron',
    updateInterval: '1 hour',
})
*/;
const io = require('socket.io')(httpServer, {
    cors: {
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling']
    },
    allowEIO3: true
});

const sockets = new Set();
var numPlayers = 0;
var numPoules = 0;
var appSettings = [];
var appOptions = ["pouleScore", "pouleLegs", "quartScore", "quartLegs", "halfScore", "halfLegs", "finalScore", "finalLegs"];
var activeGames = [];
let outs = [  'T20 T20 BULL',
'',
'',
'T20 T19 BULL',
'',
'',
'T20 T18 BULL',
'',
'',
'T20 T17 BULL',
'T20 T20 D20',
'',
'T20 T20 D19',
'T20 T19 D20',
'T20 T20 D18',
'T20 T19 D19',
'T20 T18 D20',
'T20 T19 D18',
'T20 T20 D16',
'T20 T17 D20',
'T20 T18 D18',
'T20 T19 D16',
'T20 T16 D20',
'T20 T17 D18',
'T20 T18 D16',
'T20 T15 D20',
'T20 T20 D12',
'T20 T17 D16',
'T20 T14 D20',
'T20 T19 D12',
'T20 T16 D16',
'T19 T14 D20',
'T20 T18 D12',
'T19 T16 D16',
'T20 T20 D8',
'T20 T17 D12',
'T20 T14 D16',
'T20 T19 D8',
'BULL T14 D20',
'T20 T13 D16',
'T20 T20 D5',
'T19 T20 D6',
'T18 T14 D16',
'T20 T17 D8',
'T19 T19 D6',
'25 T20 D20',
'T20 T14 D11',
'T19 T16 D9',
'T18 T18 D7',
'T20 T11 D14',
'T20 20 D20',
'T19 T12 D13',
'T20 18 D20',
'T20 17 D20',
'T20 16 D20',
'T20 15 D20',
'T20 14 D20',
'T20 13 D20',
'T20 12 D20',
'T20 11 D20',
'T20 10 D20',
'T19 12 D20',
'T20 16 D16',
'T19 10 D20',
'T20 10 D18',
'T20 13 D16',
'T20 12 D16',
'T19 10 D18',
'T20 10 D16',
'T17 10 D20',
'T20 D20',
'T19 10 D16',
'T20 D19',
'T19 D20',
'T20 D18',
'T19 D19',
'T18 D20',
'T19 D18',
'T20 D16',
'T17 D20',
'T20 D15',
'T19 D16',
'T20 D14',
'T17 D18',
'T18 D16',
'T15 D20',
'T16 D18',
'T17 D16',
'T14 D20',
'T15 D18',
'T20 D10',
'T13 D20',
'T18 D12',
'T15 D16',
'T20 D8',
'T13 D18',
'T14 D16',
'T19 D8',
'T16 D12',
'T13 D16',
'T18 D8',
'T19 D6',
'T20 D4',
'T17 D8',
'T10 D18',
'T19 D4',
'T16 D8',
'T13 D12',
'T10 D16',
'T15 D8',
'20 D20',
'19 D20',
'18 D20',
'17 D20',
'16 D20',
'15 D20',
'14 D20',
'13 D20',
'12 D20',
'19 D16',
'10 D20',
'17 D16',
'16 D16',
'15 D16',
'6 D20',
'13 D16',
'12 D16',
'3 D20',
'10 D16',
'9 D16',
'D20',
'7 D16',
'D19',
'5 D16',
'D18',
'3 D16',
'D17',
'1 D16',
'D16',
'15 D8',
'D15',
'13 D8',
'D14',
'19 D4',
'D13',
'9 D8',
'D12',
'7 D8',
'D11',
'5 D8',
'D10',
'3 D8',
'D9',
'9 D4',
'D8',
'7 D4',
'D7',
'5 D4',
'D6',
'3 D4',
'D5',
'1 D4',
'D4',
'3 D2',
'D3',
'1 D2',
'D2',
'1 D1',
'D1'
];

io.on('connection', (socket) => {
    console.log(`Websocket ${socket.id} connection astablished`);
    sockets.add(socket.id);

    socket.on('disconnect', () => {
        console.log(`Websocket ${socket.id} connection closed`);
        for(let i = 0; i < activeGames.length; i++){
            if(activeGames[i][1] == socket.id){
                stopGame(activeGames[i][0]);
            }
        }
        sockets.delete(socket.id);
    });
    socket.on('allPouleInfoRequest', (data) => {
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
        socket.emit('pouleInfo', msg);
    });
    socket.on('pouleAInfoRequest', (data) => {
          if(pouleExists(pouleA)){
                pouleA.updatePoints();
                let msg = [pouleA.rankings, pouleA.sendPouleGames(), 'poule'];
                socket.emit('pouleARanks', msg);
          }else{
                let msg = [["No active", "game"]];
                socket.emit('pouleARanks', msg);
          }
    });
    socket.on('pouleBInfoRequest', (data) => {
          if(pouleExists(pouleB)){
            pouleB.updatePoints();
            var msg = [pouleB.rankings, pouleB.sendPouleGames(), 'poule'];
            socket.emit('pouleBRanks', msg);
          }else{
            let msg = [["No active", "game"]];
            socket.emit('pouleBRanks', msg);
          }
    });
    socket.on('pouleCInfoRequest', (data) => {
        if(pouleExists(pouleC)){
            pouleC.updatePoints();
            var msg = [pouleC.rankings, pouleC.sendPouleGames(), 'poule'];
            socket.emit('pouleCRanks', msg);
        }else{
          let msg = [["No active", "game"]];
          socket.emit('pouleCRanks', msg);
        }
    });
    socket.on('pouleDInfoRequest', (data) => {
        if(pouleExists(pouleD)){
            pouleD.updatePoints();
            var msg = [pouleD.rankings, pouleD.sendPouleGames(), 'poule'];
            socket.emit('pouleDRanks', msg);
        }else{
            let msg = [["No active", "game"]];
            socket.emit('pouleDRanks', msg);
        }
    });
    socket.on('finalsInfoRequest', (data) => {
        var finalsMsg = [];
        switch(numPoules){
            case 4:
                for(let i = 0; i < 7; i++){
                    var gameType = '';

                    if(4 < i < 0){
                        gameType = 'quart';
                    }else if(6 < i < 3){
                        gameType = 'half';
                    }else{
                        gameType = 'final';
                    }

                    finalsMsg.push(finalsGameToApp(i+1, gameType));
                }
                break;
            case 3:
                finalsMsg.push(finalsGameToApp(1, 'quart'));
                finalsMsg.push(finalsGameToApp(2, 'quart'));
                finalsMsg.push(finalsGameToApp(3, 'quart'));
                finalsMsg.push(finalsGameToApp(5, 'half'));
                finalsMsg.push(finalsGameToApp(7, 'final'));
                break;
            case 2:
                finalsMsg.push(finalsGameToApp(5, 'half'));
                finalsMsg.push(finalsGameToApp(6, 'half'));
                finalsMsg.push(finalsGameToApp(7, 'final'));
                break;
            case 1:
                finalsMsg.push(finalsGameToApp(7, 'final'));
                break;
        }
        socket.emit('finalsInfo', finalsMsg);
    });
    socket.on('gamePlayed', (data) => {
        var dataArray = data.split(',');
        if(dataArray[0][0] == 'M'){
            document.getElementById(`${dataArray[0]}1Score`).value = dataArray[1];
            document.getElementById(`${dataArray[0]}2Score`).value = dataArray[2];
        }else{
            document.getElementById(`game${dataArray[0]}1Score`).value = dataArray[1];
            document.getElementById(`game${dataArray[0]}2Score`).value = dataArray[2];
        }

        for(let i = 0; i < activeGames.length; i++){
            if(activeGames[i][0] == dataArray[0]){
                activeGames.splice(i, 1);
                console.log(`Game ${dataArray[0]} stopped`);

                $(document.getElementById(dataArray[0])).remove();
                $(document.getElementById(`stop${dataArray[0]}`)).remove();
                $(document.getElementById(`${dataArray[0]}VL`)).remove();

                if(activeGames.length == 0){
                    $(document.getElementById('activeGamesDiv')).hide();
                }
                break;
            }
        }

        var msg;
        switch(data[0]){
            case 'A':
                pouleA.updatePoints();
                msg = [pouleA.rankings, pouleA.sendPouleGames(), 'poule'];
                io.emit('pouleARanks', msg);
            break;
            case 'B':
                pouleB.updatePoints();
                msg = [pouleB.rankings, pouleB.sendPouleGames(), 'poule'];
                io.emit('pouleBRanks', msg);
            break;
            case 'C':
                pouleC.updatePoints();
                msg = [pouleC.rankings, pouleC.sendPouleGames(), 'poule'];
                io.emit('pouleCRanks', msg);
            break;
            case 'D':
                pouleD.updatePoints();
                msg = [pouleD.rankings, pouleD.sendPouleGames(), 'poule'];
                io.emit('pouleDRanks', msg);
            break;
        }
    });
    socket.on('activeGameInfo', (data) => {
        var dataArray = data.split(',');
        $(document.getElementById('activeGamesDiv')).show();
        var newGame = true

        for(let i = 0; i < activeGames.length; i++){
            if(activeGames[i][0] == dataArray[0]){
                newGame = false;
                break;
            }
        }

        if(newGame){
            console.log(`New game ${dataArray[0]} started`);
            var div;
            /*if(activeGames.length % 2 === 0){
                div = document.getElementById('activeTablesDiv2');
            }else{
                div = document.getElementById('activeTablesDiv1');
            }*/
            div = document.getElementById('activeTablesDiv1');
            //Bij finales (M games) zoeken op M(gameNummer)(spelerNummer)
            var player1;
            var player2;

            if(dataArray[0][0] == 'M'){
                player1 = document.getElementById(`${dataArray[0]}1Name`).innerHTML;
                player2 = document.getElementById(`${dataArray[0]}2Name`).innerHTML;
            }else{
                player1 = document.getElementById(`game${dataArray[0]}1Name`).innerHTML;
                player2 = document.getElementById(`game${dataArray[0]}2Name`).innerHTML;
            }

            if(activeGames.length > 0){
                $(div).append(`<div id="${dataArray[0]}VL" class="vl">`)
            }

            $(div).append(`<table id="${dataArray[0]}" class="activeGameTable"><tr><td id="activePlayer${dataArray[0]}1">${player1}</td><td><i id="${dataArray[0]}TurnArrow" class="material-icons turnArrow">expand_more</i></td><td id="activePlayer${dataArray[0]}2">${player2}</td></tr><tr><td id="activeDarts${dataArray[0]}1"></td><td>Darts</td><td id="activeDarts${dataArray[0]}2"></td></tr><tr><td id="activeLeg${dataArray[0]}1">${dataArray[2]}</td><td>Legs</td><td id="activeLeg${dataArray[0]}2">${dataArray[4]}</td></tr><tr><td id="activeScore${dataArray[0]}1">${dataArray[1]}</td><td></td><td id="activeScore${dataArray[0]}2">${dataArray[3]}</td></tr><tr><td id="out${dataArray[0]}1"></td><td></td><td id="out${dataArray[0]}2"></td></tr></table>`)
            
            let tempArray = [dataArray[0], socket.id];
            activeGames.push(tempArray);
            
            let stopGameDiv = document.getElementById('activeGamesSideDiv');
            $(stopGameDiv).append(`<button id="stop${dataArray[0]}" class="stopGameButton" onclick="stopGame(this.id)">${player1} - ${player2} <i id='remGameIcon' class='material-icons'>delete</i></button>`);
            var msg;
            switch(dataArray[0][0]){
                case 'A':
                    pouleA.updatePoints();
                    msg = [pouleA.rankings, pouleA.sendPouleGames(), 'poule'];
                    io.emit('pouleARanks', msg);
                break;
                case 'B':
                    pouleB.updatePoints();
                    msg = [pouleB.rankings, pouleB.sendPouleGames(), 'poule'];
                    io.emit('pouleBRanks', msg);
                break;
                case 'C':
                    pouleC.updatePoints();
                    msg = [pouleC.rankings, pouleC.sendPouleGames(), 'poule'];
                    io.emit('pouleCRanks', msg);
                break;
                case 'D':
                    pouleD.updatePoints();
                    msg = [pouleD.rankings, pouleD.sendPouleGames(), 'poule'];
                    io.emit('pouleDRanks', msg);
                break;
            }

            
        }
        document.getElementById(`activeLeg${dataArray[0]}1`).innerHTML = dataArray[2];
        document.getElementById(`activeLeg${dataArray[0]}2`).innerHTML = dataArray[4];
        document.getElementById(`activeScore${dataArray[0]}1`).innerHTML = dataArray[1];
        document.getElementById(`activeScore${dataArray[0]}2`).innerHTML = dataArray[3];
        document.getElementById(`activeDarts${dataArray[0]}1`).innerHTML = dataArray[7];
        document.getElementById(`activeDarts${dataArray[0]}2`).innerHTML = dataArray[8];

        if(dataArray[6] == '0'){
            document.getElementById(`activePlayer${dataArray[0]}1`).style.color = 'green';
            document.getElementById(`activePlayer${dataArray[0]}2`).style.color = 'white';
        }else{
            document.getElementById(`activePlayer${dataArray[0]}1`).style.color = 'white';
            document.getElementById(`activePlayer${dataArray[0]}2`).style.color = 'green';
        }

        if(dataArray[5] == 'true'){
            document.getElementById(`${dataArray[0]}TurnArrow`).style.transform = 'rotate(90deg)';
        }else{
            document.getElementById(`${dataArray[0]}TurnArrow`).style.transform = 'rotate(270deg)';
        }

        if(dataArray[1] <= 170 && dataArray[1] > 0){
            document.getElementById(`out${dataArray[0]}1`).innerHTML = outs[170-dataArray[1]];
        }else{
            document.getElementById(`out${dataArray[0]}1`).innerHTML = '';
        }

        if(dataArray[3] <= 170 && dataArray[3] > 0){
            document.getElementById(`out${dataArray[0]}2`).innerHTML = outs[170-dataArray[3]];
        }else{
            document.getElementById(`out${dataArray[0]}2`).innerHTML = '';
        }
    });
    socket.on('stopActiveGame', (data) => {
        for(let i = 0; i < activeGames.length; i++){
            if(activeGames[i][0] == data){
                activeGames.splice(i, 1);
                console.log(`Game ${data} stopped`);

                $(document.getElementById(data)).remove();
                $(document.getElementById(`stop${data}`)).remove();
                $(document.getElementById(`${data}VL`)).remove();

                if(activeGames.length == 0){
                    $(document.getElementById('activeGamesDiv')).hide();
                }
                break;
            }
        }

        var msg;
        switch(data[0]){
            case 'A':
                pouleA.updatePoints();
                msg = [pouleA.rankings, pouleA.sendPouleGames(), 'poule'];
                io.emit('pouleARanks', msg);
            break;
            case 'B':
                pouleB.updatePoints();
                msg = [pouleB.rankings, pouleB.sendPouleGames(), 'poule'];
                io.emit('pouleBRanks', msg);
            break;
            case 'C':
                pouleC.updatePoints();
                msg = [pouleC.rankings, pouleC.sendPouleGames(), 'poule'];
                io.emit('pouleCRanks', msg);
            break;
            case 'D':
                pouleD.updatePoints();
                msg = [pouleD.rankings, pouleD.sendPouleGames(), 'poule'];
                io.emit('pouleDRanks', msg);
            break;
        }
    });
});

const PORT = process.env.PORT || 11520;

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
        this.finalsDrawn = false;
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
        this.finalsDrawn = false;
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
            $(document.getElementById('saveBtn')).hide();
            $(document.getElementById('exportBtn')).hide();
            $(document.getElementById('appSettingsBtn')).hide();
            $(document.getElementById('playerSettingsBtn')).hide();
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

        if(JSON.stringify(this.rankings) != JSON.stringify(this.lastRankings)){
            this.lastRankings = JSON.parse(JSON.stringify(this.rankings));
            let msg = [this.rankings, this.sendPouleGames(), 'poule'];
            io.emit(`poule${this.pouleNum}Ranks`, msg);
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

            var gameActive = false;

            for(let j=0; j < activeGames.length; j++){
                if(activeGames[j] == `${this.pouleNum}${i+1}`){
                    gameActive = true;
                    break;
                }
            }

            if(!score1 && !score2 && !gameActive){
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
                for(let j = 0; j < this.players.length; j++){
                    if(this.players[j][0] === this.tiedPlayers[this.tiedGameFormat[i][0]][0]){
                        playersEqIndex1 = j;
                    }else if(this.players[j][0] === this.tiedPlayers[this.tiedGameFormat[i][1]][0]){
                        playersEqIndex2 = j;
                    }
                }
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

        if(numPoules == 1 || tieBreakersEnabled){
            let newTiedPlayers = this.isTie();
            
            if(newTiedPlayers.length != 0 && this.newTieDetected(this.tiedPlayers, newTiedPlayers)){
                this.tiedPlayers = newTiedPlayers;
                this.tieDetected = true;
            }

            if(this.tieDetected && numPoules == 1 && !this.finalsDrawn){
                makeFinals(0);
                $("#winnerTable").insertAfter("#finalsTable");
                this.finalsDrawn = true;
            }else if(this.tieDetected && tieBreakersEnabled){
                this.drawTiedPoules();
                for(let i = 0; i < this.numTiedGames; i++){
                    var points1 = document.getElementById(`tie${this.pouleNum}${i+1}1Score`).value;
                    var points2 = document.getElementById(`tie${this.pouleNum}${i+1}2Score`).value
                    points1 = parseInt(points1);
                    points2 = parseInt(points2)
                    if(isNaN(points1) || isNaN(points2)){
                        return false;
                    }
                }
            }else{
                var playersCopy = [];
                Array.prototype.push.apply(playersCopy, this.players);
                playersCopy.sort(function(a,b){return b[1] - a[1]});
                this.winner = playersCopy[0][0];
                this.secondPlace = playersCopy[1][0];
                if(!this.finalsDrawn){
                    document.getElementById("M81Name").innerHTML = this.winner;
                }
            }
        }else{
            var playersCopy = [];
            Array.prototype.push.apply(playersCopy, this.players);
            playersCopy.sort(function(a,b){return b[1] - a[1]});
            this.winner = playersCopy[0][0];
            this.secondPlace = playersCopy[1][0];
        }

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

    reloadPlayers(){
        for(let i = 0; i < this.numGames; i++){
            document.getElementById(`game${this.pouleNum}${i+1}1Name`).innerHTML = this.players[this.gameFormat[i][0]][0];
            document.getElementById(`game${this.pouleNum}${i+1}2Name`).innerHTML = this.players[this.gameFormat[i][1]][0];
        }
    }
}

let pouleA = new pouleGames("A");
let pouleB = new pouleGames("B");
let pouleC = new pouleGames("C");
let pouleD = new pouleGames("D");

function returnToHome(){
    closeNav();
    for(const socket in sockets){
        socket.disconnect();
        sockets.delete(socket);
    }
    httpServer.close();

    document.getElementById('numPlayers').value = null;
    document.getElementById('numPoules').value = null;
    $("#playerInputForm").empty();
    switch(numPoules){
        case 4:
            $('#pouleD').remove();
        case 3:
            $('#pouleC').remove();
        case 2:
            $('#pouleB').remove();
        case 1:
            $('#pouleA').remove();
        break;
    }
    $('#activeGamesDiv').hide();
    $("#mainRosterSubDiv").empty();
    $("#pouleGames").empty();

    try{
        $(".singlePlayerDiv").remove();
    }catch{
        console.log("Single player div bestaat niet");
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
    $(document.getElementById('sideNavMenusDiv')).hide();
    $(document.getElementById('saveBtnDiv')).hide();
    $(document.getElementById('exportBtnDiv')).hide();
    $(document.getElementById('ipAddressDiv')).hide();
    $(document.getElementById('gameOptionsWrapper')).show();
}

function drawSetup(){
    $(document.getElementById('gameOptionsWrapper')).hide();
    $(document.getElementById('gameSetup')).show();
    $(document.getElementById('gameSetupSubDiv')).show();
    //$(document.getElementById('controlBtnDiv')).show();
    //$(returnBtn).show();
    $(document.getElementById('controlBtnDiv')).show();
    $(document.getElementById('saveBtn')).hide();
    $(document.getElementById('exportBtn')).hide();
    $(document.getElementById('ipAddressDiv')).hide();
    $(document.getElementById('sideNavMenusDiv')).hide();
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
    //$(document.getElementById('appSettingForm')).hide();
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

    appSettings = jsonObj['appSettings'][0];

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
        $(document.getElementById('activeGamesDiv')).insertAfter($(document.getElementById('pouleA')));
    }

    //Load Poule B
    if(numPoules >= 2){
        loadPoulGames("B", jsonObj);
        $(document.getElementById('activeGamesDiv')).insertAfter($(document.getElementById('pouleB')));
    }

    //Load Poule C
    if(numPoules >= 3){
        loadPoulGames("C", jsonObj);
        $(document.getElementById('activeGamesDiv')).insertAfter($(document.getElementById('pouleC')));
    }

    //Load Poule D
    if(numPoules >= 4){
        loadPoulGames("D", jsonObj);
        $(document.getElementById('activeGamesDiv')).insertAfter($(document.getElementById('pouleD')));
    }
    $(document.getElementById('activeGamesDiv')).hide();

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
            }
        break;
        case 2:
            for(let i = 0; i < 3; i++){
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
    httpServer.listen(PORT, () => {
        console.log(`Server listening on http://${address()}:${PORT}`);
    });
    io.emit('pouleInfo', exportGameInfo(false));
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
    let playerSettingsForm = document.getElementById('playerSettingForm');
    for(var i = 0; i < pouleToEdit.players.length; i++){
        let input = $(`<input id="player${pouleLetter}${i}Input" class="settingInput" type="text" value="${pouleToEdit.players[i][0]}"></br>`)
        $(playerSettingsForm).append(input)
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
        
        appSettings.push(document.getElementById('pouleScoreSelect').value);
        appSettings.push(document.getElementById('pouleLegSelect').value);
        appSettings.push(document.getElementById('quartScoreSelect').value);
        appSettings.push(document.getElementById('quartLegSelect').value);
        appSettings.push(document.getElementById('halfScoreSelect').value);
        appSettings.push(document.getElementById('halfLegSelect').value);
        appSettings.push(document.getElementById('finalScoreSelect').value);
        appSettings.push(document.getElementById('finalLegSelect').value);

        $(document.getElementById('gameSetup')).hide();
        $(document.getElementById('playerInputDiv')).show();
        $(document.getElementById('playerInputSubDiv')).show();
        $(document.getElementById('controlBtnDiv')).show();
        $(document.getElementById('returnBtnDiv')).show();
        
        var playerInputForm = document.getElementById('playerInputForm');

        if(document.getElementById('panModCheck').checked){
            let playersPerPoule = Math.round(numPlayers/numPoules);

            for(let i = 0; i < numPlayers; i++){
                //var playerInput = $(`<input type='text' id='player${i}'></input>`).attr(`Speler ${i}`);
                var playerInput = document.createElement("input");
                if(i < playersPerPoule){
                    playerInput.setAttribute("id", `playerA${i}`);
                    playerInput.setAttribute("placeholder", `A${i+1}`);
                }else if(playersPerPoule <= i && i < (playersPerPoule*2)){
                    playerInput.setAttribute("id", `playerB${i-playersPerPoule}`);
                    playerInput.setAttribute("placeholder", `B${i-playersPerPoule+1}`);
                }else if((playersPerPoule*2) <= i && i < (playersPerPoule*3)){
                    playerInput.setAttribute("id", `playerC${i-playersPerPoule*2}`);
                    playerInput.setAttribute("placeholder", `C${i-playersPerPoule*2+1}`);
                }else if((playersPerPoule*3) <= i){
                    playerInput.setAttribute("id", `playerD${i-playersPerPoule*3}`);
                    playerInput.setAttribute("placeholder", `D${i-playersPerPoule*3+1}`);
                }
                playerInput.setAttribute("class", "playerInput");
                $(playerInputForm).append(playerInput);
            }

            makePoulesBtn.onclick = makePoulesWithPan;
        }else{
            //$(document.getElementById('gameSetup')).hide();
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
}

function makePoules(){
    var playerEmpty = false;
    players = [];

    for(let i = 0; i < numPlayers; i++){
        var playerName = document.getElementById(`player${i}`).value;
        players.push(playerName);
    }

    for(let i = 0; i < numPlayers; i++){
        if(players[i] == ""){
            $(document.getElementById(`player${i}`)).css('border-color', 'red');
            playerEmpty = true;
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
        //$(document.getElementById('appSettingForm')).hide();
        $(document.getElementById('saveBtnDiv')).show();
        $(document.getElementById('exportBtnDiv')).show();
        $(document.getElementById('ipAddressDiv')).show();

        var poulesDiv = document.getElementById('poulesDiv');

        document.getElementById('playerInputErrorSpan').innerHTML = "";

        players.sort(function(a,b){return 0.5 - Math.random()});
        
        var PLAYERS_PER_POULE = numPlayers/numPoules;
        let PLAYERS_PER_POULE_ROUNDED = Math.round(PLAYERS_PER_POULE);

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
                break;
                case 1:
                    pouleB.players.push(playerArray);
                break;
                case 2:
                    pouleC.players.push(playerArray);
                break;
                case 3:
                    pouleD.players.push(playerArray);
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

        let playerSettingsForm = document.getElementById('playerSettingForm');
        
        if(pouleExists(pouleA)){
            pouleA.makePoule();
            pouleA.makeGames();
            for(var i = 0; i < pouleA.players.length; i++){
                let input = $(`<input id="playerA${i}Input" class="settingInput" type="text" value="${pouleA.players[i][0]}"></br>`)
                $(playerSettingsForm).append(input)
            }
            if(shouldBePrinted){
                exportPDF(pouleA, filePath, true);
            }
            $(document.getElementById('activeGamesDiv')).insertAfter($(document.getElementById('pouleA')));
        }

        if(pouleExists(pouleB)){
            pouleB.makePoule();
            pouleB.makeGames();
            for(var i = 0; i < pouleB.players.length; i++){
                let input = $(`<input id="playerB${i}Input" class="settingInput" type="text" value="${pouleB.players[i][0]}"></br>`)
                $(playerSettingsForm).append(input)
            }
            if(shouldBePrinted){
                exportPDF(pouleB, filePath, true);
            }
            $(document.getElementById('activeGamesDiv')).insertAfter($(document.getElementById('pouleB')));
        }

        if(pouleExists(pouleC)){
            pouleC.makePoule();
            pouleC.makeGames();
            for(var i = 0; i < pouleC.players.length; i++){
                let input = $(`<input id="playerC${i}Input" class="settingInput" type="text" value="${pouleC.players[i][0]}"></br>`)
                $(playerSettingsForm).append(input)
            }
            if(shouldBePrinted){
                exportPDF(pouleC, filePath, true);
            }
            $(document.getElementById('activeGamesDiv')).insertAfter($(document.getElementById('pouleC')));
        }

        if(pouleExists(pouleD)){
            pouleD.makePoule();
            pouleD.makeGames();
            for(var i = 0; i < pouleD.players.length; i++){
                let input = $(`<input id="playerD${i}Input" class="settingInput" type="text" value="${pouleD.players[i][0]}"></br>`)
                $(playerSettingsForm).append(input)
            }
            if(shouldBePrinted){
                exportPDF(pouleD, filePath, true);
            }
            $(document.getElementById('activeGamesDiv')).insertAfter($(document.getElementById('pouleD')));
        }
        $(document.getElementById('activeGamesDiv')).hide();

        if(numPoules > 1){
            makeFinals(numPoules);
        }else{
            let winnerTable = $('<table id="winnerTable" class="mainRosterTable"><tr><td colspan="3"><h2>Winnaar:</h2></td></tr><tr><td colspan="3"><h2 id="M81Name"></h2></td></tr></table>');
            $("#mainRosterSubDiv").append(winnerTable);
        }
        
        $(poulesDiv).show();
        //$(saveBtn).show();
        //$(document.getElementById('appSettingForm')).hide();
        $(document.getElementById('mainRosterDiv')).show();
        $(document.getElementById('mainRosterSubDiv')).show();
        $(document.getElementById('gameDiv')).show();
        $(document.getElementById('sideNavMenusDiv')).show();
        $(document.getElementById('saveBtn')).show();
        $(document.getElementById('exportBtn')).show();
        startPoulesSorting();

        document.getElementById('ipAddress').innerHTML = `IP adres: ${address()}`;
        httpServer.listen(PORT, () => {
            console.log(`Server listening on http://${address()}:${PORT}`);
        });
        io.emit('pouleInfo', exportGameInfo(false));
    }
}

function makePoulesWithPan(){
    $(document.getElementById('playerInputDiv')).hide();
    //$(document.getElementById('controlBtnDiv')).show();
    //$(saveBtn).show();
    //$(document.getElementById('appSettingForm')).hide();
    $(document.getElementById('saveBtnDiv')).show();
    $(document.getElementById('exportBtnDiv')).show();
    $(document.getElementById('ipAddressDiv')).show();

    let playersPerPoule = numPlayers/numPoules;

    for(let i = 0; i < numPoules; i++){
        for (let j = 0; j < playersPerPoule; j++){
            switch(i){
                case 0:
                    playerName = document.getElementById(`playerA${j}`).value;
                    if(playerName != ""){
                        pouleA.players.push([playerName, 0]);
                    }
                break;
                case 1:
                    playerName = document.getElementById(`playerB${j}`).value;
                    if(playerName != ""){
                        pouleB.players.push([playerName, 0]);
                    }
                break;
                case 2:
                    playerName = document.getElementById(`playerC${j}`).value;
                    if(playerName != ""){
                        pouleC.players.push([playerName, 0]);
                    }
                break;
                case 3:
                    playerName = document.getElementById(`playerD${j}`).value;
                    if(playerName != ""){
                        pouleD.players.push([playerName, 0]);
                    }
                break;
            }
        }
    }

    let shouldBePrinted = document.getElementById('printCheckbox').checked;
    var filePath;

    if(shouldBePrinted){
        filePath = ipcRenderer.sendSync('selectPDFDirectory');
    }
    
    let playerSettingsForm = document.getElementById('playerSettingsDiv');
        
    if(pouleExists(pouleA)){
        pouleA.makePoule();
        pouleA.makeGames();
        for(var i = 0; i < pouleA.players.length; i++){
            let input = $(`<input id="playerA${i}Input" class="settingInput" type="text" value="${pouleA.players[i][0]}"></br>`)
            $(playerSettingsForm).append(input)
        }
        if(shouldBePrinted){
            exportPDF(pouleA, filePath, true);
        }
        $(document.getElementById('activeGamesDiv')).insertAfter($(document.getElementById('pouleA')));
    }

    if(pouleExists(pouleB)){
        pouleB.makePoule();
        pouleB.makeGames();
        for(var i = 0; i < pouleB.players.length; i++){
            let input = $(`<input id="playerB${i}Input" class="settingInput" type="text" value="${pouleB.players[i][0]}"></br>`)
            $(playerSettingsForm).append(input)
        }
        if(shouldBePrinted){
            exportPDF(pouleB, filePath, true);
        }
        $(document.getElementById('activeGamesDiv')).insertAfter($(document.getElementById('pouleB')));
    }

    if(pouleExists(pouleC)){
        pouleC.makePoule();
        pouleC.makeGames();
        for(var i = 0; i < pouleC.players.length; i++){
            let input = $(`<input id="playerC${i}Input" class="settingInput" type="text" value="${pouleC.players[i][0]}"></br>`)
            $(playerSettingsForm).append(input)
        }
        if(shouldBePrinted){
            exportPDF(pouleC, filePath, true);
        }
        $(document.getElementById('activeGamesDiv')).insertAfter($(document.getElementById('pouleC')));
    }

    if(pouleExists(pouleD)){
        pouleD.makePoule();
        pouleD.makeGames();
        for(var i = 0; i < pouleD.players.length; i++){
            let input = $(`<input id="playerD${i}Input" class="settingInput" type="text" value="${pouleD.players[i][0]}"></br>`)
            $(playerSettingsForm).append(input)
        }
        if(shouldBePrinted){
            exportPDF(pouleD, filePath, true);
        }
        $(document.getElementById('activeGamesDiv')).insertAfter($(document.getElementById('pouleD')));
    }
    $(document.getElementById('activeGamesDiv')).hide();

    if(numPoules > 1){
        makeFinals(numPoules);
    }else{
        let winnerTable = $('<table id="winnerTable" class="mainRosterTable"><tr><td colspan="3"><h2>Winnaar:</h2></td></tr><tr><td colspan="3"><h2 id="M81Name"></h2></td></tr></table>');
        $("#mainRosterSubDiv").append(winnerTable);
    }
    
    $(poulesDiv).show();
    //$(saveBtn).show();
    //$(document.getElementById('appSettingForm')).hide();
    $(document.getElementById('mainRosterDiv')).show();
    $(document.getElementById('mainRosterSubDiv')).show();
    $(document.getElementById('gameDiv')).show();
    $(document.getElementById('sideNavMenusDiv')).show();
    $(document.getElementById('saveBtn')).show();
    $(document.getElementById('exportBtn')).show();
    startPoulesSorting();

    

    document.getElementById('ipAddress').innerHTML = `IP adres: ${address()}`;
    httpServer.listen(PORT, () => {
        console.log(`Server listening on http://${address()}:${PORT}`);
    });
    io.emit('pouleInfo', exportGameInfo(false));
}

function preparePDFExport(){
    filepath = ipcRenderer.sendSync('selectPDFDirectory');
    for(let i = 0; i < numPoules; i++){
        switch(i){
            case 0:
                exportPDF(pouleA, filepath, true);
            break;
            case 1:
                exportPDF(pouleB, filepath, true);
            break;
            case 2:
                exportPDF(pouleC, filepath, true);
            break;
            case 3:
                exportPDF(pouleD, filepath, true);
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
    if(!exportToPDF){s
        var games = [];
    }
    for(let i = 0; i < poule.numGames; i++){
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

    let finals = $('<table id="finalsTable" class="mainRosterTable"><tr><th colspan="3"><h2>Finale</h2></th></tr><tr><td><h2 id="M71Name"></h2></td><td><h2>-</h2></td><td><h2 id="M72Name"></h2></td></tr><tr><td><input id="M71Score" class="gameScore"></td><td><h2>-</h2></td><td><input id="M72Score" class="gameScore"></td></tr></table>');
    $(rosterDiv).append(finals);

    if(numberOfPoules > 0){
        let winnerTable = $('<table id="winnerTable" class="mainRosterTable"><tr><td colspan="3"><h2>Winnaar:</h2></td></tr><tr><td colspan="3"><h2 id="M81Name"></h2></td></tr></table>');
        $("#mainRosterSubDiv").append(winnerTable);
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
                    if(pouleA.finalsDrawn){
                        document.getElementById('M71Name').innerHTML = pouleA.winner;
                        document.getElementById('M72Name').innerHTML = pouleA.secondPlace;
                    }
                }
            }else{
                if(numPoules >= 3){
                    document.getElementById('M11Name').innerHTML = "";
                    document.getElementById('M22Name').innerHTML = "";
                }else if(numPoules == 2){
                    document.getElementById('M51Name').innerHTML = "";
                    document.getElementById('M62Name').innerHTML = "";
                }else if(numPoules == 1){
                    if(pouleA.finalsDrawn){
                        document.getElementById('M71Name').innerHTML = "";
                        document.getElementById('M72Name').innerHTML = "";
                    }
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

        var finalsMsg = [];
        switch(parseInt(numPoules)){
            case 4:
                getFinalsWinner("M11", "M12", "M51");
                getFinalsWinner("M21", "M22", "M52");
                getFinalsWinner("M31", "M32", "M61");
                getFinalsWinner("M41", "M42", "M62");

                getFinalsWinner("M51", "M52", "M71");
                getFinalsWinner("M61", "M62", "M72");

                getFinalsWinner("M71", "M72", "M81");

                for(let i = 0; i < 7; i++){
                    var gameType = '';

                    if(4 < i < 0){
                        gameType = 'quart';
                    }else if(6 < i < 3){
                        gameType = 'half';
                    }else{
                        gameType = 'final';
                    }

                    finalsMsg.push(finalsGameToApp(i+1, gameType));
                }
            break;
            case 3:
                getFinalsWinner("M11", "M12", "M51");
                getFinalsWinner("M21", "M22", "M52");

                getFinalsWinner("M31", "M32", "M72");

                getFinalsWinner("M51", "M52", "M71");
                getFinalsWinner("M71", "M72", "M81");

                finalsMsg.push(finalsGameToApp(1, 'quart'));
                finalsMsg.push(finalsGameToApp(2, 'quart'));
                finalsMsg.push(finalsGameToApp(3, 'quart'));
                finalsMsg.push(finalsGameToApp(5, 'half'));
                finalsMsg.push(finalsGameToApp(7, 'final'));
            break;
            case 2:
                getFinalsWinner("M51", "M52", "M71");
                getFinalsWinner("M61", "M62", "M72");

                getFinalsWinner("M71", "M72", "M81");

                finalsMsg.push(finalsGameToApp(5, 'half'));
                finalsMsg.push(finalsGameToApp(6, 'half'));
                finalsMsg.push(finalsGameToApp(7, 'final'));
            break;
            case 1:
                if(pouleA.finalsDrawn){
                    getFinalsWinner("M71", "M72", "M81");

                    finalsMsg.push(finalsGameToApp(7, 'final'));
                }
            break;
        }
        io.emit('finalsInfo', finalsMsg);
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

function finalsGameToApp(gameNum, gameType){
    var tempArray = [];
    var gamePlayed = false;
    let player1Name = document.getElementById(`M${gameNum}1Name`).innerHTML;
    let player2Name = document.getElementById(`M${gameNum}2Name`).innerHTML;

    let player1Score = parseInt(document.getElementById(`M${gameNum}1Score`).value);
    let player2Score = parseInt(document.getElementById(`M${gameNum}2Score`).value);

    if(!isNaN(player1Score) || !isNaN(player2Score)){
        gamePlayed = true;
    }else if(player1Name == "" || player2Name == ""){
        gamePlayed = true;
    }

    tempArray.push(`M${gameNum}`);
    tempArray.push(player1Name);
    tempArray.push(player2Name);
    tempArray.push(gamePlayed);
    tempArray.push(gameType);

    return tempArray;
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
            return -1;
        }

        if(!gameFileName.includes(".darts")){
            gameFileName = gameFileName + ".darts"
        }
    }

    var jsonObj = {"poules":[], "games":[], "appSettings":[]};

    if(pouleExists(pouleA)){
        jsonObj["poules"].push({"pouleA":[]})
        jsonObj["poules"][0]["pouleA"].push({"numPlayers": pouleA.players.length})
        jsonObj["poules"][0]["pouleA"].push({"players":[]});
        for(let i = 0; i < pouleA.players.length; i++){

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
    }

    if(pouleExists(pouleB)){
        jsonObj["poules"].push({"pouleB":[]});
        jsonObj["poules"][1]["pouleB"].push({"numPlayers": pouleB.players.length});
        jsonObj["poules"][1]["pouleB"].push({"players":[]});
        for(let i = 0; i < pouleB.players.length; i++){

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
    }

    if(pouleExists(pouleC)){
        jsonObj["poules"].push({"pouleC":[]});
        jsonObj["poules"][2]["pouleC"].push({"numPlayers": pouleC.players.length});
        jsonObj["poules"][2]["pouleC"].push({"players":[]});
        for(let i = 0; i < pouleC.players.length; i++){

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

    }

    if(pouleExists(pouleD)){
        jsonObj["poules"].push({"pouleD":[]});
        jsonObj["poules"][3]["pouleD"].push({"numPlayers": pouleD.players.length});
        jsonObj["poules"][3]["pouleD"].push({"players":[]});
        for(let i = 0; i < pouleD.players.length; i++){

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

    jsonObj['appSettings'].push(appSettings);

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

function openNav(){
    for(let i=0; i<appSettings.length; i++){
        document.getElementById(appOptions[i]+"Input").value = appSettings[i];
    }

    document.getElementById("sideNav").style.right = "0px";
}

function closeNav(){
    document.getElementById("sideNav").style.right = "-250px";
    updateSettings();
}

function handle(e){
    key = e.keyCode || e.which;
    if(key == 13){
        e.preventDefault();
        updateSettings();
    }
}

function updateSettings(){
    for(let i=0; i<appSettings.length; i++){
        appSettings[i] = document.getElementById(appOptions[i]+"Input").value;
    }
    io.emit("settingsUpdate", appSettings);

    if(pouleExists(pouleA)){
        for(let i = 0; i < pouleA.players.length; i++){
            pouleA.players[i][0] = document.getElementById(`playerA${i}Input`).value;
        }
        pouleA.reloadPlayers();
    }

    if(pouleExists(pouleB)){
        for(let i = 0; i < pouleB.players.length; i++){
            pouleB.players[i][0] = document.getElementById(`playerB${i}Input`).value;
        }
        pouleB.reloadPlayers();
    }

    if(pouleExists(pouleC)){
        for(let i = 0; i < pouleC.players.length; i++){
            pouleC.players[i][0] = document.getElementById(`playerC${i}Input`).value;
        }
        pouleC.reloadPlayers();
    }

    if(pouleExists(pouleD)){
        for(let i = 0; i < pouleD.players.length; i++){
            pouleD.players[i][0] = document.getElementById(`playerD${i}Input`).value;
        }
        pouleD.reloadPlayers();
    }

    document.getElementById('appSettingsArrow').style.transform = "rotate(0deg)";
    document.getElementById('playerSettingsArrow').style.transform = "rotate(0deg)";
    $("#playerSettingsDiv").slideUp(300);
    $("#appSettingsDiv").slideUp(300);
}

function showAppSettings(){
    if(document.getElementById("appSettingsArrow").style.transform == "rotate(0deg)"){
        document.getElementById("appSettingsArrow").style.transform = "rotate(180deg)";
        document.getElementById("playerSettingsArrow").style.transform = "rotate(0deg)";
        document.getElementById("activeGamesArrow").style.transform = "rotate(0deg)";

        $("#activeGamesSideDiv").slideUp(300);
        $("#playerSettingsDiv").slideUp(300);
        $("#appSettingsDiv").slideDown(300);
    }else{
        document.getElementById("appSettingsArrow").style.transform = "rotate(0deg)";
        $("#appSettingsDiv").slideUp(300);
    }
}

function showPlayerSettings(){
    if(document.getElementById("playerSettingsArrow").style.transform == "rotate(0deg)"){
        document.getElementById("playerSettingsArrow").style.transform = "rotate(180deg)";
        document.getElementById("appSettingsArrow").style.transform = "rotate(0deg)";
        document.getElementById("activeGamesArrow").style.transform = "rotate(0deg)";

        $("#activeGamesSideDiv").slideUp(300);
        $("#appSettingsDiv").slideUp(300);
        $("#playerSettingsDiv").slideDown(300);
    }else{
        document.getElementById("playerSettingsArrow").style.transform = "rotate(0deg)";
        $("#playerSettingsDiv").slideUp(300);
    }
}

function showActiveGames(){
    if(document.getElementById("activeGamesArrow").style.transform == "rotate(0deg)"){
        document.getElementById("playerSettingsArrow").style.transform = "rotate(0deg)";
        document.getElementById("appSettingsArrow").style.transform = "rotate(0deg)";
        document.getElementById("activeGamesArrow").style.transform = "rotate(180deg)";

        $("#appSettingsDiv").slideUp(300);
        $("#playerSettingsDiv").slideUp(300);
        $("#activeGamesSideDiv").slideDown(300);
    }else{
        document.getElementById("activeGamesArrow").style.transform = "rotate(0deg)";
        $(document.getElementById('activeGamesSideDiv')).slideUp(300);
    }
}

function stopGame(gameID){
    gameID = gameID.replace('stop', '');
    console.log("Stopping game: " + gameID);

    for(let i = 0; i < activeGames.length; i++){
        if(activeGames[i][0] == gameID){
            activeGames.splice(i, 1);
            console.log(`Game ${gameID} stopped`);
        }
        $(document.getElementById(gameID)).remove();
        $(document.getElementById(`stop${gameID}`)).remove();
        $(document.getElementById(`${gameID}VL`)).remove();

        if(activeGames.length == 0){
            $(document.getElementById('activeGamesDiv')).hide();
        }
    }
}