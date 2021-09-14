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
            pouleA.push(tempArray);
        }else if(PLAYERS_PER_POULE <= i && i < (2*PLAYERS_PER_POULE)){
            var tempArray = [players[i], i];
            pouleB.push(tempArray)
        }else if((2*PLAYERS_PER_POULE) <= i && i < (3*PLAYERS_PER_POULE)){
            var tempArray = [players[i], i];
            pouleC.push(tempArray)
        }else if((3*PLAYERS_PER_POULE) <= i && i < (4*PLAYERS_PER_POULE)){
            var tempArray = [players[i], i];
            pouleD.push(tempArray)
        }
    }

    console.log(pouleA);
    console.log(pouleB);
    console.log(pouleC);
    console.log(pouleD);

    if(typeof pouleA !== 'undefined' && pouleA.length > 0){
        var playerDiv = $('<div id="pouleA" class="pouleDiv"></div>');
        var pouleHeader = $('<header class="pouleHeader"><h2>Poule A:</h2><hr/></header>');
        var pouleTable = $('<table class="pouleTable" id="pouleATable"></table>');

        $(poulesDiv).append(playerDiv);
        $(playerDiv).append(pouleHeader);
        $(playerDiv).append(pouleTable);

        for(let i in pouleA){
            var tableEntry = $(`<tr><td>${pouleA[i][0]}</td><td>${pouleA[i][1]}</td></tr>`);
            $(pouleTable).append(tableEntry);
        }

        $(playerDiv).show();
    }

    if(typeof pouleB !== 'undefined' && pouleB.length > 0){
        var playerDiv = $('<div id="pouleB" class="pouleDiv"></div>');
        var pouleHeader = $('<header class="pouleHeader"><h2>Poule B:</h2><hr/></header>');
        var pouleTable = $('<table class="pouleTable" id="pouleBTable"></table>');

        $(poulesDiv).append(playerDiv);
        $(playerDiv).append(pouleHeader);
        $(playerDiv).append(pouleTable);

        for(let i in pouleB){
            var tableEntry = $(`<tr><td>${pouleB[i][0]}</td><td>${pouleB[i][1]}</td></tr>`);
            $(pouleTable).append(tableEntry);
        }

        $(playerDiv).show();
    }

    if(typeof pouleC !== 'undefined' && pouleC.length > 0){
        var playerDiv = $('<div id="pouleC" class="pouleDiv"></div>');
        var pouleHeader = $('<header class="pouleHeader"><h2>Poule C:</h2><hr/></header>');
        var pouleTable = $('<table class="pouleTable" id="pouleCTable"></table>');

        $(poulesDiv).append(playerDiv);
        $(playerDiv).append(pouleHeader);
        $(playerDiv).append(pouleTable);

        for(let i in pouleC){
            var tableEntry = $(`<tr><td>${pouleC[i][0]}</td><td>${pouleC[i][1]}</td></tr>`);
            $(pouleTable).append(tableEntry);
        }

        $(playerDiv).show();
    }

    if(typeof pouleD !== 'undefined' && pouleD.length > 0){
        var playerDiv = $('<div id="pouleD" class="pouleDiv"></div>');
        var pouleHeader = $('<header class="pouleHeader"><h2>Poule D:</h2><hr/></header>');
        var pouleTable = $('<table class="pouleTable" id="pouleDTable"></table>');

        $(poulesDiv).append(playerDiv);
        $(playerDiv).append(pouleHeader);
        $(playerDiv).append(pouleTable);

        for(let i in pouleD){
            var tableEntry = $(`<tr><td>${pouleD[i][0]}</td><td>${pouleD[i][1]}</td></tr>`);
            $(pouleTable).append(tableEntry);
        }

        $(playerDiv).show();
    }

    $(poulesDiv).append($('<button id="sortPoules">Sorteer</button>'));
    document.getElementById('sortPoules').onclick = sortPoules;
    $(poulesDiv).show();
}

function sortPoules(){
    console.log("Poules sorteren...");

    if(typeof pouleA !== 'undefined' && pouleA.length > 0){
        pouleA.sort(function(a,b){return b[1]-a[1]});
        console.log(pouleA);
        
        var pouleTable = document.getElementById('pouleATable');
        $(pouleTable).empty();

        for(let i in pouleA){
            var tableEntry = $(`<tr><td>${pouleA[i][0]}</td><td>${pouleA[i][1]}</td></tr>`);
            $(pouleTable).append(tableEntry);
        }
    }

    if(typeof pouleB !== 'undefined' && pouleB.length > 0){
        pouleB.sort(function(a,b){return b[1]-a[1]});
        console.log(pouleB);
        
        var pouleTable = document.getElementById('pouleBTable');
        $(pouleTable).empty();

        for(let i in pouleB){
            var tableEntry = $(`<tr><td>${pouleB[i][0]}</td><td>${pouleB[i][1]}</td></tr>`);
            $(pouleTable).append(tableEntry);
        }
    }

    if(typeof pouleC !== 'undefined' && pouleC.length > 0){
        pouleC.sort(function(a,b){return b[1]-a[1]});
        console.log(pouleC);
        
        var pouleTable = document.getElementById('pouleCTable');
        $(pouleTable).empty();

        for(let i in pouleC){
            var tableEntry = $(`<tr><td>${pouleC[i][0]}</td><td>${pouleC[i][1]}</td></tr>`);
            $(pouleTable).append(tableEntry);
        }
    }

    if(typeof pouleD !== 'undefined' && pouleD.length > 0){
        pouleD.sort(function(a,b){return b[1]-a[1]});
        console.log(pouleD);
        
        var pouleTable = document.getElementById('pouleDTable');
        $(pouleTable).empty();

        for(let i in pouleD){
            var tableEntry = $(`<tr><td>${pouleD[i][0]}</td><td>${pouleD[i][1]}</td></tr>`);
            $(pouleTable).append(tableEntry);
        }
    }
}