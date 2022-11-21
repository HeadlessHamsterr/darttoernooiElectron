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
  bool myTurn = false;
  int currentScore = 0;
  int legsWon = 0;
  int setsWon = 0;
  String possibleOut = '';
  String thrownScore = '';
  int dartsThrown = 0;
  int turnsThisLeg = 0;
  int turnsThisGame = 0;
  double gameAverage = 0;
  double legAverage = 0;
  int totalPointsThisLeg = 0;
  int totalPointsThisGame = 0;
  List<int> scoresThrownHistory = [];
  List<int> dartsThrownHistory = [];
  String name = '';

  PlayerClass(this.name);
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
