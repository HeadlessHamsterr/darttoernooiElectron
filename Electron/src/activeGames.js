let {ipcRenderer} = require('electron');
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

/*infoType is het de reden van function call
0 = normale update van actieve game
1 = nieuwe game
2 = game verwijderen
*/
function updateGames(data, infoType){
    console.log(data);
    switch(infoType){
        case 0:
            document.getElementById(`activeLeg${data[0]}1`).innerHTML = data[2];
            document.getElementById(`activeLeg${data[0]}2`).innerHTML = data[4];
            document.getElementById(`activeScore${data[0]}1`).innerHTML = data[1];
            document.getElementById(`activeScore${data[0]}2`).innerHTML = data[3];
            document.getElementById(`activeDarts${data[0]}1`).innerHTML = data[7];
            document.getElementById(`activeDarts${data[0]}2`).innerHTML = data[8];

            if(data[6] == '0'){
                document.getElementById(`activePlayer${data[0]}1`).style.color = 'green';
                document.getElementById(`activePlayer${data[0]}2`).style.color = 'white';
            }else{
                document.getElementById(`activePlayer${data[0]}1`).style.color = 'white';
                document.getElementById(`activePlayer${data[0]}2`).style.color = 'green';
            }
        
            if(data[5] == 'true'){
                document.getElementById(`${data[0]}TurnArrow`).style.transform = 'rotate(90deg)';
            }else{
                document.getElementById(`${data[0]}TurnArrow`).style.transform = 'rotate(270deg)';
            }
        
            if(data[1] <= 170 && data[1] > 0){
                document.getElementById(`out${data[0]}1`).innerHTML = data[9];
            }else{
                document.getElementById(`out${data[0]}1`).innerHTML = '';
            }
        
            if(data[3] <= 170 && data[3] > 0){
                document.getElementById(`out${data[0]}2`).innerHTML = data[10];
            }else{
                document.getElementById(`out${data[0]}2`).innerHTML = '';
            }
        break;
        case 1:
            numActiveGames += 1;
            let div = document.getElementById('activeTablesDiv1');
            $(document.getElementById('noActiveGames')).remove();
            $(div).append(`<table id="${data[0]}" class="activeGameTable"><tr><td id="activePlayer${data[0]}1">${data[11]}</td><td><i id="${data[0]}TurnArrow" class="material-icons turnArrow">expand_more</i></td><td id="activePlayer${data[0]}2">${data[12]}</td></tr><tr><td id="activeDarts${data[0]}1"></td><td>Darts</td><td id="activeDarts${data[0]}2"></td></tr><tr><td id="activeLeg${data[0]}1">${data[2]}</td><td>Legs</td><td id="activeLeg${data[0]}2">${data[4]}</td></tr><tr><td id="activeScore${data[0]}1">${data[1]}</td><td></td><td id="activeScore${data[0]}2">${data[3]}</td></tr><tr><td id="out${data[0]}1"></td><td></td><td id="out${data[0]}2"></td></tr></table>`)
        
            document.getElementById(`activeLeg${data[0]}1`).innerHTML = data[2];
            document.getElementById(`activeLeg${data[0]}2`).innerHTML = data[4];
            document.getElementById(`activeScore${data[0]}1`).innerHTML = data[1];
            document.getElementById(`activeScore${data[0]}2`).innerHTML = data[3];
            document.getElementById(`activeDarts${data[0]}1`).innerHTML = data[7];
            document.getElementById(`activeDarts${data[0]}2`).innerHTML = data[8];
        
            if(data[6] == '0'){
                document.getElementById(`activePlayer${data[0]}1`).style.color = 'green';
                document.getElementById(`activePlayer${data[0]}2`).style.color = 'white';
            }else{
                document.getElementById(`activePlayer${data[0]}1`).style.color = 'white';
                document.getElementById(`activePlayer${data[0]}2`).style.color = 'green';
            }
        
            if(data[5] == 'true'){
                document.getElementById(`${data[0]}TurnArrow`).style.transform = 'rotate(90deg)';
            }else{
                document.getElementById(`${data[0]}TurnArrow`).style.transform = 'rotate(270deg)';
            }
        
            if(data[1] <= 170 && data[1] > 0){
                document.getElementById(`out${data[0]}1`).innerHTML = data[9];
            }else{
                document.getElementById(`out${data[0]}1`).innerHTML = '';
            }
        
            if(data[3] <= 170 && data[3] > 0){
                document.getElementById(`out${data[0]}2`).innerHTML = data[10];
            }else{
                document.getElementById(`out${data[0]}2`).innerHTML = '';
            }
        break;
        case 2:
            numActiveGames -= 1;
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
    numActiveGames = data.length;

    for(let i = 0; i < data.length; i++){
        $(div).append(`<table id="${data[i][0+i]}" class="activeGameTable"><tr><td id="activePlayer${data[i][0+i]}1">${data[i][11+i]}</td><td><i id="${data[i][0+i]}TurnArrow" class="material-icons turnArrow">expand_more</i></td><td id="activePlayer${data[i][0+i]}2">${data[i][12+i]}</td></tr><tr><td id="activeDarts${data[i][0+i]}1"></td><td>Darts</td><td id="activeDarts${data[i][0+i]}2"></td></tr><tr><td id="activeLeg${data[i][0+i]}1">${data[i][2+i]}</td><td>Legs</td><td id="activeLeg${data[i][0+i]}2">${data[i][4+i]}</td></tr><tr><td id="activeScore${data[i][0+i]}1">${data[i][1+i]}</td><td></td><td id="activeScore${data[i][0+i]}2">${data[i][3+i]}</td></tr><tr><td id="out${data[i][0+i]}1"></td><td></td><td id="out${data[i][0+i]}2"></td></tr></table>`)

        document.getElementById(`activeLeg${data[i][0+i]}1`).innerHTML = data[i][2+i];
        document.getElementById(`activeLeg${data[i][0+i]}2`).innerHTML = data[i][4+i];
        document.getElementById(`activeScore${data[i][0+i]}1`).innerHTML = data[i][1+i];
        document.getElementById(`activeScore${data[i][0+i]}2`).innerHTML = data[i][3+i];
        document.getElementById(`activeDarts${data[i][0+i]}1`).innerHTML = data[i][7+i];
        document.getElementById(`activeDarts${data[i][0+i]}2`).innerHTML = data[i][8+i];

        if(data[i][6+i] == '0'){
            document.getElementById(`activePlayer${data[i][0+i]}1`).style.color = 'green';
            document.getElementById(`activePlayer${data[i][0+i]}2`).style.color = 'white';
        }else{
            document.getElementById(`activePlayer${data[i][0+i]}1`).style.color = 'white';
            document.getElementById(`activePlayer${data[i][0+i]}2`).style.color = 'green';
        }

        if(data[i][5+i] == 'true'){
            document.getElementById(`${data[i][0+i]}TurnArrow`).style.transform = 'rotate(90deg)';
        }else{
            document.getElementById(`${data[i][0+i]}TurnArrow`).style.transform = 'rotate(270deg)';
        }

        if(data[i][1+i] <= 170 && data[i][1+i] > 0){
            document.getElementById(`out${data[i][0+i]}1`).innerHTML = data[i][9+i];
        }else{
            document.getElementById(`out${data[i][0+i]}1`).innerHTML = '';
        }

        if(data[i][3+i] <= 170 && data[i][3+i] > 0){
            document.getElementById(`out${data[i][0+i]}2`).innerHTML = data[i][10+i];
        }else{
            document.getElementById(`out${data[i][0+i]}2`).innerHTML = '';
        }
    }
}

function makePoules(pouleData){
    console.log(pouleData);
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