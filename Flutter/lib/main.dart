import 'dart:io';
import 'dart:convert';
import 'dart:async';
import 'package:flutter/material.dart';
// ignore: library_prefixes
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:auto_size_text/auto_size_text.dart';
import 'package:scan/scan.dart';
import 'package:Darttoernooi/size_config.dart';
import 'package:network_info_plus/network_info_plus.dart';
import 'package:google_fonts/google_fonts.dart';

String serverIP = '';
String activePoule = '';
List<String> pouleNames = [];
List gameInfo = [];
late int numPoules;
late IO.Socket socket;
enum ChosenPlayerEnum { player1, player2, undefined }
List activeGameInfo = [];
ChosenPlayerEnum activeStartingPlayer = ChosenPlayerEnum.undefined;
double numBtnWidth = 26.04;
double numBtnHeigth = 8.57;
double sideBtnWidth = 17.71;
double sideBtnHeigth = 8.58;
const PRIMARY_COLOR = 0xFF4A0000;
const DEFAULT_BTN_COLOR = 0xFF4A0000;
const BACKGROUND_COLOR = 0xFF181818;
bool firstStart = false;
bool gameActive = false;
double horizontalScaling = 0;
double verticalScaling = 0;
int serverPort = 11520;

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

var sideBtnStyle = ElevatedButton.styleFrom(
  shape: const RoundedRectangleBorder(
    borderRadius: BorderRadius.all(Radius.zero),
  ),
  elevation: 0,
  shadowColor: Colors.transparent,
  primary: Colors.grey[850],
);
var numBtnStyle = ElevatedButton.styleFrom(
  side: const BorderSide(
      color: Colors.black, width: 2.0, style: BorderStyle.solid),
  shape: const RoundedRectangleBorder(
    borderRadius: BorderRadius.all(Radius.zero),
  ),
  primary: Color(DEFAULT_BTN_COLOR),
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

class StartScreen extends StatefulWidget {
  const StartScreen({Key? key}) : super(key: key);

  @override
  _StartScreenState createState() => _StartScreenState();
}

class _StartScreenState extends State<StartScreen> {
  late BuildContext standardContext;
  late Timer connectionTimer;
  bool stopChecking = false;
  @override
  void initState() {
    startServerScanning();
    super.initState();
  }

  List<String> availableHosts = [];
  List<Widget> hostButtons = [];
  final ipAddressController = TextEditingController(text: serverIP);

  void startServerScanning() async {
    final info = NetworkInfo();
    var deviceIP = await info.getWifiIP();
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
          print("Received: $message");
          List<String> messageList = message.split(',');
          if (messageList[0] == 'serverName') {
            if (!availableHosts.contains(messageList[1])) {
              availableHosts.add(messageList[1]);
              hostButtons.add(
                  _hostButton(standardContext, messageList[1], messageList[2]));
              setState(() {});
            }
          } else if (messageList[0] == 'serverClose') {
            for (int i = 0; i < availableHosts.length; i++) {
              if (availableHosts[i] == messageList[1]) {
                availableHosts.removeAt(i);
                hostButtons.removeAt(i);
                setState(() {});
                break;
              }
            }
          }
        }
      });
      List<int> data = utf8.encode("serverNameRequest,$deviceIP");
      udpSocket.send(data, _destinationAddress, 8888);
      connectionTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
        udpSocket.send(data, _destinationAddress, 8889);
        if (stopChecking) {
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
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        Navigator.of(context).push(MaterialPageRoute(
            builder: (BuildContext context) =>
                PoulesOverview(serverIP: serverIP)));
      }
    });
  }

  void startQRScanner(BuildContext context) async {
    final result = await Navigator.push(
        context, MaterialPageRoute(builder: (context) => const qrScanScreen()));
    print(result);
    try {
      ipAddressController.text = result;
      enterIP(context, result);
    } catch (e) {
      print(e);
    }
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
    return MaterialApp(
      theme: ThemeData(
        scaffoldBackgroundColor: const Color(0xFF181818),
        textTheme: GoogleFonts.poppinsTextTheme(
          Theme.of(context).textTheme,
        )
      ),
      home: Builder(builder: (context) {
        standardContext = context;
        sizeConfig.init(context);
        horizontalScaling = sizeConfig.blockSizeHorizontal;
        verticalScaling = sizeConfig.blockSizeVertical;
        print("Horizontal scaling : $horizontalScaling");
        print("Vertical scaling: $verticalScaling");
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
                          suffixIcon: IconButton(
                              onPressed: () {
                                startQRScanner(context);
                              },
                              icon: const Icon(Icons.qr_code_scanner_rounded),
                              color: Colors.grey),
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
                  padding: const EdgeInsets.fromLTRB(50, 50, 50, 200),
                  child: Column(children: [
                    const AutoSizeText(
                      "Beschikbare wedstrijden:",
                      maxLines: 1,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                      ),
                    ),
                    hostButtons.isNotEmpty
                        ? Column(children: hostButtons)
                        : Image.asset('assets/loading.gif',
                            height: 70, width: 70),
                  ])),
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
            Text(
              "Verbinding maken met de computer",
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 7.3*horizontalScaling, color: Colors.white)
            ),
            Text(
              """De app zoekt automatisch naar een computer om mee te verbinden. Deze komen onder elkaar op het begin scherm te staan:""",
              style: TextStyle(color: Colors.white, fontSize: 4.87*horizontalScaling),
            ),
            Image.asset('assets/homeScreenApp.jpg', scale: 20/horizontalScaling),
            Text(
              """De naam van de computer (in dit voorbeeld Aloma) kan gecontroleerd worden op de computer. Druk op de drie streepjes rechtsboven. De naam van de compter staat bovenaan het menu dat verschijnt:
""",
              style: TextStyle(color: Colors.white, fontSize: 4.87*horizontalScaling),
            ),
            Image.asset("assets/computerNaam.png", scale: 5/horizontalScaling),
            Text(
              """Als er geen computers gevonden worden, zorg er dan voor dat:
- Er een wedstrijd actief is op een computer;
- De computer en de telefoon met hetzelfde netwerk verbonden zijn;
- Het programma op de computer minimaal versie 1.10.1 is.

Als dit allemaal goed is, maar de app nog steeds geen computers kan vinden, kan er altijd nog handmatig verbonden worden met de computer. Druk op de drie streepjes linksboven (op het begin scherm). Hier kan het IP-adres van de server ingevuld worden.
De app kan ook worden verbonden met een QR-code. Druk op het QR-code symbool:
              """,
              style: TextStyle(fontSize: 4.87*horizontalScaling, color: Colors.white),
            ),
            Image.asset('assets/qrBtnApp.png',scale: 5/horizontalScaling),
            Text(
              """
De QR-code kan gevonden worden door op de computer rechtsboven op de drie streepjes te drukken. Druk vervolgens op het QR-code symbool en de QR-code verschijnt:
              """,
              style: TextStyle(fontSize: 4.87*horizontalScaling, color: Colors.white),
            ),
            Image.asset('assets/qrBtnComputer.png', scale: 5/horizontalScaling),
            Image.asset('assets/qrCodePC.png', scale: 5/horizontalScaling),
            Text(
              '''Mocht dit ook niet werken, kan het IP-adres ook handmatig ingevoerd worden. Druk op "App instellingen" (in het menu met het QR-symbool). Onderaan staat het IP-adres van de server.
''',
              style: TextStyle(color: Colors.white, fontSize: 4.87*horizontalScaling),
            ),
            Image(
              image: AssetImage('assets/PCIP.png'),
              width: 10/horizontalScaling,
            ),
            SizedBox(height: 2.44*verticalScaling,),
          ],
        ));
  }
}

class qrScanScreen extends StatefulWidget {
  const qrScanScreen({Key? key}) : super(key: key);

  @override
  _qrScanScreenState createState() => _qrScanScreenState();
}

class _qrScanScreenState extends State<qrScanScreen> {
  ScanController controller = ScanController();
  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 250,
      height: 250,
      child: ScanView(
        controller: controller,
        scanAreaScale: 0.8,
        scanLineColor: Colors.blue.shade800,
        onCapture: (data) {
          String ip = data.split(':')[0];
          print(ip);
          Navigator.pop(context, ip);
        },
      ),
    );
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
    gameInfoClass.pouleScore = int.parse(data[0]);
    gameInfoClass.pouleLegs = int.parse(data[1]);
    gameInfoClass.quartScore = int.parse(data[2]);
    gameInfoClass.quartLegs = int.parse(data[3]);
    gameInfoClass.halfScore = int.parse(data[4]);
    gameInfoClass.halfLegs = int.parse(data[5]);
    gameInfoClass.finalScore = int.parse(data[6]);
    gameInfoClass.finalLegs = int.parse(data[7]);
    print(gameInfoClass);
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
      rankings.add(PouleRanking(
          playerName: data[0][i][0].toString(),
          points: data[0][i][1].toString()));
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
  PlayerClass player1 = PlayerClass();
  PlayerClass player2 = PlayerClass();
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

    socket.onConnect((_) => {
          if (gameActive) {sendCurrentScores(true)}
        });
  }

  void btnPress(String btnType) {
    switch (btnType) {
      case 'OK':
        if (player1.myTurn) {
          if (player1.thrownScore == '') {
            ScaffoldMessenger.of(widget.context).showSnackBar(
              const SnackBar(content: Text("Geen score ingevuld")),
            );
            break;
          } else if (player1.thrownScore == 'BUST') {
            player1.dartsThrown += numDarts;
            player1.scoresThrownHistory.add(0);
            player2.thrownScore = '';
            player1.myTurn = false;
          } else {
            if (int.parse(player1.thrownScore) > 180 ||
                int.parse(player1.thrownScore) > player1.currentScore) {
              ScaffoldMessenger.of(widget.context).showSnackBar(
                SnackBar(
                  content: Text(player1.thrownScore + ' is te hoog'),
                  duration: const Duration(seconds: 5),
                ),
              );
              break;
            } else if (int.parse(player1.thrownScore) / numDarts > 60) {
              ScaffoldMessenger.of(widget.context).showSnackBar(
                SnackBar(
                  content: Text((numDarts == 1)
                      ? '${player1.thrownScore} kan niet met $numDarts pijl gegooid worden.'
                      : '${player1.thrownScore} kan niet met $numDarts pijlen gegooid worden.'),
                  duration: const Duration(seconds: 5),
                ),
              );
              break;
            } else if (player1.currentScore - int.parse(player1.thrownScore) ==
                1) {
              ScaffoldMessenger.of(widget.context).showSnackBar(
                SnackBar(
                  content:
                      Text("${player1.thrownScore} kan niet gegooid worden."),
                  duration: const Duration(seconds: 5),
                ),
              );
              break;
            } else if (player1.thrownScore != '0') {
              player1.dartsThrown += numDarts;
              player1.dartsThrownHistory.add(numDarts);
              player1.scoresThrownHistory.add(int.parse(player1.thrownScore));
              if (player1.currentScore == int.parse(player1.thrownScore)) {
                endLeg(widget.game.player1, player1);
              } else {
                player1.currentScore -= int.parse(player1.thrownScore);
                player1.myTurn = false;
                player2.thrownScore = '';
              }
            } else {
              player1.myTurn = false;
              player1.scoresThrownHistory.add(int.parse(player1.thrownScore));
              player1.dartsThrown += numDarts;
              player1.dartsThrownHistory.add(numDarts);
              player2.thrownScore = '';
            }
            player1.turnsThisGame += 1;
            player1.turnsThisLeg += 1;
            player1.totalPointsThisLeg += int.parse(player1.thrownScore);
            player1.totalPointsThisGame += int.parse(player1.thrownScore);

            sendCurrentScores(false);
            if (170 - player1.currentScore >= 0) {
              player1.possibleOut = possibleOuts[170 - player1.currentScore];
            } else {
              player1.possibleOut = '';
            }
          }
        } else {
          if (player2.thrownScore == '') {
            ScaffoldMessenger.of(widget.context).showSnackBar(
              const SnackBar(content: Text("Geen score ingevuld")),
            );
          } else if (player2.thrownScore == 'BUST') {
            player2.dartsThrown += numDarts;
            player2.scoresThrownHistory.add(0);
            player1.thrownScore = '';
            player1.myTurn = true;
          } else {
            if (int.parse(player2.thrownScore) > 180 ||
                int.parse(player2.thrownScore) > player2.currentScore) {
              ScaffoldMessenger.of(widget.context).showSnackBar(
                SnackBar(content: Text(player2.thrownScore + ' is te hoog')),
              );
              break;
            } else if (int.parse(player2.thrownScore) / numDarts > 60) {
              ScaffoldMessenger.of(widget.context).showSnackBar(
                SnackBar(
                  content: Text((numDarts == 1)
                      ? '${player2.thrownScore} kan niet met $numDarts pijl gegooid worden.'
                      : '${player2.thrownScore} kan niet met $numDarts pijlen gegooid worden.'),
                  duration: const Duration(seconds: 5),
                ),
              );
              break;
            } else if (player2.currentScore - int.parse(player2.thrownScore) ==
                1) {
              ScaffoldMessenger.of(widget.context).showSnackBar(
                SnackBar(
                  content:
                      Text("${player2.thrownScore} kan niet gegooid worden."),
                  duration: const Duration(seconds: 5),
                ),
              );
              break;
            } else if (player2.thrownScore != '0') {
              player2.dartsThrown += numDarts;
              player2.dartsThrownHistory.add(numDarts);
              player2.scoresThrownHistory.add(int.parse(player2.thrownScore));
              if (player2.currentScore == int.parse(player2.thrownScore)) {
                endLeg(widget.game.player2, player2);
              } else {
                player2.currentScore -= int.parse(player2.thrownScore);
                player1.myTurn = true;
                player1.thrownScore = '';
              }
            } else {
              player2.scoresThrownHistory.add(int.parse(player2.thrownScore));
              player2.dartsThrown += numDarts;
              player2.dartsThrownHistory.add(numDarts);
              player1.myTurn = true;
              player1.thrownScore = '';
            }

            player2.turnsThisGame += 1;
            player2.turnsThisLeg += 1;
            player2.totalPointsThisLeg += int.parse(player2.thrownScore);
            player2.totalPointsThisGame += int.parse(player2.thrownScore);

            sendCurrentScores(false);
            if (170 - player2.currentScore >= 0) {
              player2.possibleOut = possibleOuts[170 - player2.currentScore];
            } else {
              player2.possibleOut = '';
            }
          }
        }
        numDarts = 3;
        break;
      case 'C':
        if (player1.myTurn) {
          player1.thrownScore = '';
        } else {
          player2.thrownScore = '';
        }
        break;
      case 'BUST':
        if (player1.myTurn && player1.thrownScore == '') {
          player1.thrownScore = 'BUST';
          player1.dartsThrown += numDarts;
          player1.scoresThrownHistory.add(0);
          player1.turnsThisLeg += 1;
          player1.turnsThisGame += 1;
          player2.thrownScore = '';
          player1.myTurn = false;
          player2.myTurn = true;
        } else if (player2.myTurn && player2.thrownScore == '') {
          player2.thrownScore = 'BUST';
          player2.dartsThrown += numDarts;
          player2.scoresThrownHistory.add(0);
          player2.turnsThisGame += 1;
          player2.turnsThisLeg += 1;
          player1.thrownScore = '';
          player2.myTurn = false;
          player1.myTurn = true;
        }
        sendCurrentScores(false);
        break;
      case 'ST':
        if (player1.myTurn && player1.thrownScore == '') {
          if (player1.currentScore < 26) {
            ScaffoldMessenger.of(widget.context).showSnackBar(
              const SnackBar(content: Text('Standaard is te hoog')),
            );
            player2.thrownScore = '';
          } else {
            player1.dartsThrown += numDarts;
            player1.dartsThrownHistory.add(numDarts);
            player1.turnsThisGame += 1;
            player1.turnsThisLeg += 1;
            player1.scoresThrownHistory.add(26);
            if (player1.currentScore == 26) {
              endLeg(widget.game.player1, player1);
            } else {
              player1.thrownScore = 'Standaard';
              player1.currentScore -= 26;
              player1.totalPointsThisGame += 26;
              player1.totalPointsThisLeg += 26;
              player2.thrownScore = '';
              player1.myTurn = false;
              player2.myTurn = true;
            }
            sendCurrentScores(false);
            if (170 - player1.currentScore >= 0) {
              player1.possibleOut = possibleOuts[170 - player1.currentScore];
            } else {
              player1.possibleOut = '';
            }
          }
        } else if (player2.myTurn && player2.thrownScore == '') {
          if (player2.currentScore < 26) {
            ScaffoldMessenger.of(widget.context).showSnackBar(
              const SnackBar(content: Text('Standaard is te hoog')),
            );
            player1.thrownScore = '';
          } else {
            player2.dartsThrown += numDarts;
            player2.dartsThrownHistory.add(numDarts);
            player2.scoresThrownHistory.add(26);
            player2.turnsThisGame += 1;
            player2.turnsThisLeg += 1;

            if (player2.currentScore == 26) {
              endLeg(widget.game.player2, player2);
            } else {
              player2.thrownScore = 'Standaard';
              player2.currentScore -= 26;
              player2.scoresThrownHistory.add(26);
              player2.totalPointsThisGame += 26;
              player2.totalPointsThisLeg += 26;
              player1.thrownScore = '';
              player2.myTurn = false;
              player1.myTurn = true;
            }
            sendCurrentScores(false);
            if (170 - player2.currentScore >= 0) {
              player2.possibleOut = possibleOuts[170 - player2.currentScore];
            } else {
              player2.possibleOut = '';
            }
          }
        } else {
          print("${player1.myTurn} | ${player2.thrownScore}");
        }
        break;
      default:
        if (player1.myTurn) {
          if ((player1.thrownScore + btnType).toString().length > 3) {
            break;
          } else {
            if (player1.thrownScore == '0') {
              player1.thrownScore == btnType;
            } else {
              player1.thrownScore = player1.thrownScore + btnType;
            }
          }
        } else {
          if ((player2.thrownScore + btnType).toString().length > 3) {
            break;
          } else {
            if (player2.thrownScore == '0') {
              player2.thrownScore == btnType;
            } else {
              player2.thrownScore = player2.thrownScore + btnType;
            }
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

  void endGame(String winner) {
    showDialog<String>(
      context: widget.context,
      barrierDismissible: false,
      builder: (BuildContext context) => AlertDialog(
        title: Text("Heeft $winner de wedstrijd gewonnen?"),
        actions: <Widget>[
          TextButton(
            onPressed: () {
              Navigator.pop(context, 'Cancel');
            },
            child: const Text("Annuleren"),
          ),
          TextButton(
            onPressed: () {
              sendCurrentScores(false);
              String msg =
                  "${widget.game.gameID},${player1.legsWon.toString()},${player2.legsWon.toString()},${player1.gameAverage},${player2.gameAverage},${player1.dartsThrown},${player2.dartsThrown}";
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
              sendCurrentScores(false);
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
                winnerType.setsWon++;
                if (winnerType.setsWon > (setsToPlay - winnerType.setsWon)) {
                  sendCurrentScores(false);
                  endGame(winnerName);
                } else {
                  resetGame();
                }
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
    sendCurrentScores(false);
    setState(() {
      null;
    });
  }

  void resetLastScore(PlayerClass player, {bool resetScore = true}) {
    if (player.scoresThrownHistory.isNotEmpty) {
      if (resetScore) {
        player.currentScore += player.scoresThrownHistory.removeLast();
      }
      player.totalPointsThisGame -= player.scoresThrownHistory.last;
      player.totalPointsThisLeg -= player.scoresThrownHistory.last;
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

      player.dartsThrown -= player.dartsThrownHistory.removeLast();

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
    sendCurrentScores(false);
    setState(() {
      null;
    });
  }

  void sendCurrentScores(bool firstMsg) {
    int startingPlayer;
    if (activeStartingPlayer == ChosenPlayerEnum.player1) {
      startingPlayer = 0;
    } else {
      startingPlayer = 1;
    }
    String msg =
        '${widget.game.gameID},${player1.currentScore},${player1.legsWon},${player2.currentScore},${player2.legsWon},${player1.myTurn},$startingPlayer,${player1.dartsThrown},${player2.dartsThrown}';
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
                        child: Padding(
                          padding: const EdgeInsets.all(0.0),
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
                        child: Padding(
                          padding: const EdgeInsets.all(0.0),
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
                        child: Padding(
                          padding: const EdgeInsets.all(0.0),
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
