let $ = require('jquery');

var numPlayers = 0;
var numPoules = 0;

const subBtn = document.getElementById('subBtn');
subBtn.onclick = getGameInfo;

const makePoulesBtn = document.getElementById('mkPoulesBtn');
makePoulesBtn.onclick = makePoules;

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

    var playerInputForm = document.getElementById('playerInputForm');

    for(let i = 0; i < numPlayers; i++){
        //var playerInput = $(`<input type='text' id='player${i}'></input>`).attr(`Speler ${i}`);
        var playerInput = document.createElement("input");
        playerInput.setAttribute("id", `player${i}`);
        playerInput.setAttribute("placeholder", `Speler ${i+1}`);
        playerInput.setAttribute("class", "playerInput");
        $(playerInputForm).append(playerInput);
    }
}

function makePoules(){
    console.log("Making poules");
    //$(document.getElementById('playerInputDiv')).hide();
    //$(document.getElementById('gameSetup')).hide();
    $("div").hide();

    var poulesDiv = document.getElementById('poulesDiv')
    $(poulesDiv).show();

    for(let i = 0; i < numPlayers; i++){
        var playerName = document.getElementById(`player${i}`).value;
        var playerText = $(`<p>${playerName}</p>`)

        var newLine = $("<br>");

        $(poulesDiv).append(playerText);
        $(poulesDiv).append(newLine);
    }
}