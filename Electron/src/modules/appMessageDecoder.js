function activeGameInfo(){
    this.gameType;
    this.gameID;
    this.player1Turn;
    this.startingPlayer;

    this.player1Score;
    this.player1LegsWon;
    this.player1DartsThrown;

    this.player2Score;
    this.player2LegsWon;
    this.player2DartsThrown;

    this.thrownScore;
}

function gamePlayed(){
    this.gameID;
    this.gameType;

    this.player1LegsWon;
    this.player1Average;
    this.player1DartsThrown;
    
    this.player2LegsWon;
    this.player2Average;
    this.player2DartsThrown;
}

module.exports = function decodeAppMessage(messageType = "", message = []){
    if(messageType == "" || message.length == 0){
        console.error("App message decode error: no message type or no message passed to decoder.")
        return -1;
    }

    //Convert the incoming message to an array
    let array = message.split(',');

    let _appMessage;
    //Determine what type of message is received, this determines the available data
    switch(messageType){
        case "activeGameInfo":
            _appMessage = new activeGameInfo();

            //Get the game info
            _appMessage.gameID = array[0];
            _appMessage.player1Turn = array[7];
            _appMessage.startingPlayer = array[8];
            _appMessage.thrownScore = array[9];

            //Get the info for player 1
            _appMessage.player1Score = array[1];
            _appMessage.player1LegsWon = array[2];
            _appMessage.player1DartsThrown = array[3];

            //Get the info for player 2
            _appMessage.player2Score = array[4];
            _appMessage.player2LegsWon = array[5];
            _appMessage.player2DartsThrown = array[6];

            //All the final games (quarters, semi, final) start with M for easy filtering
            if(_appMessage.gameID[0] == 'M'){
                _appMessage.gameType = 'finals_game';
            }else{
                _appMessage.gameType = 'poule_game';
            }

            return _appMessage;
        break;
        case "gamePlayed":
            _appMessage = new gamePlayed();
            
            //Get the game info
            _appMessage.gameID = array[0];

            //Get the info for player 1
            _appMessage.player1LegsWon = array[1];
            _appMessage.player1Average = array[2];
            _appMessage.player1DartsThrown = array[3];

            //Get the info for player 2
            _appMessage.player2LegsWon = array[4];
            _appMessage.player2Average = array[5];
            _appMessage.player2DartsThrown = array[6];

            //All the final games (quarters, semi, final) start with M for easy filtering
            const gameIDName = _appMessage.gameID[0]
            console.log(gameIDName)
            console.log(_appMessage.gameType)
            if(gameIDName == "M"){
                _appMessage.gameType = 'finals_game';
            }else{
                _appMessage.gameType = 'poule_game';
            }
            
            return _appMessage;
        break;
    }
}