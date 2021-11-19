import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
// ignore: library_prefixes
import 'package:socket_io_client/socket_io_client.dart' as IO;

String serverIP = '192.168.1.14';
String activePoule = '';
List<String> pouleNames = [];
late int numPoules;
late IO.Socket socket;

void main() {
  runApp(StartScreen());
}

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

  PouleGames(
      {required this.gameID,
      required this.player1,
      required this.player2,
      required this.gamePlayed});
}

class StartScreen extends StatelessWidget {
  StartScreen({Key? key}) : super(key: key);

  final ipAddressController = TextEditingController(text: serverIP);

  void enterIP(context) {
    serverIP = ipAddressController.text;
    print("Connecting to $serverIP");
    socket = IO.io('http://$serverIP:3000', <String, dynamic>{
      'transports': ['websocket'],
      'force new connection': true,
      'autoConnect': false
    });
    socket.connect();
    socket.onConnect((_) {
      socket.emit('clientGreeting', 'yoBitch');
      print("Websocket connected");
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
    pouleNames = [];
    try {
      numPoules = data['poules'].length;
      print("Number of poules: $numPoules");
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
      print(pouleNames);
      setState(() {
        pouleNames = pouleNames;
      });
    } catch (e) {
      print("Error while parsing websocket message");
    }
  }

  void pouleBtnPress(pouleNum, context) {
    activePoule = pouleNum;
    //socket.clearListeners();
    Navigator.of(context).push(
      MaterialPageRoute(builder: (BuildContext context) => PouleScreen()),
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
            title: const Text('Darttoernooi companion'),
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
                    child: Text('Poule $data'));
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
    socket.on('poule$activePoule' + 'Ranks', (data) => updateRanks(data));
    socket.emit('poule$activePoule' + 'InfoRequest', 'plsGeef');
  }

  void updateRanks(data) {
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
          gamePlayed: data[1][i][2]));
    }
    setState(() {});
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
              title: const Text('Darttoernooi companion'),
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
                  Column(
                    children: rankings.map((currentPlayer) {
                      return Container(
                        margin: const EdgeInsets.all(5),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: <Widget>[
                            Text(
                              currentPlayer.playerName,
                              style: const TextStyle(color: Colors.white),
                            ),
                            const SizedBox(width: 50),
                            Text(
                              currentPlayer.points,
                              style: const TextStyle(color: Colors.white),
                            ),
                          ],
                        ),
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
                          padding: EdgeInsets.fromLTRB(0, 10, 0, 0),
                          child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                primary: currentGame.gamePlayed
                                    ? const Color(0xFF202020)
                                    : const Color(0xFF4A0000),
                              ),
                              onPressed: () {
                                if (currentGame.gamePlayed) {
                                  print('${currentGame.gameID} al gespeeld');
                                } else {
                                  print(currentGame.gameID);
                                }
                              },
                              child: Text(
                                  '${currentGame.player1} - ${currentGame.player2}',
                                  style: TextStyle(color: currentGame.gamePlayed? Colors.grey : Colors.white, fontSize: 20))),
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
