let $ = require('jquery');

var numPlayers = 0;
var numPoules = 0;

const subBtn = document.getElementById('subBtn');
subBtn.onclick = getGameInfo;

function getGameInfo(){
    numPlayers = document.getElementById("numPlayers").value;
    numPoules = document.getElementById('numPoules').value;

    console.log(numPlayers);
    console.log(numPoules);

    $(document.getElementById('gameSetup')).hide();
    var playerInputDiv = $('<div id="playerInputDiv" class="card"></div>');
    var playerInputForm = $('<form id="playerInputForm"></form>');

    $("body").append(playerInputDiv)
    $(document.getElementById('playerInputDiv')).append(playerInputForm);

    for(let i = 0; i < numPlayers; i++){
        //var playerInput = $(`<input type='text' id='player${i}'></input>`).attr(`Speler ${i}`);
        var playerInput = document.createElement("input");
        playerInput.setAttribute("id", `player${i}`);
        playerInput.setAttribute("placeholder", `Speler ${i+1}`);
        playerInput.setAttribute("class", "playerInput");
        $(document.getElementById('playerInputForm')).append(playerInput);
    }
}