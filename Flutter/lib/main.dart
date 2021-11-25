/*TODO:
  - Te hoge ingevoerde score geeft pop-up met waarschuwing
  - Row waarin de out wordt afgebeeld veranderen naar table 
    (misschien alles met scores omzetten naar table)
  - Aantal gewonnen legs/sets per speler weergeven
  - Numpad knoppen verkleinen
  - Undo knop voor ingevoerde scores
  - Als de wedstrijd klaar is, terugkoppeling geven aan de server
*/

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
// ignore: library_prefixes
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:test/constants.dart';

String serverIP = '192.168.1.14';
String activePoule = '';
List<String> pouleNames = [];
List gameInfo = [];
late int numPoules;
late IO.Socket socket;
enum ChosenPlayerEnum { player1, player2, undefined }
List activeGameInfo = [];
ChosenPlayerEnum activeStartingPlayer = ChosenPlayerEnum.undefined;
double numBtnWidth = 100;
double numBtnHeigth = 70;

List<String> possibleOuts = [
  'T20 T20 BULL',
  '',
  '',
  'T20 T19 BULL',
  '',
  '',
  'T20 T18 BULL',
  '',
  '',
  'T20 T17 BULL',
  'T20 T20 D20',
  '',
  'T20 T20 D19',
  'T20 T19 D20',
  'T20 T20 D18',
  'T20 T19 D19',
  'T20 T18 D20',
  'T20 T19 D18',
  'T20 T20 D16',
  'T20 T17 D20',
  'T20 T18 D18',
  'T20 T19 D16',
  'T20 T16 D20',
  'T20 T17 D18',
  'T20 T18 D16',
  'T20 T15 D20',
  'T20 T20 D12',
  'T20 T17 D16',
  'T20 T14 D20',
  'T20 T19 D12',
  'T20 T16 D16',
  'T19 T14 D20',
  'T20 T18 D12',
  'T19 T16 D16',
  'T20 T20 D8',
  'T20 T17 D12',
  'T20 T14 D16',
  'T20 T19 D8',
  'BULL T14 D20',
  'T20 T13 D16',
  'T20 T20 D5',
  'T19 T20 D6',
  'T18 T14 D16',
  'T20 T17 D8',
  'T19 T19 D6',
  '25 T20 D20',
  'T20 T14 D11',
  'T19 T16 D9',
  'T18 T18 D7',
  'T20 T11 D14',
  'T20 20 D20',
  'T19 T12 D13',
  'T20 18 D20',
  'T20 17 D20',
  'T20 16 D20',
  'T20 15 D20',
  'T20 14 D20',
  'T20 13 D20',
  'T20 12 D20',
  'T20 11 D20',
  'T20 10 D20',
  'T19 12 D20',
  'T20 16 D16',
  'T19 10 D20',
  'T20 10 D18',
  'T20 13 D16',
  'T20 12 D16',
  'T19 10 D18',
  'T20 10 D16',
  'T17 10 D20',
  'T20 D20',
  'T19 10 D16',
  'T20 D19',
  'T19 D20',
  'T20 D18',
  'T19 D19',
  'T18 D20',
  'T19 D18',
  'T20 D16',
  'T17 D20',
  'T20 D15',
  'T19 D16',
  'T20 D14',
  'T17 D18',
  'T18 D16',
  'T15 D20',
  'T16 D18',
  'T17 D16',
  'T14 D20',
  'T15 D18',
  'T20 D10',
  'T13 D20',
  'T18 D12',
  'T15 D16',
  'T20 D8',
  'T13 D18',
  'T14 D16',
  'T19 D8',
  'T16 D12',
  'T13 D16',
  'T18 D8',
  'T19 D6',
  'T20 D4',
  'T17 D8',
  'T10 D18',
  'T19 D4',
  'T16 D8',
  'T13 D12',
  'T10 D16',
  'T15 D8',
  '20 D20',
  '19 D20',
  '18 D20',
  '17 D20',
  '16 D20',
  '15 D20',
  '14 D20',
  '13 D20',
  '12 D20',
  '19 D16',
  '10 D20',
  '17 D16',
  '16 D16',
  '15 D16',
  '6 D20',
  '13 D16',
  '12 D16',
  '3 D20',
  '10 D16',
  '9 D16',
  'D20',
  '7 D16',
  'D19',
  '5 D16',
  'D18',
  '3 D16',
  'D17',
  '1 D16',
  'D16',
  '15 D8',
  'D15',
  '13 D8',
  'D14',
  '19 D4',
  'D13',
  '9 D8',
  'D12',
  '7 D8',
  'D11',
  '5 D8',
  'D10',
  '3 D8',
  'D9',
  '9 D4',
  'D8',
  '7 D4',
  'D7',
  '5 D4',
  'D6',
  '3 D4',
  'D5',
  '1 D4',
  'D4',
  '3 D2',
  'D3',
  '1 D2',
  'D2',
  '1 D1',
  'D1'
];

var numBtnStyle = ElevatedButton.styleFrom(
  side: const BorderSide(
      color: Colors.black, width: 2.0, style: BorderStyle.solid),
  shape: const RoundedRectangleBorder(
    borderRadius: BorderRadius.all(Radius.zero),
  ),
  primary: const Color(0xFF4A0000),
);
var cBtnStyle = ElevatedButton.styleFrom(
  side: const BorderSide(
      color: Colors.black, width: 2.0, style: BorderStyle.solid),
  shape: const RoundedRectangleBorder(
    borderRadius: BorderRadius.all(Radius.zero),
  ),
  primary: const Color(0xFFC40000),
);
var bustBtnSytle = ElevatedButton.styleFrom(
  side: const BorderSide(
      color: Colors.black, width: 2.0, style: BorderStyle.solid),
  shape: const RoundedRectangleBorder(
    borderRadius: BorderRadius.all(Radius.zero),
  ),
  primary: const Color(0xFF9E5905),
);
var okBtnStyle = ElevatedButton.styleFrom(
  side: const BorderSide(
      color: Colors.black, width: 2.0, style: BorderStyle.solid),
  shape: const RoundedRectangleBorder(
    borderRadius: BorderRadius.all(Radius.zero),
  ),
  primary: const Color(0xFF014D05),
);
var numPadFontSize = 30;
void main() {
  runApp(StartScreen());
}

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

GameInfoClass gameInfoClass = GameInfoClass();

class PouleRanking {
  final String playerName;
  final String points;

  PouleRanking({required this.playerName, required this.points});
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

Widget getPouleName(pouleName) {
  if (pouleName == 'Finales') {
    return Text(pouleName);
  } else {
    return Text('Poule $pouleName');
  }
}

class StartScreen extends StatelessWidget {
  StartScreen({Key? key}) : super(key: key);

  final ipAddressController = TextEditingController(text: serverIP);

  void enterIP(context) {
    serverIP = ipAddressController.text;
    socket = IO.io('http://$serverIP:3000', <String, dynamic>{
      'transports': ['websocket'],
      'force new connection': true,
      'autoConnect': false
    });
    socket.connect();
    socket.onConnect((_) {
      socket.emit('clientGreeting', 'yoBitch');
    });
    Navigator.of(context).push(MaterialPageRoute(
        builder: (BuildContext context) => PoulesOverview(serverIP: serverIP)));
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      theme: ThemeData(
        scaffoldBackgroundColor: const Color(0xFF181818),
      ),
      home: Builder(builder: (context) {
        return Scaffold(
          appBar: AppBar(
            title: const Text('Darttoernooi companion'),
            backgroundColor: const Color(0xFF4A0000),
          ),
          body: ListView(
            children: [
              Container(
                  child: Column(
                    //mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      TextField(
                        controller: ipAddressController,
                        decoration: InputDecoration(
                          labelText: 'IP adres',
                          labelStyle: const TextStyle(color: Colors.white),
                          enabledBorder: const OutlineInputBorder(
                            borderSide: BorderSide(color: Color(0xFF505050)),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderSide:
                                const BorderSide(color: Color(0xFF505050)),
                            borderRadius: BorderRadius.circular(10.0),
                          ),
                        ),
                        style: const TextStyle(color: Colors.white),
                        keyboardType: const TextInputType.numberWithOptions(
                            decimal: true),
                      ),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          primary: const Color(0xFF4A0000),
                        ),
                        child: const Text('Versturen'),
                        onPressed: () {
                          enterIP(context);
                        },
                      ),
                    ],
                  ),
                  padding: const EdgeInsets.fromLTRB(50, 200, 50, 200)),
            ],
          ),
        );
      }),
    );
  }
}

class PoulesOverview extends StatefulWidget {
  final String serverIP;
  const PoulesOverview({Key? key, required this.serverIP}) : super(key: key);

  @override
  _PoulesOverviewState createState() => _PoulesOverviewState();
}

class _PoulesOverviewState extends State<PoulesOverview> {
  String serverAddressObj = '';

  @override
  void initState() {
    super.initState();
    connectWebsocket();
  }

  void connectWebsocket() {
    socket.on('pouleInfo', (data) => updatePouleInfo(data));
  }

  void updatePouleInfo(data) {
    pouleNames.clear();
    gameInfo.clear();
    try {
      numPoules = data[0].length;
      for (var i = 0; i < numPoules; i++) {
        switch (i) {
          case 0:
            pouleNames.add('A');
            break;
          case 1:
            pouleNames.add('B');
            break;
          case 2:
            pouleNames.add('C');
            break;
          case 3:
            pouleNames.add('D');
            break;
        }
      }
      pouleNames.add("Finales");

      //gameInfo.addAll(data[1]);
      gameInfoClass.pouleScore = int.parse(data[1][0]);
      gameInfoClass.pouleLegs = int.parse(data[1][1]);
      gameInfoClass.quartScore = int.parse(data[1][2]);
      gameInfoClass.quartLegs = int.parse(data[1][3]);
      gameInfoClass.halfScore = int.parse(data[1][4]);
      gameInfoClass.halfLegs = int.parse(data[1][5]);
      gameInfoClass.finalScore = int.parse(data[1][6]);
      gameInfoClass.finalLegs = int.parse(data[1][7]);
      setState(() {
        pouleNames = pouleNames;
      });
    } catch (e) {
      // ignore: avoid_print
      print(e);
    }
  }

  void pouleBtnPress(pouleNum, context) {
    activePoule = pouleNum;
    //socket.clearListeners();
    Navigator.of(context).push(
      MaterialPageRoute(builder: (BuildContext context) => const PouleScreen()),
    );
  }

  void backBtnPress(context) {
    socket.disconnect();
    Navigator.of(context).push(
      MaterialPageRoute(builder: (BuildContext context) => StartScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    serverAddressObj = widget.serverIP;
    if (socket.connected == false) {
      connectWebsocket();
    }
    return MaterialApp(
      theme: ThemeData(
        scaffoldBackgroundColor: const Color(0xFF181818),
      ),
      home: Builder(builder: (context) {
        return Scaffold(
          appBar: AppBar(
            title: const Text('Poules'),
            backgroundColor: const Color(0xFF4A0000),
            leading: IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () {
                  backBtnPress(context);
                }),
          ),
          body: Center(
            child: Column(
              children: pouleNames.map((String data) {
                return ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    primary: const Color(0xFF4A0000),
                  ),
                  onPressed: () {
                    pouleBtnPress(data, context);
                  },
                  child: getPouleName(data),
                );
              }).toList(),
            ),
          ),
        );
      }),
    );
  }
}

class PouleScreen extends StatefulWidget {
  const PouleScreen({Key? key}) : super(key: key);

  @override
  _PouleScreenState createState() => _PouleScreenState();
}

class _PouleScreenState extends State<PouleScreen> {
  List<PouleRanking> rankings = [];
  List<PouleGames> games = [];
  @override
  void initState() {
    super.initState();
    socket.emit('poule${activePoule}InfoRequest', 'plsGeef');
    socket.on('poule${activePoule}Ranks', (data) => updateRanks(data));
  }

  void updateRanks(data) {
    print(data);
    rankings.clear();
    for (var i = 0; i < data[0].length; i++) {
      rankings.add(PouleRanking(
          playerName: data[0][i][0].toString(),
          points: data[0][i][1].toString()));
    }

    games.clear();
    for (var i = 0; i < data[1].length; i++) {
      String gameID = activePoule + (i + 1).toString();
      games.add(PouleGames(
          gameID: gameID,
          player1: data[1][i][0],
          player2: data[1][i][1],
          gamePlayed: data[1][i][2],
          gameType: data[2]));
    }
    setState(() {});
  }

  void gamePressed(PouleGames game, context) {
    Navigator.of(context).push(MaterialPageRoute(
        builder: (BuildContext context) => PouleGame(game: game)));
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      theme: ThemeData(
        scaffoldBackgroundColor: const Color(0xFF181818),
      ),
      home: Builder(
        builder: (context) {
          return Scaffold(
            appBar: AppBar(
              title: getPouleName(activePoule),
              backgroundColor: const Color(0xFF4A0000),
              leading: IconButton(
                  icon: const Icon(Icons.arrow_back),
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                          builder: (BuildContext context) =>
                              PoulesOverview(serverIP: serverIP)),
                    );
                  }),
            ),
            body: Center(
              child: Column(
                children: [
                  Table(
                    border: const TableBorder(
                        horizontalInside: BorderSide(color: Color(0xFFE46800)),
                        verticalInside: BorderSide(color: Color(0xFFE46800))),
                    //defaultColumnWidth: const FixedColumnWidth(100),
                    columnWidths: const {
                      0: FixedColumnWidth(100),
                      1: FixedColumnWidth(50),
                    },
                    children: rankings.map((currentPlayer) {
                      return TableRow(
                        children: <Widget>[
                          Center(
                            child: Text(
                              currentPlayer.playerName,
                              style: const TextStyle(color: Colors.white),
                            ),
                          ),
                          Center(
                            child: Text(
                              currentPlayer.points,
                              style: const TextStyle(color: Colors.white),
                            ),
                          ),
                        ],
                      );
                    }).toList(),
                  ),
                  Column(
                    children: games.map((currentGame) {
                      return IgnorePointer(
                        ignoring: currentGame.gamePlayed,
                        child: Container(
                          width: 200,
                          height: 60,
                          padding: const EdgeInsets.fromLTRB(0, 10, 0, 0),
                          child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                primary: currentGame.gamePlayed
                                    ? const Color(0xFF202020)
                                    : const Color(0xFF4A0000),
                              ),
                              onPressed: () {
                                if (!currentGame.gamePlayed) {
                                  gamePressed(currentGame, context);
                                }
                              },
                              child: Text(
                                  '${currentGame.player1} - ${currentGame.player2}',
                                  style: TextStyle(
                                      color: currentGame.gamePlayed
                                          ? Colors.grey
                                          : Colors.white,
                                      fontSize: 20))),
                        ),
                      );
                    }).toList(),
                  )
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class PouleGame extends StatelessWidget {
  final PouleGames game;
  const PouleGame({Key? key, required this.game}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
        theme: ThemeData(
          scaffoldBackgroundColor: const Color(0xFF181818),
        ),
        home: Builder(builder: (context) {
          return Scaffold(
            appBar: AppBar(
              title: Text('${game.player1} - ${game.player2}'),
              centerTitle: true,
              backgroundColor: const Color(0xFF4A0000),
              leading: IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                        builder: (BuildContext context) => const PouleScreen()),
                  );
                },
              ),
            ),
            body: PouleGameBody(game: game, context: context),
          );
        }));
  }
}

class PouleGameBody extends StatefulWidget {
  final PouleGames game;
  final BuildContext context;
  const PouleGameBody({Key? key, required this.game, required this.context})
      : super(key: key);

  @override
  _PouleGameBodyState createState() => _PouleGameBodyState();
}

class _PouleGameBodyState extends State<PouleGameBody> {
  var specialBtnStyle = cBtnStyle;
  bool gameStarted = false;
  ChosenPlayerEnum chosenPlayer = activeStartingPlayer;
  var player1Turn = true;
  int player1CurrentScore = 0;
  int player1LegsWon = 0;
  int player1SetsWon = 0;
  int player2CurrentScore = 0;
  int player2LegsWon = 0;
  int player2SetsWon = 0;
  int setsToPlay = 0;
  int legsToPlay = 0;
  String player1PossibleOut = '';
  String player2PossibleOut = '';
  String player1ThrownScore = '';
  String player2ThrownScore = '';
  String specialBtnText = 'C';

  @override
  void initState() {
    super.initState();
    bool newGame = false;
    try {
      if (widget.game.gameID != activeGameInfo[0]) {
        newGame = true;
      }
    } catch (e) {
      newGame = true;
    }

    if (newGame) {
      activeGameInfo.clear();
      activeGameInfo.add(widget.game.gameID);
      if (widget.game.gameType == 'poule') {
        player2CurrentScore = player1CurrentScore = gameInfoClass.pouleScore;
        activeGameInfo.add(gameInfoClass.pouleScore);
        legsToPlay = gameInfoClass.pouleLegs;
      } else if (widget.game.gameType == 'quart') {
        player2CurrentScore = player1CurrentScore = gameInfoClass.quartScore;
        activeGameInfo.add(gameInfoClass.quartScore);
        legsToPlay = gameInfoClass.quartLegs;
      } else if (widget.game.gameType == 'half') {
        player2CurrentScore = player1CurrentScore = gameInfoClass.halfScore;
        activeGameInfo.add(gameInfoClass.halfScore);
        legsToPlay = gameInfoClass.halfLegs;
      } else {
        player2CurrentScore = player1CurrentScore = gameInfoClass.finalScore;
        activeGameInfo.add(gameInfoClass.finalScore);
        legsToPlay = gameInfoClass.finalLegs;
      }
      activeGameInfo.add(player1CurrentScore);
      activeGameInfo.add(player2CurrentScore);
      activeGameInfo.add(player1LegsWon);
      activeGameInfo.add(player1SetsWon);
      activeGameInfo.add(player2LegsWon);
      activeGameInfo.add(player2SetsWon);
      activeGameInfo.add(legsToPlay);
      activeGameInfo.add(setsToPlay);
      activeStartingPlayer = ChosenPlayerEnum.undefined;
      chosenPlayer = activeStartingPlayer;
    } else {
      player1CurrentScore = activeGameInfo[2];
      player2CurrentScore = activeGameInfo[3];

      player1LegsWon = activeGameInfo[4];
      player1SetsWon = activeGameInfo[5];
      player2LegsWon = activeGameInfo[6];
      player2SetsWon = activeGameInfo[7];

      legsToPlay = activeGameInfo[8];
      setsToPlay = activeGameInfo[9];
    }
  }

  void btnPress(String btnType) {
    switch (btnType) {
      case 'OK':
        if (player1Turn) {
          if (player1ThrownScore == '') {
            ScaffoldMessenger.of(widget.context).showSnackBar(
              const SnackBar(content: Text("Geen score ingevuld")),
            );
          } else {
            if (int.parse(player1ThrownScore) > 180 ||
                int.parse(player1ThrownScore) > player1CurrentScore) {
              ScaffoldMessenger.of(widget.context).showSnackBar(
                SnackBar(content: Text(player1ThrownScore + ' is te hoog')),
              );
            } else if (player1ThrownScore != '0') {
              player1CurrentScore -= int.parse(player1ThrownScore);
              player1Turn = false;
              player2ThrownScore = '';
            } else {
              player1Turn = false;
              player2ThrownScore = '';
            }

            if (player1CurrentScore == 0) {
              player1LegsWon++;
              if (player1LegsWon > (legsToPlay - player1LegsWon)) {
                player1SetsWon++;
                if (player1SetsWon > (setsToPlay - player1SetsWon)) {
                  print("Alle sets gespeeld");
                  endGame(widget.game.player1);
                } else {
                  resetGame();
                }
              } else {
                resetGame();
              }
            } else if (170 - player1CurrentScore >= 0) {
              player1PossibleOut = possibleOuts[170 - player1CurrentScore];
            } else {
              player1PossibleOut = '';
            }
          }
        } else {
          if (player2ThrownScore == '') {
            ScaffoldMessenger.of(widget.context).showSnackBar(
              const SnackBar(content: Text("Geen score ingevuld")),
            );
          } else {
            if (int.parse(player2ThrownScore) > 180 ||
                int.parse(player2ThrownScore) > player2CurrentScore) {
              ScaffoldMessenger.of(widget.context).showSnackBar(
                SnackBar(content: Text(player2ThrownScore + ' is te hoog')),
              );
            } else if (player2ThrownScore != '0') {
              player2CurrentScore -= int.parse(player2ThrownScore);
              player1Turn = true;
              player1ThrownScore = '';
            } else {
              player1Turn = true;
              player1ThrownScore = '';
            }

            if (player2CurrentScore == 0) {
              player2LegsWon++;
              if (player2LegsWon > (legsToPlay - player2LegsWon)) {
                player2SetsWon++;
                if (player2SetsWon > (setsToPlay - player2SetsWon)) {
                  print("Alle sets gespeeld");
                  endGame(widget.game.player2);
                } else {
                  resetGame();
                }
              } else {
                resetGame();
              }
            } else if (170 - player2CurrentScore >= 0) {
              player2PossibleOut = possibleOuts[170 - player2CurrentScore];
            } else {
              player2PossibleOut = '';
            }
          }
        }
        break;
      case 'C':
        if (player1Turn) {
          player1ThrownScore = '';
        } else {
          player2ThrownScore = '';
        }
        break;
      case 'BUST':
        if (player1Turn) {
          player1ThrownScore = 'BUST';
          player2ThrownScore = '';
          player1Turn = false;
        } else {
          player2ThrownScore = 'BUST';
          player1ThrownScore = '';
          player1Turn = true;
        }
        break;
      default:
        if (player1Turn) {
          if (player1ThrownScore.toString().length == 3) {
            break;
          } else {
            if (player1ThrownScore == '0') {
              player1ThrownScore == btnType;
            } else {
              player1ThrownScore = player1ThrownScore + btnType;
            }
          }
        } else {
          if (player2ThrownScore.toString().length == 3) {
            break;
          } else {
            if (player2ThrownScore == '0') {
              player2ThrownScore == btnType;
            } else {
              player2ThrownScore = player2ThrownScore + btnType;
            }
          }
        }
        break;
    }
    setState(() {
      null;
    });
  }

  void endGame(String winner) {
    showDialog<String>(
      context: widget.context,
      builder: (BuildContext context) => AlertDialog(
        title: Text("Heeft $winner de wedstrijd gewonnen?"),
        content: Text("$winner heeft de wedstrijd in 69 darts uitgegooid."),
        actions: <Widget>[
          TextButton(
            onPressed: () {
              print("Geanulleerd.");
              Navigator.pop(context, 'Cancel');
            },
            child: const Text("Annuleren"),
          ),
          TextButton(
            onPressed: () {
              String msg =
                  "${widget.game.gameID},${player1LegsWon.toString()},${player2LegsWon.toString()}";
              socket.emit('gamePlayed', msg);
              Navigator.pop(context, 'Bevestigd');
              Navigator.of(widget.context).push(
                MaterialPageRoute(
                    builder: (BuildContext context) => const PouleScreen()),
              );
            },
            child: const Text("Bevestigen"),
          ),
        ],
      ),
    );
  }

  void resetGame() {
    player1CurrentScore = activeGameInfo[1];
    player1PossibleOut = '';
    player1ThrownScore = '';
    player2CurrentScore = activeGameInfo[1];
    player2PossibleOut = '';
    player2ThrownScore = '';

    int legsPlayed = player1LegsWon + player2LegsWon;

    if (legsPlayed % 2 == 0) {
      if (chosenPlayer == ChosenPlayerEnum.player1) {
        player1Turn = true;
      } else {
        player1Turn = false;
      }
    } else {
      if (chosenPlayer == ChosenPlayerEnum.player1) {
        player1Turn = false;
      } else {
        player1Turn = true;
      }
    }
  }

  Widget bodyContainer() {
    activeStartingPlayer = chosenPlayer;
    if (!gameStarted) {
      switch (chosenPlayer) {
        case ChosenPlayerEnum.player1:
          player1Turn = true;
          gameStarted = true;
          return playerChosen(widget.game.player1);
        case ChosenPlayerEnum.player2:
          player1Turn = false;
          gameStarted = true;
          return playerChosen(widget.game.player2);
        case ChosenPlayerEnum.undefined:
          return defaultLayout();
      }
    } else {
      return playerChosen(widget.game.player1);
    }
  }

  Widget playerChosen(String player) {
    return Center(
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                widget.game.player1,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                ),
              ),
              Table(
                defaultColumnWidth: const FixedColumnWidth(50),
                children: [
                  TableRow(children: <Widget>[
                    Center(
                      child: Text(
                        player1SetsWon.toString(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                        ),
                      ),
                    ),
                    const Center(
                      child: Text(
                        "Sets",
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                        ),
                      ),
                    ),
                    Center(
                      child: Text(
                        player2SetsWon.toString(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                        ),
                      ),
                    ),
                  ]),
                  TableRow(children: <Widget>[
                    Center(
                      child: Text(
                        player1LegsWon.toString(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                        ),
                      ),
                    ),
                    const Center(
                      child: Text(
                        "Legs",
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                        ),
                      ),
                    ),
                    Center(
                      child: Text(
                        player2LegsWon.toString(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                        ),
                      ),
                    ),
                  ])
                ],
              ),
              Text(widget.game.player2,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                  )),
            ],
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              Text(
                player1CurrentScore.toString(),
                style: const TextStyle(color: Colors.white, fontSize: 80),
              ),
              Text(
                player2CurrentScore.toString(),
                style: const TextStyle(color: Colors.white, fontSize: 80),
              )
            ],
          ),
          const SizedBox(
            height: 30,
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              Text(
                player1PossibleOut,
                style: const TextStyle(color: Colors.white, fontSize: 20),
              ),
              Text(
                player2PossibleOut,
                style: const TextStyle(color: Colors.white, fontSize: 20),
              )
            ],
          ),
          const SizedBox(
            height: 30,
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              SizedBox(
                width: 150,
                height: 50,
                child: Container(
                  color: player1Turn ? Colors.white : const Color(0xFF303030),
                  alignment: Alignment.center,
                  child: Center(
                    child: Text(
                      player1ThrownScore,
                      style: TextStyle(
                        color: player1Turn ? Colors.black : Colors.black38,
                        fontSize: 30,
                      ),
                    ),
                  ),
                ),
              ),
              SizedBox(
                width: 150,
                height: 50,
                child: Container(
                  color: player1Turn ? const Color(0xFF303030) : Colors.white,
                  alignment: Alignment.center,
                  child: Center(
                    child: Text(
                      player2ThrownScore,
                      style: TextStyle(
                        color: player1Turn ? Colors.black38 : Colors.black,
                        fontSize: 30,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(
            height: 10,
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              const SizedBox(
                width: 10,
              ),
              SizedBox(
                width: numBtnWidth,
                height: numBtnHeigth,
                child: ElevatedButton(
                    style: numBtnStyle,
                    onPressed: () {
                      btnPress('1');
                    },
                    child: const Text(
                      '1',
                      style: TextStyle(fontSize: 20),
                    )),
              ),
              SizedBox(
                width: numBtnWidth,
                height: numBtnHeigth,
                child: ElevatedButton(
                    style: numBtnStyle,
                    onPressed: () {
                      btnPress('2');
                    },
                    child: const Text(
                      '2',
                      style: TextStyle(fontSize: 20),
                    )),
              ),
              SizedBox(
                width: numBtnWidth,
                height: numBtnHeigth,
                child: ElevatedButton(
                    style: numBtnStyle,
                    onPressed: () {
                      btnPress('3');
                    },
                    child: const Text(
                      '3',
                      style: TextStyle(fontSize: 20),
                    )),
              ),
            ],
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              const SizedBox(
                width: 10,
              ),
              SizedBox(
                width: numBtnWidth,
                height: numBtnHeigth,
                child: ElevatedButton(
                    style: numBtnStyle,
                    onPressed: () {
                      btnPress('4');
                    },
                    child: const Text(
                      '4',
                      style: TextStyle(fontSize: 20),
                    )),
              ),
              SizedBox(
                width: numBtnWidth,
                height: numBtnHeigth,
                child: ElevatedButton(
                    style: numBtnStyle,
                    onPressed: () {
                      btnPress('5');
                    },
                    child: const Text(
                      '5',
                      style: TextStyle(fontSize: 20),
                    )),
              ),
              SizedBox(
                width: numBtnWidth,
                height: numBtnHeigth,
                child: ElevatedButton(
                    style: numBtnStyle,
                    onPressed: () {
                      btnPress('6');
                    },
                    child: const Text(
                      '6',
                      style: TextStyle(fontSize: 20),
                    )),
              ),
            ],
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              const SizedBox(
                width: 10,
              ),
              SizedBox(
                width: numBtnWidth,
                height: numBtnHeigth,
                child: ElevatedButton(
                    style: numBtnStyle,
                    onPressed: () {
                      btnPress('7');
                    },
                    child: const Text(
                      '7',
                      style: TextStyle(fontSize: 20),
                    )),
              ),
              SizedBox(
                width: numBtnWidth,
                height: numBtnHeigth,
                child: ElevatedButton(
                    style: numBtnStyle,
                    onPressed: () {
                      btnPress('8');
                    },
                    child: const Text(
                      '8',
                      style: TextStyle(fontSize: 20),
                    )),
              ),
              SizedBox(
                width: numBtnWidth,
                height: numBtnHeigth,
                child: ElevatedButton(
                    style: numBtnStyle,
                    onPressed: () {
                      btnPress('9');
                    },
                    child: const Text(
                      '9',
                      style: TextStyle(fontSize: 20),
                    )),
              ),
            ],
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              const SizedBox(
                width: 10,
              ),
              SizedBox(
                width: numBtnWidth,
                height: numBtnHeigth,
                child: ElevatedButton(
                    style: specialBtnStyle,
                    onPressed: () {
                      btnPress(specialBtnText);
                    },
                    child: Text(
                      specialBtnText,
                      style: const TextStyle(fontSize: 20),
                    )),
              ),
              SizedBox(
                width: numBtnWidth,
                height: numBtnHeigth,
                child: ElevatedButton(
                    style: numBtnStyle,
                    onPressed: () {
                      btnPress('0');
                    },
                    child: const Text(
                      '0',
                      style: TextStyle(fontSize: 20),
                    )),
              ),
              SizedBox(
                width: numBtnWidth,
                height: numBtnHeigth,
                child: ElevatedButton(
                    style: okBtnStyle,
                    onPressed: () {
                      btnPress('OK');
                    },
                    child: const Text(
                      'OK',
                      style: TextStyle(fontSize: 20),
                    )),
              ),
            ],
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              const SizedBox(
                width: 10,
              ),
              SizedBox(
                width: 300,
                child: ElevatedButton(
                  style: numBtnStyle,
                  onPressed: () {
                    btnPress('26');
                  },
                  child: const Text("Standaard"),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget defaultLayout() {
    return Container(
      padding: const EdgeInsets.fromLTRB(0, 100, 0, 0),
      child: ListView(
        children: [
          const Center(
            child: Text(
              "Wie mag er beginnen?",
              style: TextStyle(color: Colors.white, fontSize: 20),
            ),
          ),
          const SizedBox(
            height: 20,
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox(
                width: 150,
                height: 50,
                child: ElevatedButton(
                  onPressed: () {
                    setState(() {
                      chosenPlayer = ChosenPlayerEnum.player1;
                    });
                  },
                  child: Text(
                    widget.game.player1,
                    style: const TextStyle(fontSize: 20),
                  ),
                  style: ElevatedButton.styleFrom(
                    primary: const Color(0xFF4A0000),
                  ),
                ),
              ),
              const SizedBox(
                width: 20,
              ),
              SizedBox(
                width: 150,
                height: 50,
                child: ElevatedButton(
                  onPressed: () {
                    setState(() {
                      chosenPlayer = ChosenPlayerEnum.player2;
                    });
                  },
                  child: Text(
                    widget.game.player2,
                    style: const TextStyle(fontSize: 20),
                  ),
                  style: ElevatedButton.styleFrom(
                    primary: const Color(0xFF4A0000),
                  ),
                ),
              ),
            ],
          )
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if ((player1Turn &&
            player1CurrentScore <= 180 &&
            player1ThrownScore == '') ||
        (!player1Turn &&
            player2CurrentScore < 180 &&
            player2ThrownScore == '')) {
      specialBtnText = 'BUST';
      specialBtnStyle = bustBtnSytle;
    } else {
      specialBtnText = 'C';
      specialBtnStyle = cBtnStyle;
    }
    return Container(
      child: bodyContainer(),
    );
  }
}
