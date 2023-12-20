// ignore_for_file: camel_case_types

import 'dart:io';
import 'dart:convert';
import 'dart:async';
import 'package:flutter/material.dart';
// ignore: library_prefixes
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:auto_size_text/auto_size_text.dart';
import 'package:Darttoernooi/size_config.dart';
import 'package:network_info_plus/network_info_plus.dart';
import 'package:package_info/package_info.dart';
import 'defs/constants.dart';
import 'defs/classes.dart';
import 'package:wifi_configuration_2/wifi_configuration_2.dart';

String serverIP = '';
String activePoule = '';
List<String> pouleNames = [];
List gameInfo = [];
late int numPoules;
late IO.Socket socket;

List activeGameInfo = [];
ChosenPlayerEnum activeStartingPlayer = ChosenPlayerEnum.undefined;
bool firstStart = false;
bool gameActive = false;
double horizontalScaling = 0;
double verticalScaling = 0;

late PackageInfo appInfo;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  appInfo = await PackageInfo.fromPlatform();
  //runApp(const StartScreen());
  runApp(MainApp());
}

GameInfoClass gameInfoClass = GameInfoClass();

Widget getPouleName(pouleName) {
  if (pouleName == 'Finales') {
    return Text(pouleName);
  } else {
    return Text('Poule $pouleName');
  }
}

class MainApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      home: StartScreen(),
    );
  }
}

class StartScreen extends StatefulWidget {
  const StartScreen({Key? key}) : super(key: key);

  @override
  _StartScreenState createState() => _StartScreenState();
}

class _StartScreenState extends State<StartScreen> {
  late BuildContext standardContext;
  late Timer connectionTimer;
  late Timer boolTimer;
  bool stopChecking = false;
  bool readyToCheck = false;
  @override
  void initState() {
    super.initState();

    //Start server scanning mag pas beginnen nadat de ui geladen is
    /*WidgetsBinding.instance.addPostFrameCallback((_) {
      startServerScanning();
    });*/
  }

  List<String> availableHosts = [];
  List<String> newHosts = [];
  List<Widget> hostButtons = [];
  final ipAddressController = TextEditingController(text: serverIP);
  bool displayNoConnectMsg = false;

  void startServerScanning(BuildContext context) async {
    WifiConfiguration wifiConfiguration = WifiConfiguration();
    bool wifiReady = false;

    bool wifiEnabled = await wifiConfiguration.isWifiEnabled().then((value) {
      return value;
    });

    if (!wifiEnabled) {
      print("Wifi not enabled");
      showDialog(
          context: context,
          builder: (BuildContext context) => AlertDialog(
                title: const Text('WiFi uitgeschakeld'),
                content: const Text(
                    'Schakel de WiFi in om de app te kunnen gebruiken'),
                actions: <Widget>[
                  TextButton(
                      onPressed: () {
                        Navigator.pop(context, 'Done');
                      },
                      child: const Text("Gereed"))
                ],
              ));
      while (!wifiEnabled) {
        wifiEnabled = await wifiConfiguration.isWifiEnabled().then((value) {
          return value;
        });
      }
    }

    final info = NetworkInfo();
    bool wifiConnected = false;
    final wifiName = await info.getWifiIP();
    print('Wifiname: $wifiName');

    if (wifiName != null) {
      wifiConnected = true;
    }

    if (!wifiConnected) {
      Timer wifiAlertTimer =
          Timer.periodic(const Duration(seconds: 5), (timer) {
        showDialog(
            context: context,
            builder: (BuildContext context) => AlertDialog(
                  title: const Text('WiFi niet verbonden'),
                  content: const Text(
                      'Verbind met een WiFi netwerk om de app te gebruiken'),
                  actions: <Widget>[
                    TextButton(
                        onPressed: () {
                          Navigator.pop(context, 'Done');
                        },
                        child: const Text("Gereed"))
                  ],
                ));
        timer.cancel();
      });

      while (!wifiConnected) {
        final wifiName = await info.getWifiIP();
        print('Wifiname: $wifiName');

        if (wifiName != null) {
          wifiConnected = true;
        }
      }
      wifiAlertTimer.cancel();
    }

    var deviceIP = await info.getWifiIP();
    //Als de wifi pas net aan staat is het IP null, dus wachten tot de telefoon een IP heeft gekregen
    while (deviceIP == null) {
      deviceIP = await info.getWifiIP();
      setState(() {});
    }

    if (!readyToCheck) {
      readyToCheck = true;
      setState(() {});
    }

    print('Device IP: $deviceIP');
    var broadCastAddr = await info.getWifiBroadcast();
    broadCastAddr = broadCastAddr.toString().replaceAll(RegExp(r'/'), '');
    print(broadCastAddr);
    var _destinationAddress = InternetAddress(broadCastAddr);

    RawDatagramSocket.bind(InternetAddress.anyIPv4, 8889)
        .then((RawDatagramSocket udpSocket) {
      udpSocket.broadcastEnabled = true;
      udpSocket.listen((event) {
        Datagram? dg = udpSocket.receive();
        if (dg != null) {
          String message = utf8.decode(dg.data);
          //print("Received: $message");
          List<String> messageList = message.split(',');
          if (messageList[0] == 'serverName') {
            if (!availableHosts.contains(messageList[1])) {
              boolTimer.cancel();
              availableHosts.add(messageList[1]);
              hostButtons.add(
                  _hostButton(standardContext, messageList[1], messageList[2]));
              setState(() {});
            }
          }
          //Extra code voor het ontvangen van het serverClose bericht
          //Is redundant geworden door het leeg maken van de serverlijst bij een nieuwe request, wel laten staan voor de zekerheid
          else if (messageList[0] == 'serverClose') {
            for (int i = 0; i < availableHosts.length; i++) {
              if (availableHosts[i] == messageList[1]) {
                availableHosts.removeAt(i);
                hostButtons.removeAt(i);
                if (availableHosts.isEmpty) {
                  boolTimer =
                      Timer.periodic(const Duration(seconds: 30), (timer) {
                    displayNoConnectMsg = true;
                    setState(() {});
                    if (displayNoConnectMsg || stopChecking) {
                      timer.cancel();
                    }
                  });
                }
                setState(() {});
                break;
              }
            }
          }
        }
      });
      List<int> data =
          utf8.encode("serverNameRequest,$deviceIP,${appInfo.version}");
      udpSocket.send(data, _destinationAddress, 8889);
      print("Just send: ${utf8.decode(data)}");
      connectionTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
        //Serverlijst leegmaken en scherm refreshen zodat een verdwenen server
        //niet in de lijst blijft staan

        //UDP Broadcast sturen om servers te vinden
        udpSocket.send(data, _destinationAddress, 8889);
        if (stopChecking) {
          timer.cancel();
        }
      });

      boolTimer = Timer.periodic(const Duration(seconds: 30), (timer) {
        displayNoConnectMsg = true;
        setState(() {});
        if (displayNoConnectMsg || stopChecking) {
          timer.cancel();
        }
      });
    });
    return Future.value(1);
  }

  void enterIP(BuildContext context, String serverIP) {
    firstStart = true;
    stopChecking = true;
    socket = IO.io('ws://$serverIP:$serverPort', <String, dynamic>{
      'transports': ['websocket'],
      'force new connection': true,
      'autoConnect': false
    });
    socket.connect();
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
      content: Text('Verbinding maken...'),
      duration: Duration(days: 365),
    ));
    socket.onConnect((_) {
      if (firstStart) {
        firstStart = false;
        socket.emit('clientGreeting', 'yoBitch');
        stopChecking = true;
        connectionTimer.cancel();
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        Navigator.of(context).push(MaterialPageRoute(
            builder: (BuildContext context) =>
                PoulesOverview(serverIP: serverIP)));
      }
    });
  }

  Widget _hostButton(
      BuildContext buttonContext, String serverName, String serverIP) {
    return Column(
      children: [
        const SizedBox(height: 20),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            const SizedBox(width: 30),
            SizedBox(
              width: 200,
              height: 50,
              child: Container(
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.white24),
                  borderRadius: BorderRadius.circular(5),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    AutoSizeText(
                      serverName,
                      maxLines: 1,
                      maxFontSize: 14,
                      style: const TextStyle(
                        color: Colors.white,
                      ),
                    ),
                    TextButton(
                        onPressed: () {
                          print("Connecting to $serverName on $serverIP");
                          enterIP(buttonContext, serverIP);
                        },
                        child: const Text("Verbinden"))
                  ],
                ),
              ),
            ),
            const SizedBox(
              width: 30,
            ),
          ],
        ),
      ],
    );
  }

  void openHelpScreen(BuildContext context) {
    Navigator.of(context).push(MaterialPageRoute(
        builder: (BuildContext context) => const HelpScreen()));
  }

  @override
  Widget build(BuildContext context) {
    startServerScanning(context);
    return MaterialApp(
      theme: ThemeData(
        scaffoldBackgroundColor: const Color(0xFF181818),
      ),
      home: Builder(builder: (context) {
        standardContext = context;
        sizeConfig.init(context);
        horizontalScaling = sizeConfig.blockSizeHorizontal;
        verticalScaling = sizeConfig.blockSizeVertical;
        //print("Horizontal scaling : $horizontalScaling");
        //print("Vertical scaling: $verticalScaling");
        return Scaffold(
            appBar: AppBar(
              title: const Text('Darttoernooi'),
              centerTitle: true,
              backgroundColor: const Color(PRIMARY_COLOR),
              actions: [
                IconButton(
                    onPressed: () => {openHelpScreen(context)},
                    icon: const Icon(Icons.help)),
              ],
            ),
            drawer: Drawer(
              backgroundColor: const Color(BACKGROUND_COLOR),
              child: ListView(
                padding: EdgeInsets.zero,
                children: <Widget>[
                  const DrawerHeader(
                    child: Text(
                      'Handmatig verbinden',
                      style: TextStyle(color: Colors.white, fontSize: 25),
                    ),
                  ),
                  Column(
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
                          primary: const Color(DEFAULT_BTN_COLOR),
                        ),
                        child: const Text('Verbinden'),
                        onPressed: () {
                          enterIP(context, ipAddressController.text);
                        },
                      ),
                    ],
                  )
                ],
              ),
            ),
            body: ListView(children: [
              Container(
                  padding: const EdgeInsets.fromLTRB(50, 50, 50, 50),
                  child: Column(children: [
                    const AutoSizeText(
                      "Beschikbare wedstrijden:",
                      maxLines: 1,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                      ),
                    ),
                    readyToCheck
                        ? hostButtons.isNotEmpty
                            ? Column(children: hostButtons)
                            : Image.asset('assets/loading.gif',
                                height: 70, width: 70)
                        : const Text('Wachten op WiFi verbinding',
                            style: TextStyle(color: Colors.white)),
                  ])),
              displayNoConnectMsg
                  ? const Center(
                      child: Column(
                        children: [
                          Text('Wordt de server niet gevonden?',
                              style: TextStyle(color: Colors.white)),
                          Text('Probeer de PC en mobiele app te updaten.',
                              style: TextStyle(color: Colors.white))
                        ],
                      ),
                    )
                  : const Text(''),
            ]));
      }),
    );
  }
}

class HelpScreen extends StatelessWidget {
  const HelpScreen({Key? key}) : super(key: key);

  void backPressed(BuildContext context) {
    //Navigator.of(context).push(MaterialPageRoute(
    //    builder: (BuildContext context) => const StartScreen()));
    Navigator.pop(context);
  }

  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          title: const Text("Informatie"),
          centerTitle: true,
          backgroundColor: const Color(PRIMARY_COLOR),
          leading: IconButton(
              onPressed: () {
                backPressed(context);
              },
              icon: const Icon(Icons.arrow_back)),
        ),
        body: ListView(
          children: [
            Text("Verbinding maken met de computer",
                style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 7.3 * horizontalScaling,
                    color: Colors.white)),
            Text(
              """De app zoekt automatisch naar een computer om mee te verbinden. Deze komen onder elkaar op het begin scherm te staan:""",
              style: TextStyle(
                  color: Colors.white, fontSize: 4.87 * horizontalScaling),
            ),
            Image.asset('assets/homeScreenApp.jpg',
                scale: 20 / horizontalScaling),
            Text(
              """De naam van de computer (in dit voorbeeld Aloma) kan gecontroleerd worden op de computer. Druk op de drie streepjes rechtsboven. De naam van de compter staat bovenaan het menu dat verschijnt:
""",
              style: TextStyle(
                  color: Colors.white, fontSize: 4.87 * horizontalScaling),
            ),
            Image.asset("assets/computerNaam.png",
                scale: 5 / horizontalScaling),
            Text(
              """Als er geen computers gevonden worden, zorg er dan voor dat:
- Er een wedstrijd actief is op een computer;
- De computer en de telefoon met hetzelfde netwerk verbonden zijn;
- De mobiele en PC app de laatste versie zijn.

Als dit allemaal goed is, maar de app nog steeds geen computers kan vinden, kan er altijd nog handmatig verbonden worden met de computer. Druk op de drie streepjes linksboven (op het begin scherm). Hier kan het IP-adres van de server ingevuld worden.
              """,
              style: TextStyle(
                  fontSize: 4.87 * horizontalScaling, color: Colors.white),
            ),
            Text(
              '''Druk op "App instellingen". Onderaan staat het IP-adres van de server.
''',
              style: TextStyle(
                  color: Colors.white, fontSize: 4.87 * horizontalScaling),
            ),
            Image(
              image: const AssetImage('assets/PCIP.png'),
              width: 10 / horizontalScaling,
            ),
            SizedBox(
              height: 2.44 * verticalScaling,
            ),
          ],
        ));
  }
}

//Constructor voor scherm met poules
class PoulesOverview extends StatefulWidget {
  final String serverIP;
  const PoulesOverview({Key? key, required this.serverIP}) : super(key: key);

  @override
  _PoulesOverviewState createState() => _PoulesOverviewState();
}

//Scherm met poules
class _PoulesOverviewState extends State<PoulesOverview> {
  String serverAddressObj = '';

  @override
  void initState() {
    super.initState();
    connectWebsocket();
  }

  void connectWebsocket() {
    /*socket.onConnect((_) => () {
      socket.sendBuffer = [];
    });*/
    socket.on('pouleInfo', (data) => updatePouleInfo(data));
    socket.on('settingsUpdate', (data) => updateSettings(data));
    socket.emit('allPouleInfoRequest', 'plsGeef');
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
      print(data);
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

  void updateSettings(data) {
    Map<String, dynamic> jsonData = jsonDecode(data);
    gameInfoClass.pouleScore = int.parse(jsonData['pouleScore']);
    gameInfoClass.pouleLegs = int.parse(jsonData['pouleLegs']);
    gameInfoClass.quartScore = int.parse(jsonData['quartScore']);
    gameInfoClass.quartLegs = int.parse(jsonData['quartLegs']);
    gameInfoClass.halfScore = int.parse(jsonData['halfScore']);
    gameInfoClass.halfLegs = int.parse(jsonData['halfLegs']);
    gameInfoClass.finalScore = int.parse(jsonData['finalScore']);
    gameInfoClass.finalLegs = int.parse(jsonData['finalLegs']);
    print("Updated game settings:");
    print(gameInfoClass.pouleLegs);
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
      MaterialPageRoute(builder: (BuildContext context) => const StartScreen()),
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
        scaffoldBackgroundColor: const Color(BACKGROUND_COLOR),
      ),
      home: Builder(builder: (context) {
        return Scaffold(
          appBar: AppBar(
            title: const Text('Poules'),
            backgroundColor: const Color(PRIMARY_COLOR),
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
                    primary: const Color(DEFAULT_BTN_COLOR),
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

//Constructor voor scherm met poule wedstrijden
class PouleScreen extends StatefulWidget {
  const PouleScreen({Key? key}) : super(key: key);

  @override
  _PouleScreenState createState() => _PouleScreenState();
}

//Scherm met poule wedstrijden
class _PouleScreenState extends State<PouleScreen> {
  List<PouleRanking> rankings = [];
  List<PouleGames> games = [];
  @override
  void initState() {
    super.initState();
    if (activePoule != 'Finales') {
      socket.off('finalsInfo');
      socket.on('poule${activePoule}Ranks', (data) => updateRanks(data));
      socket.emit('poule${activePoule}InfoRequest', 'plsGeef');
    } else {
      socket.off('poule${activePoule}Ranks');
      socket.on('finalsInfo', (data) => updateFinals(data));
      socket.emit('finalsInfoRequest', 'plsGeef');
    }
  }

  void updateRanks(data) {
    rankings.clear();
    for (var i = 0; i < data[0].length; i++) {
      print(data[0][i]);
      rankings.add(PouleRanking(
          playerName: data[0][i]['name'].toString(),
          points: data[0][i]['legsWon'].toString(),
          pointsDiff: data[0][i]['hiddenPoints'].toString()));
    }

    games.clear();
    print('Checking: ${data[1]}');
    for (var i = 0; i < data[1].length; i++) {
      String gameID = activePoule + (i + 1).toString();
      print("GameID: $gameID");
      games.add(PouleGames(
          gameID: gameID,
          player1: data[1][i][0],
          player2: data[1][i][1],
          gamePlayed: data[1][i][2],
          gameType: data[2]));
    }
    setState(() {});
  }

  void updateFinals(data) {
    games.clear();
    for (var i = 0; i < data.length; i++) {
      String gameID = data[i][0];
      games.add(
        PouleGames(
            gameID: gameID,
            player1: data[i][1],
            player2: data[i][2],
            gamePlayed: data[i][3],
            gameType: data[i][4]),
      );
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
        scaffoldBackgroundColor: const Color(BACKGROUND_COLOR),
      ),
      home: Builder(
        builder: (context) {
          return Scaffold(
            appBar: AppBar(
              title: getPouleName(activePoule),
              backgroundColor: const Color(PRIMARY_COLOR),
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
                          horizontalInside:
                              BorderSide(color: Color(0xFFE46800)),
                          verticalInside: BorderSide(color: Color(0xFFE46800))),
                      //defaultColumnWidth: const FixedColumnWidth(100),
                      columnWidths: const {
                        0: FixedColumnWidth(100),
                        1: FixedColumnWidth(70),
                        2: FixedColumnWidth(140)
                      },
                      children: [
                        const TableRow(children: <Widget>[
                          Center(
                            child: Text(
                              "Speler",
                              style:
                                  TextStyle(color: Colors.white, fontSize: 20),
                            ),
                          ),
                          Center(
                            child: Text(
                              "Score",
                              style:
                                  TextStyle(color: Colors.white, fontSize: 20),
                            ),
                          ),
                          Center(
                            child: Text(
                              "Puntensaldo",
                              style:
                                  TextStyle(color: Colors.white, fontSize: 20),
                            ),
                          )
                        ]),
                        ...rankings.map(
                          (currentPlayer) {
                            var index = rankings.indexOf(currentPlayer);
                            return TableRow(
                              children: [
                                Center(
                                  child: Text(
                                    currentPlayer.playerName,
                                    style: TextStyle(
                                        color: index < 2
                                            ? rankingColors[index]
                                            : rankingColors[2]),
                                  ),
                                ),
                                Center(
                                  child: Text(
                                    currentPlayer.points,
                                    style: TextStyle(
                                        color: index < 2
                                            ? rankingColors[index]
                                            : rankingColors[2]),
                                  ),
                                ),
                                Center(
                                  child: Text(
                                    currentPlayer.pointsDiff,
                                    style: TextStyle(
                                        color: index < 2
                                            ? rankingColors[index]
                                            : rankingColors[2]),
                                  ),
                                )
                              ],
                            );
                          },
                        ).toList(),
                      ]),
                  Expanded(
                    child: ListView(
                      shrinkWrap: true,
                      scrollDirection: Axis.vertical,
                      children: <Widget>[
                        Column(
                          children: games.map((currentGame) {
                            return IgnorePointer(
                              ignoring: currentGame.gamePlayed,
                              child: Container(
                                width: 52.08 * horizontalScaling,
                                height: 7.35 * verticalScaling,
                                padding: const EdgeInsets.fromLTRB(0, 10, 0, 0),
                                child: ElevatedButton(
                                    style: ElevatedButton.styleFrom(
                                      primary: currentGame.gamePlayed
                                          ? const Color(0xFF202020)
                                          : const Color(DEFAULT_BTN_COLOR),
                                    ),
                                    onPressed: () {
                                      if (!currentGame.gamePlayed) {
                                        gamePressed(currentGame, context);
                                      }
                                    },
                                    child: AutoSizeText(
                                        '${currentGame.player1} - ${currentGame.player2}',
                                        maxLines: 1,
                                        style: TextStyle(
                                            color: currentGame.gamePlayed
                                                ? Colors.grey
                                                : Colors.white,
                                            fontSize: 20))),
                              ),
                            );
                          }).toList(),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

//Leeg scherm waar puntentelling in wordt geplaatst
class PouleGame extends StatelessWidget {
  final PouleGames game;
  const PouleGame({Key? key, required this.game}) : super(key: key);

  void backPressed(context) {
    showDialog(
      context: context,
      builder: (BuildContext context) => AlertDialog(
        title: const Text("Wedstrijd sluiten"),
        content: const Text(
            "Weet je zeker dat je de wedstrijd wil sluiten?\nAlle voortgang wordt verwijderd."),
        actions: <Widget>[
          TextButton(
            onPressed: () {
              Navigator.pop(context, 'Cancel');
            },
            child: const Text("Annuleren"),
          ),
          TextButton(
            onPressed: () {
              stopCurrentGame();
              Navigator.of(context).push(
                MaterialPageRoute(
                    builder: (BuildContext context) => const PouleScreen()),
              );
            },
            child: const Text("Wedstrijd sluiten"),
          ),
        ],
      ),
    );
  }

  void stopCurrentGame() {
    gameActive = false;
    String msg = game.gameID;
    socket.emit('stopActiveGame', msg);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
        theme: ThemeData(
          scaffoldBackgroundColor: const Color(BACKGROUND_COLOR),
        ),
        home: Builder(builder: (context) {
          return Scaffold(
            appBar: AppBar(
              title: const Text('Wedstrijd'),
              centerTitle: true,
              backgroundColor: const Color(PRIMARY_COLOR),
              leading: IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () {
                  backPressed(context);
                },
              ),
            ),
            //Kiezen wie begint en de puntentelling moeten op hetzelfde scherm
            //gebeuren. Dit wordt conditioneel geregeld, dus de body moet kunnen
            //worden aangepast. Body is dus een widget die z'n content aanpast.
            body: PouleGameBody(game: game, context: context),
          );
        }));
  }
}

//Constructor voor puntentel en beginner keuze scherm
class PouleGameBody extends StatefulWidget {
  final PouleGames game;
  final BuildContext context;
  const PouleGameBody({Key? key, required this.game, required this.context})
      : super(key: key);

  @override
  _PouleGameBodyState createState() => _PouleGameBodyState();
}

//Puntentel en beginner keuze scherm
class _PouleGameBodyState extends State<PouleGameBody> {
  late PlayerClass player1;
  late PlayerClass player2;
  ChosenPlayerEnum chosenPlayer = activeStartingPlayer;
  var specialBtnStyle = cBtnStyle;
  bool gameStarted = false;
  int setsToPlay = 0;
  int legsToPlay = 0;
  String specialBtnText = 'C';
  int numDarts = 3;

  @override
  void initState() {
    super.initState();
    player1 = PlayerClass(widget.game.player1);
    player2 = PlayerClass(widget.game.player2);
    activeGameInfo.clear();
    activeGameInfo.add(widget.game.gameID);
    if (widget.game.gameType == 'poule') {
      player2.currentScore = player1.currentScore = gameInfoClass.pouleScore;
      activeGameInfo.add(gameInfoClass.pouleScore);
      legsToPlay = gameInfoClass.pouleLegs;
    } else if (widget.game.gameType == 'quart') {
      player2.currentScore = player1.currentScore = gameInfoClass.quartScore;
      activeGameInfo.add(gameInfoClass.quartScore);
      legsToPlay = gameInfoClass.quartLegs;
    } else if (widget.game.gameType == 'half') {
      player2.currentScore = player1.currentScore = gameInfoClass.halfScore;
      activeGameInfo.add(gameInfoClass.halfScore);
      legsToPlay = gameInfoClass.halfLegs;
    } else {
      player2.currentScore = player1.currentScore = gameInfoClass.finalScore;
      activeGameInfo.add(gameInfoClass.finalScore);
      legsToPlay = gameInfoClass.finalLegs;
    }
    activeGameInfo.add(player1.currentScore);
    activeGameInfo.add(player2.currentScore);
    activeGameInfo.add(player1.legsWon);
    activeGameInfo.add(player1.setsWon);
    activeGameInfo.add(player2.legsWon);
    activeGameInfo.add(player2.setsWon);
    activeGameInfo.add(legsToPlay);
    activeGameInfo.add(setsToPlay);
    print(widget.game.gameID);
    activeStartingPlayer = ChosenPlayerEnum.undefined;
    chosenPlayer = activeStartingPlayer;

    socket.onConnect((_) => () {
          if (gameActive) {
            sendCurrentScores(true);
          }
          socket.sendBuffer = [];
        });
  }

  void btnPress(String btnType) {
    PlayerClass activePlayer;
    PlayerClass otherPlayer;
    if (player1.myTurn) {
      activePlayer = player1;
      otherPlayer = player2;
    } else {
      activePlayer = player2;
      otherPlayer = player1;
    }

    switch (btnType) {
      case 'OK':
        if (activePlayer.thrownScore == '') {
          ScaffoldMessenger.of(widget.context).showSnackBar(
            const SnackBar(content: Text("Geen score ingevuld")),
          );
          break;
        } else if (activePlayer.thrownScore == 'BUST') {
          activePlayer.dartsThrown += numDarts;
          activePlayer.scoresThrownHistory.add(0);
          otherPlayer.thrownScore = '';
          activePlayer.myTurn = false;
        } else {
          if (int.parse(activePlayer.thrownScore) > 180 ||
              int.parse(activePlayer.thrownScore) > activePlayer.currentScore) {
            ScaffoldMessenger.of(widget.context).showSnackBar(
              SnackBar(
                content: Text('${activePlayer.thrownScore} is te hoog'),
                duration: const Duration(seconds: 5),
              ),
            );
            break;
          } else if (int.parse(activePlayer.thrownScore) / numDarts > 60) {
            ScaffoldMessenger.of(widget.context).showSnackBar(
              SnackBar(
                content: Text((numDarts == 1)
                    ? '${activePlayer.thrownScore} kan niet met $numDarts pijl gegooid worden.'
                    : '${activePlayer.thrownScore} kan niet met $numDarts pijlen gegooid worden.'),
                duration: const Duration(seconds: 5),
              ),
            );
            break;
          } else if (activePlayer.currentScore -
                  int.parse(activePlayer.thrownScore) ==
              1) {
            ScaffoldMessenger.of(widget.context).showSnackBar(
              SnackBar(
                content: Text(
                    "${activePlayer.thrownScore} kan niet gegooid worden."),
                duration: const Duration(seconds: 5),
              ),
            );
            break;
          } else if (activePlayer.thrownScore != '0') {
            activePlayer.dartsThrown += numDarts;
            activePlayer.dartsThrownHistory.add(numDarts);
            activePlayer.scoresThrownHistory
                .add(int.parse(activePlayer.thrownScore));
            if (activePlayer.currentScore ==
                int.parse(activePlayer.thrownScore)) {
              endLeg(activePlayer.name, activePlayer);
            } else {
              activePlayer.currentScore -= int.parse(activePlayer.thrownScore);
              activePlayer.myTurn = false;
              otherPlayer.myTurn = true;
              otherPlayer.thrownScore = '';
            }
          } else {
            activePlayer.myTurn = false;
            activePlayer.scoresThrownHistory
                .add(int.parse(activePlayer.thrownScore));
            activePlayer.dartsThrown += numDarts;
            activePlayer.dartsThrownHistory.add(numDarts);
            otherPlayer.thrownScore = '';
            otherPlayer.myTurn = true;
          }
          activePlayer.turnsThisGame += 1;
          activePlayer.turnsThisLeg += 1;
          activePlayer.totalPointsThisLeg +=
              int.parse(activePlayer.thrownScore);
          activePlayer.totalPointsThisGame +=
              int.parse(activePlayer.thrownScore);

          sendCurrentScores(false,
              thrownScore: int.parse(activePlayer.thrownScore));
          if (170 - activePlayer.currentScore >= 0) {
            activePlayer.possibleOut =
                possibleOuts[170 - activePlayer.currentScore];
          } else {
            activePlayer.possibleOut = '';
          }
        }
        numDarts = 3;
        break;
      case 'C':
        activePlayer.thrownScore = '';
        break;
      case 'BUST':
        if (activePlayer.thrownScore == '') {
          activePlayer.thrownScore = 'BUST';
          activePlayer.dartsThrown += numDarts;
          activePlayer.scoresThrownHistory.add(0);
          activePlayer.turnsThisLeg += 1;
          activePlayer.turnsThisGame += 1;
          otherPlayer.thrownScore = '';
          activePlayer.myTurn = false;
          otherPlayer.myTurn = true;
          sendCurrentScores(false);
        }
        break;
      case 'ST':
        if (activePlayer.thrownScore == '') {
          if (activePlayer.currentScore < 26) {
            ScaffoldMessenger.of(widget.context).showSnackBar(
              const SnackBar(content: Text('Standaard is te hoog')),
            );
            otherPlayer.thrownScore = '';
          } else {
            activePlayer.dartsThrown += numDarts;
            activePlayer.dartsThrownHistory.add(numDarts);
            activePlayer.turnsThisGame += 1;
            activePlayer.turnsThisLeg += 1;
            activePlayer.scoresThrownHistory.add(26);
            if (activePlayer.currentScore == 26) {
              endLeg(activePlayer.name, activePlayer);
            } else {
              activePlayer.thrownScore = 'Standaard';
              activePlayer.currentScore -= 26;
              activePlayer.totalPointsThisGame += 26;
              activePlayer.totalPointsThisLeg += 26;
              otherPlayer.thrownScore = '';
              activePlayer.myTurn = false;
              otherPlayer.myTurn = true;
            }
            sendCurrentScores(false, thrownScore: 26);
            if (170 - activePlayer.currentScore >= 0) {
              activePlayer.possibleOut =
                  possibleOuts[170 - activePlayer.currentScore];
            } else {
              activePlayer.possibleOut = '';
            }
          }
        }
        break;
      default:
        if ((activePlayer.thrownScore + btnType).toString().length > 3) {
          break;
        } else {
          if (activePlayer.thrownScore == '0') {
            activePlayer.thrownScore == btnType;
          } else {
            activePlayer.thrownScore = activePlayer.thrownScore + btnType;
          }
        }
        break;
    }

    player1.legAverage = player1.totalPointsThisLeg / player1.turnsThisLeg;
    if (player1.legAverage.toStringAsFixed(1) == "NaN") {
      player1.legAverage = 0;
    }

    player1.gameAverage = player1.totalPointsThisGame / player1.turnsThisGame;
    if (player1.gameAverage.toStringAsFixed(1) == "NaN") {
      player1.gameAverage = 0;
    }

    player2.legAverage = player2.totalPointsThisLeg / player2.turnsThisLeg;
    if (player2.legAverage.toStringAsFixed(1) == "NaN") {
      player2.legAverage = 0;
    }

    player2.gameAverage = player2.totalPointsThisGame / player2.turnsThisGame;
    if (player2.gameAverage.toStringAsFixed(1) == "NaN") {
      player2.gameAverage = 0;
    }
    setState(() {
      null;
    });
  }

  void endGame(String winner, PlayerClass winnerType) {
    showDialog<String>(
      context: widget.context,
      barrierDismissible: false,
      builder: (BuildContext context) => AlertDialog(
        title: Text("Heeft $winner de wedstrijd gewonnen?"),
        actions: <Widget>[
          TextButton(
            onPressed: () {
              resetLastScore(winnerType, resetScore: false);
              winnerType.legsWon -= 1;
              Navigator.pop(context, 'Cancel');
            },
            child: const Text("Annuleren"),
          ),
          TextButton(
            onPressed: () {
              sendCurrentScores(true);
              String msg =
                  "${widget.game.gameID},${player1.legsWon.toString()},${player1.gameAverage},${player1.dartsThrown},${player2.legsWon.toString()},${player2.gameAverage},${player2.dartsThrown}";
              socket.emit('gamePlayed', msg);
              activeStartingPlayer = ChosenPlayerEnum.undefined;
              gameStarted = false;
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

  void endLeg(String winnerName, PlayerClass winnerType) {
    showDialog<String>(
      context: widget.context,
      barrierDismissible: false,
      builder: (BuildContext context) => AlertDialog(
        title: Text("Heeft $winnerName de leg gewonnen?"),
        content: Text(
            "$winnerName heeft de leg in ${winnerType.dartsThrown.toString()} darts uitgegooid."),
        actions: <Widget>[
          TextButton(
            onPressed: () {
              sendCurrentScores(true);
              resetLastScore(winnerType, resetScore: false);
              Navigator.pop(context, 'Cancel');
            },
            child: const Text("Annuleren"),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context, 'Bevestigd');
              winnerType.legsWon++;
              if (winnerType.legsWon > (legsToPlay - winnerType.legsWon)) {
                sendCurrentScores(true);
                endGame(winnerName, winnerType);
              } else {
                resetGame();
              }
            },
            child: const Text("Bevestigen"),
          ),
        ],
      ),
    );
  }

  void resetGame() {
    player1.currentScore = activeGameInfo[1];
    player1.possibleOut = '';
    player1.thrownScore = '';
    player1.dartsThrown = 0;
    player1.scoresThrownHistory.clear();
    player1.legAverage = 0;
    player1.turnsThisLeg = 0;
    player1.totalPointsThisLeg = 0;
    player2.currentScore = activeGameInfo[1];
    player2.possibleOut = '';
    player2.thrownScore = '';
    player2.dartsThrown = 0;
    player2.legAverage = 0;
    player2.turnsThisLeg = 0;
    player2.totalPointsThisLeg = 0;
    player2.scoresThrownHistory.clear();
    numDarts = 3;

    int legsPlayed = player1.legsWon + player2.legsWon;

    print("${legsPlayed % 2} | $chosenPlayer");

    if (legsPlayed % 2 == 0) {
      if (chosenPlayer == ChosenPlayerEnum.player1) {
        player1.myTurn = true;
        player2.myTurn = false;
      } else {
        player2.myTurn = true;
        player1.myTurn = false;
      }
    } else {
      if (chosenPlayer == ChosenPlayerEnum.player1) {
        player2.myTurn = true;
        player1.myTurn = false;
      } else {
        player1.myTurn = true;
        player2.myTurn = false;
      }
    }
    player1.myTurn
        ? activeStartingPlayer = ChosenPlayerEnum.player1
        : activeStartingPlayer = ChosenPlayerEnum.player2;
    sendCurrentScores(true);
    setState(() {
      null;
    });
  }

  void resetLastScore(PlayerClass player, {bool resetScore = true}) {
    if (player.scoresThrownHistory.isNotEmpty) {
      player.totalPointsThisGame -= player.scoresThrownHistory.last;
      player.totalPointsThisLeg -= player.scoresThrownHistory.last;

      if (resetScore) {
        player.currentScore += player.scoresThrownHistory.removeLast();
      }

      player.turnsThisGame -= 1;
      player.turnsThisLeg -= 1;
      player.legAverage = player.totalPointsThisLeg / player.turnsThisLeg;
      if (player.legAverage.toStringAsFixed(1) == "NaN") {
        player.legAverage = 0;
      }

      player.gameAverage = player.totalPointsThisGame / player.turnsThisGame;
      if (player.gameAverage.toStringAsFixed(1) == "NaN") {
        player.gameAverage = 0;
      }

      if (player.dartsThrownHistory.isNotEmpty) {
        player.dartsThrown -= player.dartsThrownHistory.removeLast();
      }

      player.thrownScore = '';
      if (170 - player.currentScore >= 0) {
        player.possibleOut = possibleOuts[170 - player.currentScore];
      } else {
        player.possibleOut = '';
      }
      numDarts = 3;
      player1.myTurn = false; //onbekend welke speler gereset wordt, dus beide
      player2.myTurn = false; //spelers niet de beurt geven om vervolgens
      player.myTurn = true; //de juiste speler wel de beurt te geven.
    }
    sendCurrentScores(true);
    setState(() {
      null;
    });
  }

  void sendCurrentScores(bool dontPlaySound, {int thrownScore = 0}) {
    int startingPlayer;
    if (activeStartingPlayer == ChosenPlayerEnum.player1) {
      startingPlayer = 0;
    } else {
      startingPlayer = 1;
    }
    String msg =
        '${widget.game.gameID},${player1.currentScore},${player1.legsWon},${player1.dartsThrown},${player2.currentScore},${player2.legsWon},${player2.dartsThrown},${player1.myTurn},$startingPlayer';

    if (!dontPlaySound) {
      msg += ',$thrownScore';
    }

    print(msg);
    socket.emit('activeGameInfo', msg);
  }

  Widget bodyContainer() {
    if (!gameStarted) {
      activeStartingPlayer = chosenPlayer;
      switch (chosenPlayer) {
        case ChosenPlayerEnum.player1:
          gameActive = gameStarted = true;
          return playerChosen(widget.game.player1);
        case ChosenPlayerEnum.player2:
          gameActive = gameStarted = true;
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
          Table(
            defaultColumnWidth: const FlexColumnWidth(),
            defaultVerticalAlignment: TableCellVerticalAlignment.middle,
            children: [
              TableRow(
                children: <Widget>[
                  Center(
                    child: AutoSizeText(
                      widget.game.player1 +
                          ' (${player1.dartsThrown.toString()})',
                      maxLines: 1,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 5.21 * horizontalScaling,
                      ),
                    ),
                  ),
                  Table(
                    defaultColumnWidth:
                        FixedColumnWidth(7.81 * horizontalScaling),
                    children: [
                      TableRow(children: <Widget>[
                        Center(
                          child: AutoSizeText(
                            player1.legsWon.toString(),
                            maxLines: 1,
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 5.21 * horizontalScaling,
                            ),
                          ),
                        ),
                        Center(
                          child: AutoSizeText(
                            "Legs",
                            maxLines: 1,
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 5.21 * horizontalScaling,
                            ),
                          ),
                        ),
                        Center(
                          child: AutoSizeText(
                            player2.legsWon.toString(),
                            maxLines: 1,
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 5.21 * horizontalScaling,
                            ),
                          ),
                        ),
                      ]),
                    ],
                  ),
                  Center(
                    child: AutoSizeText(
                      widget.game.player2 +
                          ' (${player2.dartsThrown.toString()})',
                      maxLines: 1,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 5.21 * horizontalScaling,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
          Table(
            defaultColumnWidth: const FlexColumnWidth(),
            children: [
              TableRow(children: <Widget>[
                Center(
                  child: AutoSizeText(
                    player1.currentScore.toString(),
                    maxLines: 1,
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 20.83 * horizontalScaling),
                  ),
                ),
                Center(
                  child: AutoSizeText(
                    player2.currentScore.toString(),
                    maxLines: 1,
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 20.83 * horizontalScaling),
                  ),
                ),
              ]),
              TableRow(children: <Widget>[
                Center(
                    child: SizedBox(
                  height: 2.45 * verticalScaling,
                )),
                Center(
                    child: SizedBox(
                  height: 2.45 * verticalScaling,
                )),
              ]),
              TableRow(children: <Widget>[
                Center(
                  child: Text(
                    player1.possibleOut,
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 5.21 * horizontalScaling),
                  ),
                ),
                Center(
                  child: Text(
                    player2.possibleOut,
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 5.21 * horizontalScaling),
                  ),
                ),
              ]),
              TableRow(children: <Widget>[
                Center(
                    child: SizedBox(
                  height: 2.45 * verticalScaling,
                )),
                Center(
                    child: SizedBox(
                  height: 2.45 * verticalScaling,
                )),
              ]),
              TableRow(children: <Widget>[
                Center(
                  child: Container(
                    color: const Color(BACKGROUND_COLOR),
                    alignment: Alignment.center,
                    child: Center(
                      child: AutoSizeText(
                        'wg: ${player1.gameAverage.toStringAsFixed(1)} | lg: ${player1.legAverage.toStringAsFixed(1)}',
                        maxLines: 1,
                        style: const TextStyle(
                          color: Color(0xFFFFFFFF),
                          fontSize: 15,
                        ),
                      ),
                    ),
                  ),
                ),
                Center(
                  child: Container(
                    color: const Color(BACKGROUND_COLOR),
                    alignment: Alignment.center,
                    child: Center(
                      child: AutoSizeText(
                        'wg: ${player2.gameAverage.toStringAsFixed(1)} | lg: ${player2.legAverage.toStringAsFixed(1)}',
                        maxLines: 1,
                        style: const TextStyle(
                          color: Color(0xFFFFFFFF),
                          fontSize: 15,
                        ),
                      ),
                    ),
                  ),
                ),
              ]),
              TableRow(children: <Widget>[
                SizedBox(
                  height: 1.23 * verticalScaling,
                ),
                SizedBox(
                  height: 1.23 * verticalScaling,
                ),
              ]),
              TableRow(children: <Widget>[
                Center(
                  child: SizedBox(
                    width: 52.08 * horizontalScaling,
                    height: 7.35 * verticalScaling,
                    child: Container(
                      color: player1.myTurn
                          ? Colors.white
                          : const Color(0xFF303030),
                      alignment: Alignment.center,
                      child: Center(
                        child: AutoSizeText(
                          player1.myTurn
                              ? player1.thrownScore
                              : 'Laatste: ${player1.thrownScore}',
                          maxLines: 1,
                          style: TextStyle(
                            color: player1.myTurn
                                ? Colors.black
                                : const Color.fromARGB(255, 138, 138, 138),
                            fontSize: player1.myTurn ? 30 : 20,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                Center(
                  child: SizedBox(
                    width: 52.08 * horizontalScaling,
                    height: 7.35 * verticalScaling,
                    child: Container(
                      color: player1.myTurn
                          ? const Color(0xFF303030)
                          : Colors.white,
                      alignment: Alignment.center,
                      child: Center(
                        child: AutoSizeText(
                          player1.myTurn
                              ? 'Laatste: ${player2.thrownScore}'
                              : player2.thrownScore,
                          maxLines: 1,
                          style: TextStyle(
                            color: player1.myTurn
                                ? const Color.fromARGB(255, 138, 138, 138)
                                : Colors.black,
                            fontSize: player1.myTurn ? 20 : 30,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ]),
            ],
          ),
          SizedBox(
            height: 1.23 * verticalScaling,
          ),
          Expanded(
            child: ListView(
              children: <Widget>[
                Row(
                  mainAxisAlignment: MainAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: 2.60 * horizontalScaling,
                    ),
                    SizedBox(
                      width: numBtnWidth * horizontalScaling,
                      height: numBtnHeigth * verticalScaling,
                      child: ElevatedButton(
                          style: numBtnStyle,
                          onPressed: () {
                            btnPress('1');
                          },
                          child: Text(
                            '1',
                            style:
                                TextStyle(fontSize: 5.21 * horizontalScaling),
                          )),
                    ),
                    SizedBox(
                      width: numBtnWidth * horizontalScaling,
                      height: numBtnHeigth * verticalScaling,
                      child: ElevatedButton(
                          style: numBtnStyle,
                          onPressed: () {
                            btnPress('2');
                          },
                          child: Text(
                            '2',
                            style:
                                TextStyle(fontSize: 5.21 * horizontalScaling),
                          )),
                    ),
                    SizedBox(
                      width: numBtnWidth * horizontalScaling,
                      height: numBtnHeigth * verticalScaling,
                      child: ElevatedButton(
                          style: numBtnStyle,
                          onPressed: () {
                            btnPress('3');
                          },
                          child: Text(
                            '3',
                            style:
                                TextStyle(fontSize: 5.21 * horizontalScaling),
                          )),
                    ),
                    SizedBox(
                      width: sideBtnWidth * horizontalScaling,
                      height: sideBtnHeigth * verticalScaling,
                      child: ElevatedButton(
                        style: sideBtnStyle,
                        onPressed: () {
                          if (player1.myTurn) {
                            resetLastScore(player2);
                          } else {
                            resetLastScore(player1);
                          }
                        },
                        child: const Icon(Icons.replay_outlined),
                      ),
                    ),
                  ],
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: 2.60 * horizontalScaling,
                    ),
                    SizedBox(
                      width: numBtnWidth * horizontalScaling,
                      height: numBtnHeigth * verticalScaling,
                      child: ElevatedButton(
                          style: numBtnStyle,
                          onPressed: () {
                            btnPress('4');
                          },
                          child: Text(
                            '4',
                            style:
                                TextStyle(fontSize: 5.21 * horizontalScaling),
                          )),
                    ),
                    SizedBox(
                      width: numBtnWidth * horizontalScaling,
                      height: numBtnHeigth * verticalScaling,
                      child: ElevatedButton(
                          style: numBtnStyle,
                          onPressed: () {
                            btnPress('5');
                          },
                          child: Text(
                            '5',
                            style:
                                TextStyle(fontSize: 5.21 * horizontalScaling),
                          )),
                    ),
                    SizedBox(
                      width: numBtnWidth * horizontalScaling,
                      height: numBtnHeigth * verticalScaling,
                      child: ElevatedButton(
                          style: numBtnStyle,
                          onPressed: () {
                            btnPress('6');
                          },
                          child: Text(
                            '6',
                            style:
                                TextStyle(fontSize: 5.21 * horizontalScaling),
                          )),
                    ),
                    SizedBox(
                      width: sideBtnWidth * horizontalScaling,
                      height: sideBtnHeigth * verticalScaling,
                      child: IgnorePointer(
                        ignoring: true,
                        child: ElevatedButton(
                          style: sideBtnStyle,
                          onPressed: () {
                            null;
                          },
                          child: const Padding(
                            padding: EdgeInsets.all(0.0),
                            child: AutoSizeText(
                              "Darts",
                              maxLines: 1,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: 2.60 * horizontalScaling,
                    ),
                    SizedBox(
                      width: numBtnWidth * horizontalScaling,
                      height: numBtnHeigth * verticalScaling,
                      child: ElevatedButton(
                          style: numBtnStyle,
                          onPressed: () {
                            btnPress('7');
                          },
                          child: Text(
                            '7',
                            style:
                                TextStyle(fontSize: 5.21 * horizontalScaling),
                          )),
                    ),
                    SizedBox(
                      width: numBtnWidth * horizontalScaling,
                      height: numBtnHeigth * verticalScaling,
                      child: ElevatedButton(
                          style: numBtnStyle,
                          onPressed: () {
                            btnPress('8');
                          },
                          child: Text(
                            '8',
                            style:
                                TextStyle(fontSize: 5.21 * horizontalScaling),
                          )),
                    ),
                    SizedBox(
                      width: numBtnWidth * horizontalScaling,
                      height: numBtnHeigth * verticalScaling,
                      child: ElevatedButton(
                          style: numBtnStyle,
                          onPressed: () {
                            btnPress('9');
                          },
                          child: Text(
                            '9',
                            style:
                                TextStyle(fontSize: 5.21 * horizontalScaling),
                          )),
                    ),
                    SizedBox(
                      width: sideBtnWidth * horizontalScaling,
                      height: sideBtnHeigth * verticalScaling,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          shape: const RoundedRectangleBorder(
                            borderRadius: BorderRadius.all(Radius.zero),
                          ),
                          elevation: 0,
                          shadowColor: Colors.transparent,
                          primary: (numDarts == 1)
                              ? Colors.grey[700]
                              : Colors.grey[850],
                        ),
                        onPressed: () {
                          numDarts = 1;
                          setState(() {
                            null;
                          });
                        },
                        child: const Padding(
                          padding: EdgeInsets.all(0.0),
                          child: AutoSizeText(
                            "1",
                            maxLines: 2,
                            minFontSize: 14,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: 2.60 * horizontalScaling,
                    ),
                    SizedBox(
                      width: numBtnWidth * horizontalScaling,
                      height: numBtnHeigth * verticalScaling,
                      child: ElevatedButton(
                          style: specialBtnStyle,
                          onPressed: () {
                            btnPress(specialBtnText);
                          },
                          child: Text(
                            specialBtnText,
                            style:
                                TextStyle(fontSize: 5.21 * horizontalScaling),
                          )),
                    ),
                    SizedBox(
                      width: numBtnWidth * horizontalScaling,
                      height: numBtnHeigth * verticalScaling,
                      child: ElevatedButton(
                          style: numBtnStyle,
                          onPressed: () {
                            btnPress('0');
                          },
                          child: Text(
                            '0',
                            style:
                                TextStyle(fontSize: 5.21 * horizontalScaling),
                          )),
                    ),
                    SizedBox(
                      width: numBtnWidth * horizontalScaling,
                      height: numBtnHeigth * verticalScaling,
                      child: ElevatedButton(
                          style: okBtnStyle,
                          onPressed: () {
                            btnPress('OK');
                          },
                          child: Text(
                            'OK',
                            style:
                                TextStyle(fontSize: 5.21 * horizontalScaling),
                          )),
                    ),
                    SizedBox(
                      width: sideBtnWidth * horizontalScaling,
                      height: sideBtnHeigth * verticalScaling,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          shape: const RoundedRectangleBorder(
                            borderRadius: BorderRadius.all(Radius.zero),
                          ),
                          elevation: 0,
                          shadowColor: Colors.transparent,
                          primary: (numDarts == 2)
                              ? Colors.grey[700]
                              : Colors.grey[850],
                        ),
                        onPressed: () {
                          numDarts = 2;
                          setState(() {
                            null;
                          });
                        },
                        child: const Padding(
                          padding: EdgeInsets.all(0.0),
                          child: AutoSizeText(
                            "2",
                            maxLines: 2,
                            minFontSize: 14,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: 2.60 * horizontalScaling,
                    ),
                    SizedBox(
                      width: 78.13 * horizontalScaling,
                      height: 7.35 * verticalScaling,
                      child: ElevatedButton(
                        style: numBtnStyle,
                        onPressed: () {
                          btnPress('ST');
                        },
                        child: Text(
                          "Standaard",
                          style: TextStyle(
                            fontSize: 5.21 * horizontalScaling,
                          ),
                        ),
                      ),
                    ),
                    SizedBox(
                      width: sideBtnWidth * horizontalScaling,
                      height: sideBtnHeigth * verticalScaling,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          shape: const RoundedRectangleBorder(
                            borderRadius: BorderRadius.all(Radius.zero),
                          ),
                          elevation: 0,
                          shadowColor: Colors.transparent,
                          primary: (numDarts == 3)
                              ? Colors.grey[700]
                              : Colors.grey[850],
                        ),
                        onPressed: () {
                          numDarts = 3;
                          setState(() {
                            null;
                          });
                        },
                        child: const Padding(
                          padding: EdgeInsets.all(0.0),
                          child: AutoSizeText(
                            "3",
                            maxLines: 2,
                            minFontSize: 14,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
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
                      activeStartingPlayer = chosenPlayer;
                      player1.myTurn = true;
                      player2.myTurn = false;
                      sendCurrentScores(true);
                    });
                  },
                  child: Text(
                    widget.game.player1,
                    style: const TextStyle(fontSize: 20),
                  ),
                  style: ElevatedButton.styleFrom(
                    primary: const Color(DEFAULT_BTN_COLOR),
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
                      activeStartingPlayer = chosenPlayer;
                      player1.myTurn = false;
                      player2.myTurn = true;
                      sendCurrentScores(true);
                    });
                  },
                  child: Text(
                    widget.game.player2,
                    style: const TextStyle(fontSize: 20),
                  ),
                  style: ElevatedButton.styleFrom(
                    primary: const Color(DEFAULT_BTN_COLOR),
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
    if ((player1.myTurn &&
            player1.currentScore <= 180 &&
            player1.thrownScore == '') ||
        (!player1.myTurn &&
            player2.currentScore < 180 &&
            player2.thrownScore == '')) {
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
