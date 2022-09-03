class GameInfoClass {
  int pouleScore;
  int pouleLegs;
  int quartScore;
  int quartLegs;
  int halfScore;
  int halfLegs;
  int finalScore;
  int finalLegs;

  GameInfoClass(
      {this.pouleScore = 0,
      this.pouleLegs = 0,
      this.quartScore = 0,
      this.quartLegs = 0,
      this.halfScore = 0,
      this.halfLegs = 0,
      this.finalScore = 0,
      this.finalLegs = 0});
}

class PlayerClass {
  bool myTurn;
  int currentScore;
  int legsWon;
  int setsWon;
  String possibleOut;
  String thrownScore;
  int dartsThrown;
  int turnsThisLeg;
  int turnsThisGame;
  double gameAverage;
  double legAverage;
  int totalPointsThisLeg;
  int totalPointsThisGame;
  List<int> scoresThrownHistory = [];
  List<int> dartsThrownHistory = [];

  PlayerClass(
      {this.myTurn = false,
      this.currentScore = 0,
      this.legsWon = 0,
      this.setsWon = 0,
      this.thrownScore = '',
      this.possibleOut = '',
      this.dartsThrown = 0,
      this.turnsThisGame = 0,
      this.turnsThisLeg = 0,
      this.gameAverage = 0,
      this.legAverage = 0,
      this.totalPointsThisLeg = 0,
      this.totalPointsThisGame = 0});
}

class PouleRanking {
  final String playerName;
  final String points;
  final String pointsDiff;

  PouleRanking(
      {required this.playerName,
      required this.points,
      required this.pointsDiff});
}

class PouleGames {
  final String gameID;
  final String player1;
  final String player2;
  final bool gamePlayed;
  final String gameType;
  /*final int startingScore;
  final int legsToPlay;
  final int setsToPlay;*/

  PouleGames({
    required this.gameID,
    required this.player1,
    required this.player2,
    required this.gamePlayed,
    required this.gameType,
  }); /*
      required this.startingScore,
      required this.legsToPlay,
      required this.setsToPlay});*/
}
