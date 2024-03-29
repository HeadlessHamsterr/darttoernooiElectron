const { ipcRenderer } = require('electron');
let $ = require('jquery');

var numActiveGames = 0;

ipcRenderer.on("activeGameInfo", (event, arg) => {
    updateGames(arg, 0);
});

ipcRenderer.on("newActiveGameInfo", (event, arg) => {
    updateGames(arg, 1);
});

ipcRenderer.on("alreadyActiveGames", (event, arg) => {
    initiateActiveGames(arg);
});

ipcRenderer.on("stopActiveGame", (event, arg) => {
    updateGames(arg, 2);
});

ipcRenderer.on('pouleData', (event, arg) => {
    makePoules(arg);
});

ipcRenderer.on('pouleDataUpdate', (event, arg) =>{
    updatePoules(arg);
});

/*infoType is het de reden van function call
0 = normale update van actieve game
1 = nieuwe game
2 = game verwijderen
*/
function updateGames(data, infoType){
    console.log(data);
    let containerSetup = 'display: grid; grid-template-columns:';
    switch(infoType){
        case 0:
            document.getElementById(`activeLeg${data[0].gameID}1`).innerHTML = data[0].player1LegsWon;
            document.getElementById(`activeLeg${data[0].gameID}2`).innerHTML = data[0].player2LegsWon;
            document.getElementById(`activeScore${data[0].gameID}1`).innerHTML = data[0].player1Score;
            document.getElementById(`activeScore${data[0].gameID}2`).innerHTML = data[0].player2Score;
            document.getElementById(`activeDarts${data[0].gameID}1`).innerHTML = data[0].player1DartsThrown;
            document.getElementById(`activeDarts${data[0].gameID}2`).innerHTML = data[0].player2DartsThrown;

            if(data[0].startingPlayer == '0'){
                document.getElementById(`activePlayer${data[0].gameID}1`).style.color = 'green';
                document.getElementById(`activePlayer${data[0].gameID}2`).style.color = 'white';
            }else{
                document.getElementById(`activePlayer${data[0].gameID}1`).style.color = 'white';
                document.getElementById(`activePlayer${data[0].gameID}2`).style.color = 'green';
            }
        
            if(data[0].player1Turn == 'true'){
                document.getElementById(`${data[0].gameID}TurnArrow`).style.transform = 'rotate(90deg)';
            }else{
                document.getElementById(`${data[0].gameID}TurnArrow`).style.transform = 'rotate(270deg)';
            }
        
            if(data[0].player1Score <= 170 && data[0].player1Score > 0){
                document.getElementById(`out${data[0].gameID}1`).innerHTML = data[1];
            }else{
                document.getElementById(`out${data[0].gameID}1`).innerHTML = '';
            }
        
            if(data[0].player2Score <= 170 && data[0].player2Score > 0){
                document.getElementById(`out${data[0].gameID}2`).innerHTML = data[2];
            }else{
                document.getElementById(`out${data[0].gameID}2`).innerHTML = '';
            }
        break;
        case 1:
            numActiveGames += 1;

            if(numActiveGames > 4){
                containerSetup += ' auto auto auto auto;'
            }else{
                for(let i = 0; i < numActiveGames; i++){
                    containerSetup += ' auto'
                }
                containerSetup += ';'
            }
            $('#activeTablesDiv1').attr('style', containerSetup);

            let div = document.getElementById('activeTablesDiv1');
            $(document.getElementById('noActiveGames')).remove();
            $(div).append(`<table id="${data[0].gameID}" class="activeGameTable"><tr><td id="activePlayer${data[0].gameID}1">${data[3]}</td><td><i id="${data[0].gameID}TurnArrow" class="material-icons turnArrow">expand_more</i></td><td id="activePlayer${data[0].gameID}2">${data[4]}</td></tr><tr><td id="activeDarts${data[0].gameID}1"></td><td>Darts</td><td id="activeDarts${data[0].gameID}2"></td></tr><tr><td id="activeLeg${data[0].gameID}1">${data[0].player1LegsWon}</td><td>Legs</td><td id="activeLeg${data[0].gameID}2">${data[0].player2LegsWon}</td></tr><tr><td id="activeScore${data[0].gameID}1">${data[0].player1Score}</td><td></td><td id="activeScore${data[0].gameID}2">${data[0].player2Score}</td></tr><tr><td id="out${data[0].gameID}1"></td><td></td><td id="out${data[0].gameID}2"></td></tr></table>`)
        
            document.getElementById(`activeLeg${data[0].gameID}1`).innerHTML = data[0].player1LegsWon;
            document.getElementById(`activeLeg${data[0].gameID}2`).innerHTML = data[0].player2LegsWon;
            document.getElementById(`activeScore${data[0].gameID}1`).innerHTML = data[0].player1Score;
            document.getElementById(`activeScore${data[0].gameID}2`).innerHTML = data[0].player2Score;
            document.getElementById(`activeDarts${data[0].gameID}1`).innerHTML = data[0].player1DartsThrown;
            document.getElementById(`activeDarts${data[0].gameID}2`).innerHTML = data[0].player2DartsThrown;
        
            if(data[0].startingPlayer == '0'){
                document.getElementById(`activePlayer${data[0].gameID}1`).style.color = 'green';
                document.getElementById(`activePlayer${data[0].gameID}2`).style.color = 'white';
            }else{
                document.getElementById(`activePlayer${data[0].gameID}1`).style.color = 'white';
                document.getElementById(`activePlayer${data[0].gameID}2`).style.color = 'green';
            }
        
            if(data[0].player1Turn == 'true'){
                document.getElementById(`${data[0].gameID}TurnArrow`).style.transform = 'rotate(90deg)';
            }else{
                document.getElementById(`${data[0].gameID}TurnArrow`).style.transform = 'rotate(270deg)';
            }
        
            if(data[0].player1Score <= 170 && data[0].player1Score > 0){
                document.getElementById(`out${data[0].gameID}1`).innerHTML = data[1];
                console.log(data[1])
            }else{
                document.getElementById(`out${data[0].gameID}1`).innerHTML = '';
            }
        
            if(data[0].player2Score <= 170 && data[0].player2Score> 0){
                document.getElementById(`out${data[0].gameID}2`).innerHTML = data[2];
                console.log(data[2])
            }else{
                document.getElementById(`out${data[0].gameID}2`).innerHTML = '';
            }
        break;
        case 2:
            numActiveGames -= 1;

            if(numActiveGames > 4){
                containerSetup += ' auto auto auto auto;'
            }else{
                for(let i = 0; i < numActiveGames; i++){
                    containerSetup += ' auto'
                }
                containerSetup += ';'
            }
            $('#activeTablesDiv1').attr('style', containerSetup);

            console.log(`Game ${data} stopped`);

            $(document.getElementById(data)).remove();

            if(numActiveGames == 0){
                $(document.getElementById('activeTablesDiv1')).append('<h1 id="noActiveGames">Geen wedstrijden bezig</h1>');
                console.log('No active games');
            }
        break;
    }
}

function initiateActiveGames(data){
    let div = document.getElementById('activeTablesDiv1');
    numActiveGames = data[0].length;
    console.log(data);
    $(div).empty();

    let containerSetup = 'display: grid; grid-template-columns:';

    if(numActiveGames > 4){
        containerSetup += ' auto auto auto auto;'
    }else{
        for(let i = 0; i < numActiveGames; i++){
            containerSetup += ' auto'
        }
        containerSetup += ';'
    }
    $('#activeTablesDiv1').attr('style', containerSetup);

    for(let i = 0; i < data.length; i++){
        $(div).append(`<table id="${data[i][0]}" class="activeGameTable"><tr><td id="activePlayer${data[i][0]}1">${data[i][11]}</td><td><i id="${data[i][0]}TurnArrow" class="material-icons turnArrow">expand_more</i></td><td id="activePlayer${data[i][0]}2">${data[i][12]}</td></tr><tr><td id="activeDarts${data[i][0]}1"></td><td>Darts</td><td id="activeDarts${data[i][0]}2"></td></tr><tr><td id="activeLeg${data[i][0]}1">${data[i][2]}</td><td>Legs</td><td id="activeLeg${data[i][0]}2">${data[i][4]}</td></tr><tr><td id="activeScore${data[i][0]}1">${data[i][1]}</td><td></td><td id="activeScore${data[i][0]}2">${data[i][3]}</td></tr><tr><td id="out${data[i][0]}1"></td><td></td><td id="out${data[i][0]}2"></td></tr></table>`)

        document.getElementById(`activeLeg${data[i][0]}1`).innerHTML = data[i][2];
        document.getElementById(`activeLeg${data[i][0]}2`).innerHTML = data[i][4];
        document.getElementById(`activeScore${data[i][0]}1`).innerHTML = data[i][1];
        document.getElementById(`activeScore${data[i][0]}2`).innerHTML = data[i][3];
        document.getElementById(`activeDarts${data[i][0]}1`).innerHTML = data[i][7];
        document.getElementById(`activeDarts${data[i][0]}2`).innerHTML = data[i][8];

        if(data[i][6] == '0'){
            document.getElementById(`activePlayer${data[i][0]}1`).style.color = 'green';
            document.getElementById(`activePlayer${data[i][0]}2`).style.color = 'white';
        }else{
            document.getElementById(`activePlayer${data[i][0]}1`).style.color = 'white';
            document.getElementById(`activePlayer${data[i][0]}2`).style.color = 'green';
        }

        if(data[i][5] == 'true'){
            document.getElementById(`${data[i][0]}TurnArrow`).style.transform = 'rotate(90deg)';
        }else{
            document.getElementById(`${data[i][0]}TurnArrow`).style.transform = 'rotate(270deg)';
        }

        if(data[i][1] <= 170 && data[i][1] > 0){
            document.getElementById(`out${data[i][0]}1`).innerHTML = data[i][9];
        }else{
            document.getElementById(`out${data[i][0]}1`).innerHTML = '';
        }

        if(data[i][3] <= 170 && data[i][3] > 0){
            document.getElementById(`out${data[i][0]}2`).innerHTML = data[i][10];
        }else{
            document.getElementById(`out${data[i][0]}2`).innerHTML = '';
        }
    }
}

function makePoules(pouleData){
    console.log(pouleData);
    var poulesDiv = document.getElementById('centerPoulesDiv');

    for(let i = 0; i < pouleData[0].length; i++){
        var pouleNum;
        switch(i){
            case 0:
                pouleNum = 'A';
                break;
            case 1:
                pouleNum = 'B';
                break;
            case 2:
                pouleNum = 'C';
                break;
            case 3:
                pouleNum = 'D';
                break;
        }
        let pouleTableData = $(`<div id="poule${pouleNum}" class="pouleDiv"><header class="pouleHeader"><h2>Poule ${pouleNum}:</h2><hr><header></header></header><table class="pouleTable" id="poule${pouleNum}Table"><tr><th>Speler</th><th>Score</th></tr></table>`)
        $(poulesDiv).append(pouleTableData);
        let pouleTable = document.getElementById(`poule${pouleNum}Table`);
        for(let j = 0; j < pouleData[i].length; j++){
            $(pouleTable).append($(`<tr><td>${pouleData[i][j][0]}</td><td>${pouleData[i][j][1]}</td></tr>`));
        }
    }
}

function updatePoules(pouleData){
    console.log(pouleData);
    let pouleTable = document.getElementById(`poule${pouleData[0]}Table`);
    let pouleHeader = $('<tr><th>Speler</th><th>Score</th></tr>');

    $(pouleTable).empty();
    $(pouleTable).append(pouleHeader);

    for(let i in pouleData[1]){
        let playerName = pouleData[1][i][0];
        let playerScore = pouleData[1][i][1];
        console.log(`${playerName} | ${playerScore}`)
        let tableEntry = $(`<tr><td>${playerName}</td><td>${playerScore}</td></tr>`);
        $(pouleTable).append(tableEntry);
    }
}