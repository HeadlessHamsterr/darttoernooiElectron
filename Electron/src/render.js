//NPM modules
let $ = require('jquery');
let fs = require('fs');
let path = require('path');
const { ipcRenderer, app, TouchBarSlider } = require('electron');
const { default: jsPDF } = require('jspdf');
const { address } = require('ip');
const websocketServer = require('http').createServer();
const http = require('http');
const { spawn } = require('child_process');
const { count } = require('console');
const { clearInterval } = require('timers');
const { hostname } = require('os');
const udp = require('dgram');
const io = require('socket.io')(websocketServer, {
    cors: {
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling']
    },
    allowEIO3: true
});

//Self-made modules
const player = require('../modules/player.js');
const { outs, supportedAppVersions } = require('../modules/constants.js');
const pouleGames = require('../modules/pouleGames.js');
const decodeAppMessage = require('../modules/appMessageDecoder.js');

//Begin waarden om de JSON te kunnen maken
let appSettings = {
    "pouleScore": 0,
    "pouleLegs": 0,
    "quartScore": 0,
    "quartLegs": 0,
    "halfScore": 0,
    "halfLegs": 0,
    "finalScore": 0,
    "finalLegs": 0
};

var audioEnabled = false;
var pouleSortingTimer;
var quickSaveTimer;
var makePoulesBtn;
const sockets = new Set();
var numPlayers = 0;
var numPoules = 0;
const appOptions = ["pouleScore", "pouleLegs", "quartScore", "quartLegs", "halfScore", "halfLegs", "finalScore", "finalLegs"];
const specialSounds = ["006", "020", "023", "042", "063", "064"];
var activeGames = [];
var activeGamesWindowOpen = false;
var hostName = 'Gefaald';
let finalsGames = [];
let version = ''
let screenState = "startScreen";

var udpServer = udp.createSocket("udp4")
udpServer.bind(8889);


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
    socket.on("serverNameRequest", (data) => {
        console.log("server name request received");
        let msg = [hostName, address().toString()];
        console.log(msg);
        socket.emit('serverName', msg);
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

        let settingsArray = [];
        for(let key in appSettings){
            settingsArray.push(appSettings[key]);
        }

        msg.push(settingsArray);
        console.log(msg);
        socket.emit('pouleInfo', msg);
    });
    socket.on('pouleAInfoRequest', (data) => {
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

                    if(0 < i < 4){
                        gameType = 'quart';
                    }else if(3 < i < 6){
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
        console.log(finalsMsg)
        socket.emit('finalsInfo', finalsMsg);
    });
    socket.on('gamePlayed', (message) => {
        const data = decodeAppMessage("gamePlayed", message);
        console.log(data);
        if(data.gameType == 'finals_game'){
            document.getElementById(`${data.gameID}1Score`).value = data.player1LegsWon;
            document.getElementById(`${data.gameID}2Score`).value = data.player2LegsWon;
        }else{
            document.getElementById(`game${data.gameID}1Score`).value = data.player1LegsWon;
            document.getElementById(`game${data.gameID}2Score`).value = data.player2LegsWon;
        }

        for(let i = 0; i < activeGames.length; i++){
            if(activeGames[i][0] == data.gameID){
                activeGames.splice(i, 1);
                console.log(`Game ${data.gameID} stopped`);

                $(document.getElementById(data.gameID)).remove();
                $(document.getElementById(`stop${data.gameID}`)).remove();
                $(document.getElementById(`${data.gameID}VL`)).remove();

                if(activeGames.length == 0){
                    $(document.getElementById('activeGamesDiv')).hide();
                }
                ipcRenderer.send('sendStopActiveGame', data.gameID);
                break;
            }
        }

        var msg;
        switch(data.gameID[0]){
            case 'A':
                pouleA.updatePoints();

                let averages = [data.player1Average, data.player2Average]
                console.log(`Averages: ${averages}`)
                for(let i = 0; i < 2; i++){
                    let playerAverage = Math.round(parseFloat(averages[i])*100)/100;
                    pouleA.players[pouleA.gameFormat[data.gameID[1]-1][i]].totalAvg += playerAverage;
                }    

                /*
                for(let i = 0; i < pouleA.players.length; i++){
                    console.log(`${pouleA.players[i].name} has ${pouleA.players[i].hiddenPoints} hidden points and played ${pouleA.players[i].gamesPlayed} games with ${pouleA.players[i].tournamentAvg} average score`);
                }
                */
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
    socket.on('activeGameInfo', (message) => {
        const data = decodeAppMessage("activeGameInfo", message);
        let windowMsg = [data]

        $(document.getElementById('activeGamesDiv')).show();
        var newGame = true

        for(let i = 0; i < activeGames.length; i++){
            if(activeGames[i][0] == data.gameID){
                newGame = false;
                break;
            }
        }

        if(newGame){
            console.log(`New game ${data.gameID} started`);
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

            if(data.gameType == 'finals_game'){
                player1 = document.getElementById(`${data.gameID}1Name`).innerHTML;
                player2 = document.getElementById(`${data.gameID}2Name`).innerHTML;
            }else{
                player1 = document.getElementById(`game${data.gameID}1Name`).innerHTML;
                player2 = document.getElementById(`game${data.gameID}2Name`).innerHTML;
            }

            if(activeGames.length > 0){
                $(div).append(`<div id="${data.gameID}VL" class="vl">`)
            }

            $(div).append(`<table id="${data.gameID}" class="activeGameTable"><tr><td id="activePlayer${data.gameID}1">${player1}</td><td><i id="${data.gameID}TurnArrow" class="material-icons turnArrow">expand_more</i></td><td id="activePlayer${data.gameID}2">${player2}</td></tr><tr><td id="activeDarts${data.gameID}1"></td><td>Darts</td><td id="activeDarts${data.gameID}2"></td></tr><tr><td id="activeLeg${data.gameID}1"></td><td>Legs</td><td id="activeLeg${data.gameID}2"></td></tr><tr><td id="activeScore${data.gameID}1"></td><td></td><td id="activeScore${data.gameID}2"></td></tr><tr><td id="out${data.gameID}1"></td><td></td><td id="out${data.gameID}2"></td></tr></table>`)
            
            let tempArray = [data.gameID, socket.id];
            activeGames.push(tempArray);
            
            let stopGameDiv = document.getElementById('activeGamesSideDiv');
            $(stopGameDiv).append(`<button id="stop${data.gameID}" class="stopGameButton" onclick="stopGame(this.id)">${player1} - ${player2} <i id='remGameIcon' class='material-icons'>delete</i></button>`);
            var msg;
            switch(data.gameType){
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

        document.getElementById(`activeLeg${data.gameID}1`).innerHTML = data.player1LegsWon;
        document.getElementById(`activeLeg${data.gameID}2`).innerHTML = data.player2LegsWon;
        document.getElementById(`activeScore${data.gameID}1`).innerHTML = data.player1Score;
        document.getElementById(`activeScore${data.gameID}2`).innerHTML = data.player2Score;
        document.getElementById(`activeDarts${data.gameID}1`).innerHTML = data.player1DartsThrown;
        document.getElementById(`activeDarts${data.gameID}2`).innerHTML = data.player2DartsThrown;

        if(/*data.thrownScore != '0' && */data.thrownScore != undefined && audioEnabled){
            console.log(`Received thrown score: ${data.thrownScore}`);
            var soundNumber;
            if(data.thrownScore == 'Standaard'){
                soundNumber = '26';
            }else{
                soundNumber = data.thrownScore;
            }

            if(soundNumber.length < 3){
                if(soundNumber.length == 1){
                    soundNumber = '00' + soundNumber;
                }else if(soundNumber.length == 2){
                    soundNumber = '0' + soundNumber;
                }
            }
            let soundFile;
            if(!document.getElementById('normalSound').checked && specialSounds.includes(soundNumber)){
                soundFile = path.join(__dirname,('../audio/M' + soundNumber + '.mp3'));
            }else{
                soundFile = path.join(__dirname, ('../audio/' + soundNumber + ".mp3"));
            }

            let audio = new Audio(soundFile);
            audio.play();
        }

        if(data.startingPlayer == '0'){
            document.getElementById(`activePlayer${data.gameID}1`).style.color = 'green';
            document.getElementById(`activePlayer${data.gameID}2`).style.color = 'white';
        }else{
            document.getElementById(`activePlayer${data.gameID}1`).style.color = 'white';
            document.getElementById(`activePlayer${data.gameID}2`).style.color = 'green';
        }

        if(data.player1Turn == 'true'){
            document.getElementById(`${data.gameID}TurnArrow`).style.transform = 'rotate(90deg)';
        }else{
            document.getElementById(`${data.gameID}TurnArrow`).style.transform = 'rotate(270deg)';
        }

        if(data.player1Score <= 170 && data.player1Score > 0){
            document.getElementById(`out${data.gameID}1`).innerHTML = outs[170-data.player1Score];
            windowMsg.push(outs[170-data.player1Score]);
        }else{
            document.getElementById(`out${data.gameID}1`).innerHTML = '';
            windowMsg.push('');
        }

        if(data.player2Score <= 170 && data.player2Score > 0){
            document.getElementById(`out${data.gameID}2`).innerHTML = outs[170-data.player2Score];
            windowMsg.push(outs[170-data.player2Score]);
        }else{
            document.getElementById(`out${data.gameID}2`).innerHTML = '';
            windowMsg.push('');
        }

        var player1;
        var player2;

        if(data.gameType == 'finals_game'){
            player1 = document.getElementById(`${data.gameID}1Name`).innerHTML;
            player2 = document.getElementById(`${data.gameID}2Name`).innerHTML;
        }else{
            player1 = document.getElementById(`game${data.gameID}1Name`).innerHTML;
            player2 = document.getElementById(`game${data.gameID}2Name`).innerHTML;
        }

        if(newGame){
            windowMsg.push(player1);
            windowMsg.push(player2);
            ipcRenderer.send("sendNewActiveGameInfo", windowMsg);
        }else{
            ipcRenderer.send("sendActiveGameInfo", windowMsg);
        }
    });
    socket.on('stopActiveGame', (gameName) => {
        for(let i = 0; i < activeGames.length; i++){
            if(activeGames[i][0] == gameName){
                activeGames.splice(i, 1);
                console.log(`Game ${gameName} stopped`);

                $(document.getElementById(gameName)).remove();
                $(document.getElementById(`stop${gameName}`)).remove();
                $(document.getElementById(`${gameName}VL`)).remove();

                if(activeGames.length == 0){
                    $(document.getElementById('activeGamesDiv')).hide();
                }
                break;
            }
        }
        ipcRenderer.send('sendStopActiveGame', gameName);
        
        var msg;
        switch(gameName[0]){
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

ipcRenderer.on("noUpdateAvailable", (event, arg) => {
    continueToGame();
});

ipcRenderer.on("version", (event, arg) => {
    version = arg;
    console.log(`Version: ${version} (${version[0]})`);
})

ipcRenderer.on("updateAvailable", (event, arg) => {
    let yesBtn = document.getElementById('update');
    let noBtn = document.getElementById('noUpdate');

    yesBtn.addEventListener('click', function(){
        updateAvailable(arg);
    });

    noBtn.addEventListener('click', function(){
        ipcRenderer.send('loadIndex');
    });
});

var PORT = 11520;

var players = [];

let pouleA = new pouleGames("A");
let pouleB = new pouleGames("B");
let pouleC = new pouleGames("C");
let pouleD = new pouleGames("D");

const poules = [pouleA, pouleB, pouleC, pouleD];

async function updateAvailable(msg){
    let downloadUrl = msg[0];
    let fileName = msg[1];
    savePath = ipcRenderer.sendSync('downloadPath');

    if(savePath == "canceled"){
        ipcRenderer.send('loadIndex');
        return 1;
    }else{
        savePath += `/${fileName}`;
    }
    console.log(`Save path: ${savePath}`)
    $(document.getElementById('updateDiv')).hide();
    $(document.getElementById('progressDiv')).show();
    await download(downloadUrl, savePath, (bytes, percent) => updateProgress(percent));

    $(document.getElementById('progressDiv')).hide();

    if(process.platform == "win32"){
        $(document.getElementById('updateDoneWindows')).show();
        let installBtn = document.getElementById('install');
        let quitBtn = document.getElementById('quit');

        quitBtn.addEventListener('click', function(){
            ipcRenderer.send("klaarErmee");
        });

        installBtn.addEventListener('click', function(){
            let sheet = window.document.styleSheets[0];
            sheet.insertRule('*{cursor: wait;}', sheet.cssRules.length);
            
            const handle = spawn(savePath, {
                detached: true,
                stdio: [null, null, null, 'ipc']
            });
            handle.on('message', (msg) => {
                handle.unref();
                handle.off('message');
                handle.disconnect();
                ipcRenderer.send('klaarErmee');
            });
        });
    }else if(process.platform == 'linux'){
        $(document.getElementById('updateDoneLinux')).show();
        document.getElementById('updatePath').innerHTML = savePath;
        let quitBtn = document.getElementById('quitLinux');
        quitBtn.addEventListener('click', function(){
            ipcRenderer.send("klaarErmee");
        });
    }
}

function updateProgress(progress){
    document.getElementById('progressBar').style.width = `${progress}%`;
    document.getElementById('downloadPerc').innerHTML = `${progress}%`;
}

async function download(
  sourceUrl,
  targetFile,
  progressCallback,
  length
) {
  const request = new Request(sourceUrl, {
    headers: new Headers({ "Content-Type": "application/octet-stream" }),
  });

  const response = await fetch(request);
  if (!response.ok) {
    throw Error(
      `Unable to download, server returned ${response.status} ${response.statusText}`
    );
  }

  const body = response.body;
  if (body == null) {
    throw Error("No response body");
  }

  const finalLength =
    length || parseInt(response.headers.get("Content-Length" || "0"), 10);
  const reader = body.getReader();
  const writer = fs.createWriteStream(targetFile);

  await streamWithProgress(finalLength, reader, writer, progressCallback);
  writer.end();
}

async function streamWithProgress(length, reader, writer, progressCallback) {
  let bytesDone = 0;

  while (true) {
    const result = await reader.read();
    if (result.done) {
      if (progressCallback != null) {
        progressCallback(length, 100);
      }
      return;
    }

    const chunk = result.value;
    if (chunk == null) {
      throw Error("Empty chunk received during download");
    } else {
      writer.write(Buffer.from(chunk));
      if (progressCallback != null) {
        bytesDone += chunk.byteLength;
        const percent =
          length === 0 ? null : Math.floor((bytesDone / length) * 100);
        progressCallback(bytesDone, percent);
      }
    }
  }
}

function continueToGame(){
    let names = fs.readFileSync(path.join(__dirname, '../names.txt'),{
        encoding: 'utf8',
    });
    let namesList = names.split('\n');
    hostName = namesList[Math.floor(Math.random() * namesList.length)]
    ipcRenderer.send('hostNameUpdate', hostName);
    tieBreakersEnabled = true;

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
    
    makePoulesBtn = document.getElementById('mkPoulesBtn');

    $(document.getElementById('gameSetup')).hide();
    $(document.getElementById('controlBtnDiv')).hide();
    $(document.getElementById('playerInputDiv')).hide();
    $(document.getElementById('poulesDiv')).hide();
    $(document.getElementById('gameDiv')).hide();
}

function returnToHome(){
    console.log("Returning home...")
    io.emit("gameClose");
    ipcRenderer.send("restart")
    /*io.emit("gameClose");
    udpServer.on("message", ()=>{});

    closeNav();
    clearInterval(quickSaveTimer);
    clearInterval(pouleSortingTimer);
    for(const socket in sockets){
        socket.destroy();
        sockets.delete(socket);
    }
    websocketServer.close();

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
    
    for(let key in appSettings){
        appSettings[key] = null;
    }

    numPlayers = 0;
    numPoules = 0;

    $(document.getElementById('gameSetup')).hide();
    $(document.getElementById('gameDiv')).hide();
    $(document.getElementById('poulesDiv')).hide();
    $(document.getElementById('playerInputDiv')).hide();
    closeNav();
    $(document.getElementById('controlBtnDiv')).hide();
    $(document.getElementById('gameOptionsWrapper')).show();
    */
}

function drawSetup(){
    screenState = "setupScreen"
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
        alert("Geen bestand geselecteerd.")
        returnToHome();
        return -1;
    }

    $(document.getElementById('gameOptionsWrapper')).hide();
    $(poulesDiv).show();
    $(document.getElementById('controlBtnDiv')).show();
    $(document.getElementById('saveBtn')).show();
    $(document.getElementById('exportBtn')).show();
    $(document.getElementById('ipAddressDiv')).show();
    $(document.getElementById('sideNavMenusDiv')).show();
    $(document.getElementById('mainRosterDiv')).show();
    $(document.getElementById('mainRosterSubDiv')).show();
    $(document.getElementById('gameDiv')).show();

    screenState = 'gameScreen';

    pouleA.players = [];
    pouleB.players = [];
    pouleC.players = [];
    pouleD.players = [];


    let jsonString = fs.readFileSync(path.resolve(gameFileName), function(err){
        if(err){
            console.log(err);
        }
    });

    if(!gameFileName.includes('.darts')){
        alert("Onbekend bestandstype.");
        returnToHome();
        return -1;
    }
    
    let jsonObj = JSON.parse(jsonString);

    if(!jsonObj.hasOwnProperty('version') || jsonObj.version[0] != version[0]){
        alert("Deze bestandsversie wordt niet ondersteund.");
        returnToHome();
        return -1;
    }

    for(let key in jsonObj.appSettings){
        console.log(jsonObj.appSettings[key])
        appSettings[key] = jsonObj.appSettings[key];
        console.log(appSettings[key])
    }

    numPoules = jsonObj.numPoules;

    console.log(`Numpoules: ${numPoules}`)

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
        numPlayers += jsonObj.poules[poule].numPlayers;
        console.log(`${poule} numPlayers: ${numPlayers}`);
    }
    
    //Load Poule A
    let playerSettingsForm = document.getElementById('playerSettingForm');
    $(playerSettingsForm).empty();
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
                let player1Name = jsonObj["games"][i]["player1"];
                let player1Score = jsonObj["games"][i]["score1"];
                let player2Name = jsonObj["games"][i]["player2"];
                let player2Score = jsonObj["games"][i]["score2"];

                document.getElementById(`M${i+1}1Name`).innerHTML = player1Name;
                document.getElementById(`M${i+1}1Score`).value = player1Score;
                document.getElementById(`M${i+1}2Name`).innerHTML = player2Name;
                document.getElementById(`M${i+1}2Score`).value = player2Score;
            }
        break;
        case 3:
            for(let i = 0; i < 5; i++){
                let player1Name = jsonObj["games"][i]["player1"];
                let player1Score = jsonObj["games"][i]["score1"];
                let player2Name = jsonObj["games"][i]["player2"];
                let player2Score = jsonObj["games"][i]["score2"];

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
                let player1Name = jsonObj["games"][i]["player1"];
                let player1Score = jsonObj["games"][i]["score1"];
                let player2Name = jsonObj["games"][i]["player2"];
                let player2Score = jsonObj["games"][i]["score2"];
                
                document.getElementById(`M${i+5}1Name`).innerHTML = player1Name;
                document.getElementById(`M${i+5}1Score`).value = player1Score;
                document.getElementById(`M${i+5}2Name`).innerHTML = player2Name;
                document.getElementById(`M${i+5}2Score`).value = player2Score;
            }
        break;
        case 1:
            let player1Name = jsonObj["games"][0]["player1"];
            let player1Score = jsonObj["games"][0]["score1"];
            let player2Name = jsonObj["games"][0]["player2"];
            let player2Score = jsonObj["games"][0]["score2"];

            document.getElementById('M71Name').innerHTML = player1Name;
            document.getElementById('M71Score').value = player1Score;
            document.getElementById('M72Name').innerHTML = player2Name;
            document.getElementById('M72Score').value = player2Score;
        break;
    }

    startPeriodicStuff();
    //document.getElementById('serverName').innerHTML = `IP adres: ${address()}`;
    document.getElementById('serverName').innerHTML = `Server naam: ${hostName}`;
    document.getElementById('serverIP').innerHTML = `Server IP: ${address()}`;

    websocketServer.listen(PORT, () => {
        console.log(`Server listening on http://${address()}:${PORT}`);
        serverStarted = true;
    });

    const requestListener = function(req, res){
        res.writeHead(301, {"Location": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"});
        return res.end();
    }

    udpServer.on("message", function(message){
        message = message.toString();
        let messageList = message.split(',')
        console.log(message);
        if(messageList[0] == "serverNameRequest"){
            if(messageList[2][0] == version[0]){
                let msg = `serverName,${hostName},${address()}`;
                udpServer.send(msg, 8889, messageList[1]);
            }else{
                console.log(`Unsupported app version on ${messageList[1]}`);
            }
        }
    });

    io.emit('pouleInfo', exportGameInfo(false));

    if(numPoules == 1){
        toggleAudio();
    }
}

function loadPoulGames(pouleLetter, jsonObj){
    var pouleToEdit;

    switch(pouleLetter){
        case "A":
            pouleToEdit = pouleA;
        break;
        case "B":
            pouleToEdit = pouleB;
        break;
        case "C":
            pouleToEdit = pouleC;
        break;
        case "D":
            pouleToEdit = pouleD;
        break;
    }

    for(let i = 0; i < jsonObj.poules[`poule${pouleLetter}`].numPlayers; i++){
        let playerName = jsonObj.poules[`poule${pouleLetter}`].players[i]["name"];
        let playerScore = jsonObj.poules[`poule${pouleLetter}`].players[i]["points"];
        let playerCounter = jsonObj.poules[`poule${pouleLetter}`].players[i]["counterPoints"];

        let newPlayer = new player(playerName);
        newPlayer.legsWon = playerScore;
        newPlayer.legsWon = playerCounter;
        newPlayer.calculateHiddenPoints();
        pouleToEdit.players.push(newPlayer);
    }

    pouleToEdit.makePoule();
    pouleToEdit.makeGames();

    for(let i = 0; i < pouleToEdit.numGames; i++){
        let gameScore1Saved = jsonObj.poules[`poule${pouleLetter}`].games[i]["score1"];
        let gameScore2Saved = jsonObj.poules[`poule${pouleLetter}`].games[i]["score2"];

        if(gameScore1Saved > 0 || gameScore2Saved > 0){
            let gameScore1Field = document.getElementById(`game${pouleLetter}${i+1}1Score`);
            let gameScore2Field = document.getElementById(`game${pouleLetter}${i+1}2Score`);
            gameScore1Field.value = gameScore1Saved;
            gameScore2Field.value = gameScore2Saved;
        }
    }
    let playerSettingsForm = document.getElementById('playerSettingForm');
    for(var i = 0; i < pouleToEdit.players.length; i++){
        let input = $(`<input id="player${pouleLetter}${i}Input" class="settingInput" type="text" value="${pouleToEdit.players[i].name}"></br>`)
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
        screenState = "playersInput"
        $(document.getElementById('numPlayers')).css('border-color', '#414141');
        $(document.getElementById('numPoules')).css('border-color', '#414141');
        document.getElementById('setupErrorSpan').innerHTML = "";

        numPlayers = parseInt(numPlayers);
        numPoules = parseInt(numPoules);

        for(let key in appSettings){
            let selectId = `${key}Select`;
            appSettings[key] = document.getElementById(selectId).value;
        }

        console.log("Game score settings:")
        console.log(appSettings);

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

            makePoulesBtn.onclick = makePoules;
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
    let panModus = document.getElementById('panModCheck').checked;
    let playerEmpty = false;
    let playersPerPoule = numPlayers/numPoules;
    
    //Array om spelers op te slaan per poule
    let playerGrouping = [[], [], [], []];
    
    if(panModus){
        let pouleLetters = ['A', 'B', 'C', 'D'];
        for(let i = 0; i < numPoules; i++){
            let playerNames = [];
            for(let j = 0; j < playersPerPoule; j++){
                let activePlayer = document.getElementById(`player${pouleLetters[i]}${j}`);
                let playerName = activePlayer.value;

                if(playerName != ""){
                    playerNames.push(playerName);
                    $(player).css('border-color', '#414141');
                }else{
                    playerEmpty = true;
                    $(player).css('border-color', 'red')
                }
            }
            playerGrouping[i] = (playerNames);
        }
        if(playerEmpty){
            document.getElementById('playerInputErrorSpan').innerHTML = "Vul voor alle spelers een naam in."
            return -1;
        }
        //Error div moet leeggemaakt worden, anders blijft de error staan
        document.getElementById('playerInputErrorSpan').innerHTML = "";

        console.log(playerGrouping);
    }else{
        let playerEmpty = false;
        players = [];
        
        for(let i = 0; i < numPlayers; i++){
            let playerName = document.getElementById(`player${i}`).value;
            if(playerName == ""){
                $(document.getElementById(`player${i}`)).css('border-color', 'red');
                playerEmpty = true;
            }else{
                $(document.getElementById(`player${i}`)).css('border-color', '#414141');
                players.push(playerName);
            }
        }
        
        if(playerEmpty){
            document.getElementById('playerInputErrorSpan').innerHTML = "Vul voor alle spelers een naam in."
            return -1;
        }
        
        document.getElementById('playerInputErrorSpan').innerHTML = "";
        
        players.sort(function(a,b){return 0.5 - Math.random()});

        const PLAYERS_PER_POULE = numPlayers/numPoules;
        const PLAYERS_PER_POULE_ROUNDED = Math.round(PLAYERS_PER_POULE);

        if(PLAYERS_PER_POULE - PLAYERS_PER_POULE_ROUNDED > 0){
            for(let i = 0; i < numPlayers-1; i++){
                if(i < PLAYERS_PER_POULE_ROUNDED){
                    playerGrouping[0].push(players[i]);
                }else if(PLAYERS_PER_POULE_ROUNDED <= i && i < (2*PLAYERS_PER_POULE_ROUNDED)){
                    playerGrouping[1].push(players[i]);
                }else if((2*PLAYERS_PER_POULE_ROUNDED) <= i && i < (3*PLAYERS_PER_POULE_ROUNDED)){
                    playerGrouping[2].push(players[i]);
                }else if((3*PLAYERS_PER_POULE_ROUNDED) <= i && i < (4*PLAYERS_PER_POULE_ROUNDED)){
                    playerGrouping[3].push(players[i]);
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

            playerGrouping[randomNumber].push(players[numPlayers-1]);

        }else{
            for(let i = 0; i < numPlayers; i++){
                if(i < PLAYERS_PER_POULE_ROUNDED){
                    playerGrouping[0].push(players[i]);
                }else if(PLAYERS_PER_POULE_ROUNDED <= i && i < (2*PLAYERS_PER_POULE_ROUNDED)){
                    playerGrouping[1].push(players[i]);
                }else if((2*PLAYERS_PER_POULE_ROUNDED) <= i && i < (3*PLAYERS_PER_POULE_ROUNDED)){
                    playerGrouping[2].push(players[i]);
                }else if((3*PLAYERS_PER_POULE_ROUNDED) <= i && i < (4*PLAYERS_PER_POULE_ROUNDED)){
                    playerGrouping[3].push(players[i]);
                }
            }
        }

        console.log(playerGrouping);
    }

    let shouldBePrinted = document.getElementById('printCheckbox').checked;
    let playerSettingsForm = document.getElementById('playerSettingForm');
    $(playerSettingsForm).empty();

    for(let i = 0; i < numPoules; i++){
        console.log(playerGrouping[i]);
        addPlayersToPoule(poules[i], playerGrouping[i], shouldBePrinted, playerSettingsForm);
    }

    //Active games div wordt bij het maken van de poules naar achteren geschoven, maar moet daarna nog verstopt worden.
    $(document.getElementById('activeGamesDiv')).hide();
    
    if(numPoules > 1){
        makeFinals(numPoules);
    }else{
        let winnerTable = $('<table id="winnerTable" class="mainRosterTable"><tr><td colspan="3"><h2>Winnaar:</h2></td></tr><tr><td colspan="3"><h2 id="M81Name"></h2></td></tr></table>');
        $("#mainRosterSubDiv").append(winnerTable);
    }

    screenState = "gameScreen"
    
    $(document.getElementById('playerInputDiv')).hide();
    $(document.getElementById('saveBtnDiv')).show();
    $(document.getElementById('exportBtnDiv')).show();
    $(document.getElementById('ipAddressDiv')).show();
    $(document.getElementById('poulesDiv')).show();
    $(document.getElementById('mainRosterDiv')).show();
    $(document.getElementById('mainRosterSubDiv')).show();
    $(document.getElementById('gameDiv')).show();
    $(document.getElementById('sideNavMenusDiv')).show();
    $(document.getElementById('saveBtn')).show();
    $(document.getElementById('exportBtn')).show();
    
    startPeriodicStuff();
    document.getElementById('serverName').innerHTML = `Server naam: ${hostName}`;
    document.getElementById('serverIP').innerHTML = `Server IP: ${address()}`;
    websocketServer.listen(PORT, () => {
        console.log(`Server listening on http://${address()}:${PORT}`);
    });

    udpServer.on("message", function(message){
        message = message.toString();
        let messageList = message.split(',');
        
        if(messageList[0] == "serverNameRequest"){
            if(messageList[2][0] == version[0]){
                let msg = `serverName,${hostName},${address()}`;
                udpServer.send(msg, 8889, messageList[1]);
            }else{
                console.log(`Unsupported app version on ${messageList[1]}`);
            }
        }
    });
    io.emit('pouleInfo', exportGameInfo(false));

    if(numPoules == 1){
        toggleAudio();
    }
}

function addPlayersToPoule(poule, players, shouldBePrinted, playerSettingsForm){
    console.log(players);
    for(let i = 0; i < players.length; i++){
        poule.players.push(new player(players[i]))
    }

    poule.makePoule();
    poule.makeGames();

    for(let i = 0; i < poule.players.length; i++){
        let input = $(`<input id="player${poule.pouleNum}${i}Input" class="settingInput" type="text" value="${poule.players[i].name}"></br>`);
        $(playerSettingsForm).append(input);
    }

    if(shouldBePrinted){
        let filePath = ipcRenderer.sendSync('selectPDFDirectory');
        exportPDF(poule, filePath);
    }
    $(document.getElementById('activeGamesDiv')).insertAfter($(document.getElementById(`poule${poule.pouleNum}`)));
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

function makeFinals(numberOfPoules, finalType = ""){
    var rosterDiv = document.getElementById('mainRosterSubDiv');
    numberOfPoules = parseInt(numberOfPoules)

    if(numberOfPoules == 4){
        let quarters = $('<table class="mainRosterTable"><tr><th colspan="3"><h2>Kwart Finale</h2></th></tr><tr><td><h2 id="M11Name"></h2></td><td><h2>-</h2></td><td><h2 id="M12Name"></h2></td></tr><tr><td><input id="M11Score" class="gameScore"></td><td><h2>-</h2></td><td><input id="M12Score" class="gameScore"></td></tr><tr><td><h2 id="M21Name"></h2></td><td><h2>-</h2></td><td><h2 id="M22Name"></h2></td></tr><tr><td><input id="M21Score" class="gameScore"></td><td><h2>-</h2></td><td><input id="M22Score" class="gameScore"></td></tr><tr><td><h2 id="M31Name"></h2></td><td><h2>-</h2></td><td><h2 id="M32Name"></h2></td></tr><tr><td><input id="M31Score" class="gameScore"></td><td><h2>-</h2></td><td><input id="M32Score" class="gameScore"></td></tr><tr><td><h2 id="M41Name"></h2></td><td><h2>-</h2></td><td><h2 id="M42Name"></h2></td></tr><tr><td><input id="M41Score" class="gameScore"></td><td><h2>-</h2></td><td><input id="M42Score" class="gameScore"></td></tr></table>')
        let halves = $('<table class="mainRosterTable"><tr><th colspan="3"><h2>Halve Finale</h2></th></tr><tr><td><h2 id="M51Name"></h2></td><td><h2>-</h2></td><td><h2 id="M52Name"></h2></td></tr><tr><td><input id="M51Score" class="gameScore"></td><td><h2>-</h2></td><td><input id="M52Score" class="gameScore"></td></tr><tr><td><h2 id="M61Name"></h2></td><td><h2>-</h2></td><td><h2 id="M62Name"></h2></td></tr><tr><td><input id="M61Score" class="gameScore"></td><td><h2>-</h2></td><td><input id="M62Score" class="gameScore"></td></tr></table>');
        $(rosterDiv).append(quarters);
        $(rosterDiv).append(halves);

        finalsGames = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'];
    }else if(numberOfPoules == 3){
        let quarters = $('<table class="mainRosterTable"><tr><th colspan="3"><h2>Kwart Finale</h2></th></tr><tr><td><h2 id="M11Name"></h2></td><td><h2>-</h2></td><td><h2 id="M12Name"></h2></td></tr><tr><td><input id="M11Score" class="gameScore"></td><td><h2>-</h2></td><td><input id="M12Score" class="gameScore"></td></tr><tr><td><h2 id="M21Name"></h2></td><td><h2>-</h2></td><td><h2 id="M22Name"></h2></td></tr><tr><td><input id="M21Score" class="gameScore"></td><td><h2>-</h2></td><td><input id="M22Score" class="gameScore"></td></tr><tr><td><h2 id="M31Name"></h2></td><td><h2>-</h2></td><td><h2 id="M32Name"></h2></td></tr><tr><td><input id="M31Score" class="gameScore"></td><td><h2>-</h2></td><td><input id="M32Score" class="gameScore"></td></tr></table>')
        let halves = $('<table class="mainRosterTable"><tr><th colspan="3"><h2>Halve Finale</h2></th></tr><tr><td><h2 id="M51Name"></h2></td><td><h2>-</h2></td><td><h2 id="M52Name"></h2></td></tr><tr><td><input id="M51Score" class="gameScore"></td><td><h2>-</h2></td><td><input id="M52Score" class="gameScore"></td></tr></table>');
        $(rosterDiv).append(quarters);
        $(rosterDiv).append(halves);
        finalsGames = ['M1', 'M2', 'M3', 'M5'];
    }

    if(numberOfPoules == 2){
        let halves = $('<table class="mainRosterTable"><tr><th colspan="3"><h2>Halve Finale</h2></th></tr><tr><td><h2 id="M51Name"></h2></td><td><h2>-</h2></td><td><h2 id="M52Name"></h2></td></tr><tr><td><input id="M51Score" class="gameScore"></td><td><h2>-</h2></td><td><input id="M52Score" class="gameScore"></td></tr><tr><td><h2 id="M61Name"></h2></td><td><h2>-</h2></td><td><h2 id="M62Name"></h2></td></tr><tr><td><input id="M61Score" class="gameScore"></td><td><h2>-</h2></td><td><input id="M62Score" class="gameScore"></td></tr></table>');
        $(rosterDiv).append(halves);
        finalsGames = ['M5', 'M6'];
    }

    let finals = ""
    if(finalType == "secondPlace"){
        finals = $('<table id="finalsTable" class="mainRosterTable"><tr><th colspan="3"><h2>Verliezers finale</h2></th></tr><tr><td><h2 id="M71Name"></h2></td><td><h2>-</h2></td><td><h2 id="M72Name"></h2></td></tr><tr><td><input id="M71Score" class="gameScore"></td><td><h2>-</h2></td><td><input id="M72Score" class="gameScore"></td></tr></table>');    
    }else{
        finals = $('<table id="finalsTable" class="mainRosterTable"><tr><th colspan="3"><h2>Finale</h2></th></tr><tr><td><h2 id="M71Name"></h2></td><td><h2>-</h2></td><td><h2 id="M72Name"></h2></td></tr><tr><td><input id="M71Score" class="gameScore"></td><td><h2>-</h2></td><td><input id="M72Score" class="gameScore"></td></tr></table>');
    }
    finalsGames.push('M7');
    $(rosterDiv).append(finals);

    if(numberOfPoules > 0){
        let winnerTable = $('<table id="winnerTable" class="mainRosterTable"><tr><td colspan="3"><h2>Winnaar:</h2></td></tr><tr><td colspan="3"><h2 id="M81Name"></h2></td></tr></table>');
        $("#mainRosterSubDiv").append(winnerTable);
    }
}

function startPeriodicStuff(){
    pouleSortingTimer = setInterval(function sortPoules(){
        if(pouleExists(pouleA)){
            pouleA.updatePoints();

            if(pouleA.allGamesPlayed()){
                if(numPoules >= 3){
                    document.getElementById('M11Name').innerHTML = pouleA.winner;
                    document.getElementById('M22Name').innerHTML = pouleA.secondPlace;
                }else if(numPoules == 2){
                    document.getElementById('M51Name').innerHTML = pouleA.winner;
                    document.getElementById('M62Name').innerHTML = pouleA.secondPlace;
                }/*else if(numPoules == 1){
                    document.getElementById('M71Name').innerHTML = pouleA.winner;
                    document.getElementById('M72Name').innerHTML = pouleA.secondPlace;
                }*/
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
                
                finalsMsg.push(finalsGameToApp(1, "quart"));
                finalsMsg.push(finalsGameToApp(2, "quart"));
                finalsMsg.push(finalsGameToApp(3, "quart"));
                finalsMsg.push(finalsGameToApp(4, "quart"));
                finalsMsg.push(finalsGameToApp(5, "half"));
                finalsMsg.push(finalsGameToApp(6, "half"));
                finalsMsg.push(finalsGameToApp(7, "final"));
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
                    //getFinalsWinner("M71", "M72", "M81");
                    document.getElementById(`M81Name`).innerHTML = pouleA.winner;

                    finalsMsg.push(finalsGameToApp(7, 'final'));
                }
            break;
        }
        io.emit('finalsInfo', finalsMsg);
    }, 500);
    quickSaveTimer = setInterval(function quickSaveGame(){
        exportGameInfo(false, true);
    }, 300000);
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

function exportGameInfo(writeToFile = true, quickSave = false){
    var gameFileName;
    if(writeToFile && !quickSave){
        gameFileName = getGameFileName("save");

        if(gameFileName === null){
            return -1;
        }

        if(!gameFileName.includes(".darts")){
            gameFileName = gameFileName + ".darts"
        }
    }

    if(quickSave){
        let today = new Date();
        let docPath = ipcRenderer.sendSync('getDocPath');
        fs.access(path.join(docPath, 'darttoernooi'), (err) => {
            if(err){
                fs.mkdirSync(path.join(docPath, 'darttoernooi'), (err) => {
                    if(err){
                        console.log(`Error creating darttoernooi folder: ${err}`);
                    }
                });
                fs.mkdirSync(path.join(docPath, 'darttoernooi/quicksaves'), (err) =>{
                    if(err){
                        console.log(`Error creating quicksaves folder: ${err}`);
                    }
                });
            }else{
                fs.access(path.join(docPath, 'darttoernooi/quicksaves'), (err) =>{
                    if(err){
                        fs.mkdirSync(path.join(docPath, 'darttoernooi/quicksaves'), (err) =>{
                            if(err){
                                console.log(`Error creating quicksaves folder: ${err}`);
                            }
                        });
                    }
                });
            }
        });
        fs.readdir(path.join(docPath, 'darttoernooi/quicksaves'), (err, files) => {
            if(err){
                console.log(`Error reading quicksaves folder: ${err}`);
            }else{
                if(files.length){
                    for(let i = 0; i < files.length; i++){
                        if(files[i].includes('.darts')){
                            fs.unlink(path.join(docPath, 'darttoernooi/quicksaves', files[i]), (err) => {
                                if(err){
                                    console.log(`Error deleting quicksave: ${err}`);
                                }
                            });
                        }
                    }
                }
            }
        });
        gameFileName = path.join(docPath, 'darttoernooi/quicksaves', `${today.getDay()}-${today.getMonth()}-${today.getFullYear()}_${today.getHours()}-${today.getMinutes()}-${today.getSeconds()}.darts`);
    }

    var jsonObj = {
        "version": null,
        "numPoules": 0,
        "poules":{
            'pouleA': {},
            'pouleB': {},
            'pouleC': {},
            'pouleD': {}
        }, 
        "games": [], 
        "appSettings": {
            'pouleScore': 0,
            'pouleLegs': 0,
            'quartScore': 0,
            'quartLegs': 0,
            'halfScore': 0,
            'halfLegs': 0,
            'finalScore': 0,
            'finalLegs': 0
        }
    };

    jsonObj.version = version;
    jsonObj.numPoules = numPoules;

    for(let pouleNum = 0; pouleNum < 4; pouleNum++){
        let pouleName;
        let poule;
        switch(pouleNum){
            case 0:
                pouleName = 'pouleA';
                poule = pouleA;
            break;
            case 1:
                pouleName = 'pouleB';
                poule = pouleB;
            break;
            case 2:
                pouleName = 'pouleC';
                poule = pouleC;
            break;
            case 3:
                pouleName = 'pouleD';
                poule = pouleD;
            break;
        }

        if(!pouleExists(poule)){
            continue;
        }

        let pouleDict = {
            'numPlayers': 0,
            'players': [],
            'games': []
        }

        //Extract the player information from the poule and write to the dict
        pouleDict.numPlayers = poule.players.length;
        for(let i = 0; i < poule.players.length; i++){
            let playerDict = {
                'name': '',
                'points': 0,
                'counterPoints': 0
            }

            let player = poule.players[i].name;
            let points = parseInt(poule.players[i].legsWon);
            let counterPoints = parseInt(poule.players[i].legsLost);

            if(isNaN(points)){
                points = 0;
            }

            if(isNaN(counterPoints)){
                counterPoints = 0;
            }

            playerDict.name = player;
            playerDict.points = points;
            playerDict.counterPoints = counterPoints;

            pouleDict.players.push(playerDict);
        }

        //Extract the game details and write to dict
        for(let i = 0; i < poule.numGames; i++){
            let gameDict = {
                'player1': '',
                'score1': null,
                'player2': '',
                'score2': null
            }

            const pouleLetter = pouleName[5]
            var player1 = document.getElementById(`game${pouleLetter}${i+1}1Name`).innerHTML;
            var score1 = document.getElementById(`game${pouleLetter}${i+1}1Score`).value;
            var player2 = document.getElementById(`game${pouleLetter}${i+1}2Name`).innerHTML;
            var score2 = document.getElementById(`game${pouleLetter}${i+1}2Score`).value;

            score1 = parseInt(score1);
            score2 = parseInt(score2);

            gameDict.player1 = player1;
            gameDict.score1 = score1;
            gameDict.player2 = player2;
            gameDict.score2 =  score2;

        
            pouleDict.games.push(gameDict);
        }

        jsonObj.poules[pouleName] = pouleDict;
    }


    let games = [];

    for(let i = 0; i < finalsGames.length; i++){
        let game = exportFinalsGame(finalsGames[i][1]);

        let gameDict = {
            'player1': '',
            'score1': null,
            'player2': '',
            'score2': null
        }

        gameDict.player1 = game[1];
        gameDict.score1 = game[0];
        gameDict.player2 = game[3];
        gameDict.score2 = game[2];

        games.push(gameDict);
    }

    jsonObj.games = games;

    for(let key in appSettings){
        jsonObj.appSettings[key] = appSettings[key]
    }

    if(writeToFile || quickSave){
        fs.writeFile(path.resolve(gameFileName), JSON.stringify(jsonObj, null, 4), function(err){
            if(err){
                console.log(err);
            }
        });
    }

    return jsonObj;
}

function openNav(){
    if(screenState == "gameScreen"){
        screenState = "sideNavOpen";
    }
    for(key in appSettings){
        document.getElementById(`${key}Input`).value = appSettings[key];
    }

    document.getElementById("sideNav").style.right = "0px";
}

function closeNav(){
    if(screenState == "sideNavOpen"){
        screenState = "gameScreen";
    }
    document.getElementById("sideNav").style.right = "-350px";
    updateSettings();
}

function handle(e){
    key = e.keyCode || e.which;
    if(key == 13){
        e.preventDefault();
        switch(screenState){
            case "setupScreen":
                getGameInfo();
            break;
            case "playersInput":
                makePoules();
            break;
            case "sideNavOpen":
                updateSettings();
            break;
        }
    }
}

function updateSettings(){
    for(let i=0; i<Object.keys(appSettings).length; i++){
        appSettings[appOptions[i]] = document.getElementById(`${appOptions[i]}Input`).value;
    }
    io.emit("settingsUpdate", JSON.stringify(appSettings));

    if(pouleExists(pouleA)){
        for(let i = 0; i < pouleA.players.length; i++){
            pouleA.players[i].name = document.getElementById(`playerA${i}Input`).value;
        }
        pouleA.reloadPlayers();
    }

    if(pouleExists(pouleB)){
        for(let i = 0; i < pouleB.players.length; i++){
            pouleB.players[i].name = document.getElementById(`playerB${i}Input`).value;
        }
        pouleB.reloadPlayers();
    }

    if(pouleExists(pouleC)){
        for(let i = 0; i < pouleC.players.length; i++){
            pouleC.players[i].name = document.getElementById(`playerC${i}Input`).value;
        }
        pouleC.reloadPlayers();
    }

    if(pouleExists(pouleD)){
        for(let i = 0; i < pouleD.players.length; i++){
            pouleD.players[i].name = document.getElementById(`playerD${i}Input`).value;
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

function showGameOptions(){
    if(document.getElementById("gameOptionsArrow").style.transform == "rotate(0deg)"){
        document.getElementById("gameOptionsArrow").style.transform = "rotate(180deg)";
        $("#gameOptionsDiv").slideDown(300);
    }else{
        document.getElementById("gameOptionsArrow").style.transform = "rotate(0deg)";
        $("#gameOptionsDiv").slideUp(300);
    }
}

function stopGame(gameID){
    gameID = gameID.replace('stop', '');

    for(let i = 0; i < activeGames.length; i++){
        if(activeGames[i][0] == gameID){
            activeGames.splice(i, 1);
        }
        $(document.getElementById(gameID)).remove();
        $(document.getElementById(`stop${gameID}`)).remove();
        $(document.getElementById(`${gameID}VL`)).remove();

        if(activeGames.length == 0){
            $(document.getElementById('activeGamesDiv')).hide();
        }
    }
    ipcRenderer.send("sendStopActiveGame", gameID);
}

function openNewWindow(){
    let result = ipcRenderer.sendSync("openActiveGamesWindow");
    activeGamesWindowOpen = result;
    if(activeGamesWindowOpen){
        if(activeGames.length > 0){
            var activeGameData = [];
            for(let i = 0; i < activeGames.length; i++){
                var gameDataTempArray = [];
                let gameID = activeGames[i][0];

                gameDataTempArray.push(gameID);
                gameDataTempArray.push(document.getElementById(`activeScore${gameID}1`).innerHTML);
                gameDataTempArray.push(document.getElementById(`activeLeg${gameID}1`).innerHTML);
                gameDataTempArray.push(document.getElementById(`activeScore${gameID}2`).innerHTML);
                gameDataTempArray.push(document.getElementById(`activeLeg${gameID}2`).innerHTML);

                var startingPlayer;
                if(document.getElementById(`activePlayer${gameID}1`).style.color == 'green'){
                    startingPlayer = '0';
                }else{
                    startingPlayer = '1';
                }
                gameDataTempArray.push(startingPlayer);

                var player1Turn;
                if(document.getElementById(`${gameID}TurnArrow`).style.transform == 'rotate(90deg)'){
                    player1Turn = 'true';
                }else{
                    player1Turn = 'false';
                }
                gameDataTempArray.push(player1Turn);

                gameDataTempArray.push(document.getElementById(`activeDarts${gameID}1`).innerHTML);
                gameDataTempArray.push(document.getElementById(`activeDarts${gameID}2`).innerHTML);

                if(gameDataTempArray[1] <= 170 && gameDataTempArray[1] > 0){
                    gameDataTempArray.push(outs[170-gameDataTempArray[1]]);
                }else{
                    gameDataTempArray.push('');
                }
        
                if(gameDataTempArray[3] <= 170 && gameDataTempArray[3] > 0){
                    gameDataTempArray.push(outs[170-gameDataTempArray[3]]);
                }else{
                    gameDataTempArray.push('');
                }

                var player1;
                var player2;

                if(gameID[0] == 'M'){
                    player1 = document.getElementById(`${gameID}1Name`).innerHTML;
                    player2 = document.getElementById(`${gameID}2Name`).innerHTML;
                }else{
                    player1 = document.getElementById(`game${gameID}1Name`).innerHTML;
                    player2 = document.getElementById(`game${gameID}2Name`).innerHTML;
                }

                gameDataTempArray.push(player1);
                gameDataTempArray.push(player2);

                activeGameData.push(gameDataTempArray);
            }

            ipcRenderer.send("sendAlreadyActiveGames", activeGameData);
        }
        
        var poulesData = [];
        if(pouleExists(pouleA)){
            poulesData.push(pouleA.rankings);
        }
        if(pouleExists(pouleB)){
            poulesData.push(pouleB.rankings);
        }
        if(pouleExists(pouleC)){
            poulesData.push(pouleC.rankings);
        }
        if(pouleExists(pouleD)){
            poulesData.push(pouleD.rankings);
        }
        ipcRenderer.send('returnPouleData', poulesData);
    }
}

function connectServer(){
    ipcRenderer.send('connectServer');
}

function toggleAudio(){
    console.log("Changing audio");
    if(audioEnabled){
        document.getElementById('audioCntrl').innerHTML = "volume_off";
        audioEnabled = false;
    }else{
        document.getElementById('audioCntrl').innerHTML = "volume_up";
        audioEnabled = true;
    }
}