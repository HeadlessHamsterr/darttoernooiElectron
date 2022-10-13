module.exports = class pouleGames{
    constructor(pouleNum){
        this.pouleNum = pouleNum;
        this.players = [];
        this.hiddenPoints = [];
        this.tiedPlayers = [];
        this.winner = "";
        this.secondPlace = "";
        this.numGames;
        this.tieDetected = false;
        this.tieResolved = false;
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
        this.hiddenPoints = [];
        this.tiedPlayers = [];
        this.rankings = [];
        this.lastRankings = [];
        this.winner = "";
        this.secondPlace = "";
        this.numGames;
        this.tieDetected = false;
        this.tieResolved = false;
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
            $(pouleTable).append(pouleTableHeader);false
        }
    }

    makeGames(){
        let numPlayers = this.players.length;
        var gameTable;
        var gamesDiv;

        if(numPlayers == 1){
            let singlePlayerDiv = $(`<div id="singlePlayerDiv" class="singlePlayerDiv"><h3>Winnaar:</h3><h4>${this.players[0].name}!</h4><p1>Leuk geprobeerd, hier heb ik aan gedacht</p1></div>`);
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
            var gameLabels = $(`<tr><td><p1 id="game${this.pouleNum}${i+1}1Name">${this.players[this.gameFormat[i][0]].name}</p1></td><td><p1>-</p1></td><td><p1 id="game${this.pouleNum}${i+1}2Name">${this.players[this.gameFormat[i][1]].name}</p1></td></tr>`);
            var gameInputs = $(`<tr><td><input id="game${this.pouleNum}${i+1}1Score" type="number" class="gameScore" min="0"></td><td><p1>-</p1></td><td><input id="game${this.pouleNum}${i+1}2Score" type="number" class="gameScore" min="0"></td></tr><hr>`);
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
        for(let i = 0; i < this.players.length; i++){
            if(this.players[i].gamesPlayed != 0){
                let tempArray = [this.players[i].name, this.players[i].legsWon, this.players[i].hiddenPoints];
                this.rankings.push(tempArray);
            }
        }
        this.rankings.sort(function(a,b){
            if(b[1] != a[1]){
                return(b[1]-a[1]);
            }else{
                return(b[2]-a[2]);
            }
        });
        for(let i = 0; i < this.players.length; i++){
            if(this.players[i].gamesPlayed == 0){
                let tempArray = [this.players[i].name, this.players[i].legsWon, this.players[i].hiddenPoints];
                this.rankings.push(tempArray);
            }
        }

        var pouleTable = document.getElementById(`poule${this.pouleNum}Table`);
        var pouleTableHeader = $('<tr><th>Speler</th><th>Score</th><th>Saldo</th></tr>');

        $(pouleTable).empty();
        $(pouleTable).append(pouleTableHeader);

        for(let i in this.rankings){
            if(typeof this.rankings[i][1] == 'undefined'){
                this.rankings[i][1] = 0;
            }

            var tableEntry = $(`<tr><td>${this.rankings[i][0]}</td><td>${this.rankings[i][1]}</td><td>${this.rankings[i][2]}</td></tr>`);
            $(pouleTable).append(tableEntry);
        }

        if(JSON.stringify(this.rankings) != JSON.stringify(this.lastRankings)){
            this.lastRankings = JSON.parse(JSON.stringify(this.rankings));
            let msg = [this.rankings, this.sendPouleGames(), 'poule'];
            io.emit(`poule${this.pouleNum}Ranks`, msg);

            if(activeGamesWindowOpen){
                let msg = [this.pouleNum, this.rankings];
                ipcRenderer.send("updatePouleRanks", msg);
            }
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
                if(activeGames[j][0] == `${this.pouleNum}${i+1}`){
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
        if(this.tieDetected){
            let player1 = document.getElementById(`game${this.pouleNum}${this.numGames+1}1Name`).innerHTML;
            let player2 = document.getElementById(`game${this.pouleNum}${this.numGames+1}2Name`).innerHTML;
            let score1 = document.getElementById(`game${this.pouleNum}${this.numGames+1}1Score`).value;
            let score2 = document.getElementById(`game${this.pouleNum}${this.numGames+1}2Score`).value;

            var gamePlayed = true;
            var gameActive = false;

            for(let j=0; j < activeGames.length; j++){
                if(activeGames[j][0] == `${this.pouleNum}${this.numGames+1}`){
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
        var counterPoints = [];
        var numGamesPlayed = [];
        for(let i = 0; i < this.players.length; i++){
            points.push(0);
            counterPoints.push(0);
            numGamesPlayed.push(0);
            this.hiddenPoints.push(0);
        }

        for(let i = 0; i < this.numGames; i++){
            var points1 = document.getElementById(`game${this.pouleNum}${i+1}1Score`).value;
            var points2 = document.getElementById(`game${this.pouleNum}${i+1}2Score`).value;

            points1 = parseInt(points1);
            points2 = parseInt(points2);

            if(isNaN(points1)){
                points1 = 0;
            }else{
                numGamesPlayed[this.gameFormat[i][0]] += 1;
            }

            if(isNaN(points2)){
                points2 = 0;
            }else{
                numGamesPlayed[this.gameFormat[i][1]] += 1;
            }

            points[this.gameFormat[i][0]] = points[this.gameFormat[i][0]] + points1;
            counterPoints[this.gameFormat[i][0]] = counterPoints[this.gameFormat[i][0]] + points2;
            points[this.gameFormat[i][1]] = points[this.gameFormat[i][1]] + points2;
            counterPoints[this.gameFormat[i][1]] = counterPoints[this.gameFormat[i][1]] + points1;
        }

        try{
            var points1 = document.getElementById(`game${this.pouleNum}${this.numGames+1}1Score`).value;
            var points2 = document.getElementById(`game${this.pouleNum}${this.numGames+1}2Score`).value;

            points1 = parseInt(points1);
            points2 = parseInt(points2);

            if(isNaN(points1)){
                points1 = 0;
            }

            if(isNaN(points2)){
                points2 = 0;
            }

            for(let i = 0; i < this.players.length; i++){
                if(this.players[i].name == this.tiedPlayers[0]){
                    points[i] += points1;
                }else if(this.players[i].name == this.tiedPlayers[1]){
                    points[i] += points2;
                }
            }
        }catch(e){
        }

        for(let i = 0; i < this.players.length; i++){
            this.players[i].legsWon = points[i];
            this.players[i].legsLost = counterPoints[i];
            this.players[i].gamesPlayed = numGamesPlayed[i];
            this.players[i].calculateHiddenPoints();
        }  

        this.sort();

        if(this.allGamesPlayed() && !this.tieDetected){
            if(!this.tieResolved){
                this.checkTies();
            }
            if(this.tieDetected){
                return -1;
            }else{
                try{
                    $(`#poule${this.pouleNum}Games`).remove(".tieBreaker");
                    $(`poule${this.pouleNum}TiedGames`).remove();
                }catch(e){
                    console.error(e);
                }
            }
            if(numPoules == 1 && this.tieResolved){
                var points1 = document.getElementById('M71Score').value;
                var points2 = document.getElementById('M72Score').value;
                points1 = parseInt(points1);
                points2 = parseInt(points2);

                if(isNaN(points1)){
                    points1 = 0;
                }

                if(isNaN(points2)){
                    points2 = 0;
                }

                if(points1 > points2){
                    this.winner = document.getElementById('M71Name').innerHTML;
                    this.secondPlace = document.getElementById('M72Name').innerHTML;
                }else if(points2 > points1){
                    this.winner = document.getElementById('M72Name').innerHTML;
                    this.secondPlace = document.getElementById('M71Name').innerHTML;
                }
                document.getElementById("M81Name").innerHTML = this.winner;
            }else{
                this.winner = this.rankings[0][0];
                this.secondPlace = this.rankings[1][0];
                this.winnerPrinted = true;
            }
        }else if(!this.allGamesPlayed()){
            this.tieDetected = false;
            this.winner = "";
            this.secondPlace = "";
            this.winnerPrinted = false;
        }
    }

    checkTies(){
        let newTiedPlayers = this.isTie();
        if(!this.tieDetected && newTiedPlayers.length != 0 && this.newTieDetected(newTiedPlayers, this.tiedPlayers)){
            this.tieDetected = true;
            this.tiedPlayers = newTiedPlayers;
            if(numPoules == 1){
                makeFinals(0);
                $("#winnerTable").insertAfter("#finalsTable");
                document.getElementById('M71Name').innerHTML = this.tiedPlayers[0];
                document.getElementById('M72Name').innerHTML = this.tiedPlayers[1];
            }else{
                this.drawTiedPoules();
            }
        }
    }

    allGamesPlayed(){
        /*if(this.tieDetected && numPoules > 1){
            var tiedPoints1 = 0;
            var tiedPoints2 = 0;

            tiedPoints1 = document.getElementById(`tie${this.pouleNum}11Score`).value;
            tiedPoints2 = document.getElementById(`tie${this.pouleNum}12Score`).value;
            tiedPoints1 = parseInt(tiedPoints1);
            tiedPoints2 = parseInt(tiedPoints2);

            if(isNaN(tiedPoints1) || isNaN(tiedPoints2)){
                return false;
            }
        }*/

        for(let i = 0; i < this.numGames; i++){
            var points1 = document.getElementById(`game${this.pouleNum}${i+1}1Score`).value;
            var points2 = document.getElementById(`game${this.pouleNum}${i+1}2Score`).value;
            
            points1 = parseInt(points1);
            points2 = parseInt(points2);
            
            if(isNaN(points1) || isNaN(points2)){
                return false;
            }
        }

        if(numPoules == 1){
            if(this.tieDetected){
                var points1 = document.getElementById('M71Score').value;
                var points2 = document.getElementById('M72Score').value;
                points1 = parseInt(points1);
                points2 = parseInt(points2);

                if(isNaN(points1) || isNaN(points2)){
                    return false;
                }else{
                    this.tieDetected = false;
                    this.tieResolved = true;
                }
            }
        }else if(this.tieDetected){
            var points1 = document.getElementById(`game${this.pouleNum}${this.numGames+1}1Score`).value;
            var points2 = document.getElementById(`game${this.pouleNum}${this.numGames+1}2Score`).value;

            points1 = parseInt(points1);
            points2 = parseInt(points2);

            if(isNaN(points1) || isNaN(points2)){
                return false;
            }else{
                this.tieDetected = false;
                this.tieResolved = true;
            }
        }else{
            var playersCopy = [];
            Array.prototype.push.apply(playersCopy, this.players);
            playersCopy.sort(function(a,b){return b.legsWon - a.legsWon});
            this.winner = playersCopy[0].name;
            this.secondPlace = playersCopy[1].name;
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
        
        $(tieBreakerTable).append(`<tr><td><p1 id="game${this.pouleNum}${this.numGames+1}1Name">${this.tiedPlayers[0]}</p1></td><td><p1>-</p1></td><td><p1 id="game${this.pouleNum}${this.numGames+1}2Name">${this.tiedPlayers[1]}</p1></td></tr>`);
        $(tieBreakerTable).append(`<tr><td><input id="game${this.pouleNum}${this.numGames+1}1Score" type="number" class="gameScore"></td><td><p1>-</p1></td><td><input id="game${this.pouleNum}${this.numGames+1}2Score" type="number" class="gameScore"></td></tr>`);
        
        let msg = [this.rankings, this.sendPouleGames(), 'poule'];
        io.emit(`poule${this.pouleNum}Ranks`, msg);
    }

    isTie(){
        let newTiedPlayers = [];
        if(!this.tieDetected){
            var playersCopy = []
            for(let i = 0; i < this.players.length; i++){
                if(this.players[i].gamesPlayed != 0){
                    playersCopy.push(this.players[i]);
                }
            }
            if(playersCopy.length >= 3){
                playersCopy.sort(function(a,b){
                    if(b.legsWon != a.legsWon){
                        return(b.legsWon-a.legsWon);
                    }else{
                        return(b.hiddenPoints-a.hiddenPoints);
                    }
                });
                if(playersCopy[1].legsWon == playersCopy[2].legsWon && playersCopy[1].legsWon != 0 && playersCopy[1].hiddenPoints == playersCopy[2].hiddenPoints){
                    newTiedPlayers = [playersCopy[1].name, playersCopy[2].name];
                }
                return newTiedPlayers;
            }else{
                return [];
            }
        }
    }

    reloadPlayers(){
        for(let i = 0; i < this.numGames; i++){
            document.getElementById(`game${this.pouleNum}${i+1}1Name`).innerHTML = this.players[this.gameFormat[i][0]].name;
            document.getElementById(`game${this.pouleNum}${i+1}2Name`).innerHTML = this.players[this.gameFormat[i][1]].name;
        }
    }

    //Hidden points zijn de punten die niet worden getoond in de tabel met de ranks,
    //maar wel gebruikt worden voor het bepalen van de positie van de spelers in de ranks.
    //Op basis van het aantal punten per dart (PPD).
    calculateHiddenPoints(){
        for(let i = 0; i < this.players.length; i++){
            players[i].calculateHiddenPoints();
        }
    }
}