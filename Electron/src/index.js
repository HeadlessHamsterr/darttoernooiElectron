const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const {networkInterfaces} = require('os');
const { fs } = require('fs');
let mainWindow = null;
let activeGamesWindow = null;
let XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
let udp = require('dgram');
const { address } = require('ip');
let broadcastAddress = require('broadcast-address');

var hostName;
var udpServer;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

ipcMain.on('hostNameUpdate', (event, arg) =>{
  hostName = arg;
});
ipcMain.on('enterFileName', async (event)=>{
  const result = await showSaveDialog();
  if(result["canceled"]){
    event.returnValue = null;
  }else{
    event.returnValue = result["filePath"];
  }
});
ipcMain.on('downloadPath', async(event)=>{
  const result = await showSaveDialogForDownload();
  if(result["canceled"]){
    event.returnValue = "canceled";
  }else{
    event.returnValue = result["filePaths"];
  }
});
ipcMain.on('selectSaveFile', async(event) =>{
  const result = await showLoadDialog();
  if(result["canceled"]){
    event.returnValue = null;
  }else{
    event.returnValue = result["filePaths"];
  }
});

ipcMain.on('getDocPath', (event) => {
  event.returnValue = app.getPath("documents");
});

ipcMain.on('selectPDFDirectory', async(event) =>{
  const result = await showOpenDialog();
  if(result["canceled"]){
    event.returnValue = null;
  }else{
    event.returnValue = result["filePaths"];
  }
});

ipcMain.on('loadIndex', () =>{
  createWindow(false);
});

ipcMain.on("klaarErmee", ()=>{
  app.quit();
});

ipcMain.on("restart", ()=>{
  console.log("Restarting")
  app.relaunch();
  app.exit();
})

ipcMain.on('connectServer', async(event) =>{
  const rendererWindow = new BrowserWindow({
    width: mainWindow.getSize()[0],
    height: mainWindow.getSize()[1],
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets/icons/appIcon.ico'),
    frame: false,
    fullscreen: true,
    minimizable: false,
    resizable: false,
  });
  rendererWindow.loadFile(path.join(__dirname, 'html/render.html'));
  rendererWindow.once('ready-to-show', () => {
    rendererWindow.show();
    rendererWindow.maximize();
  });
});

ipcMain.on('openActiveGamesWindow', async(event) => {
  activeGamesWindow = new BrowserWindow({
    width: 800,
    height: 800,
    webPreferences:{
      nodeIntegration: true,
      contextIsolation: false,

    },
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'icons/appIcon.ico'),
    frame: true,
    show: false
  });
  activeGamesWindow.loadFile(path.join(__dirname, 'html/activeGames.html'));
  
  activeGamesWindow.once('ready-to-show', () => {
    activeGamesWindow.show();
    activeGamesWindow.maximize();
    console.log("ActiveGamesWindow ready");
    ipcMain.on('sendActiveGameInfo', (event, arg) => {
      console.log("Sending game info to new screen")
      activeGamesWindow.webContents.send('activeGameInfo', arg);
    });
    ipcMain.on('sendAlreadyActiveGames', (event, arg) => {
      console.log("Sending already active games to new screen")
      activeGamesWindow.webContents.send('alreadyActiveGames', arg);
    });
    ipcMain.on('sendNewActiveGameInfo', (event, arg) => {
      console.log("Sending new game to new screen")
      activeGamesWindow.webContents.send('newActiveGameInfo', arg);
    });
    ipcMain.on('sendStopActiveGame', (event, arg) => {
      console.log("Stopping game on new screen")
      activeGamesWindow.webContents.send('stopActiveGame', arg);
    });
    ipcMain.on('returnPouleData', (event, arg) => {
      console.log("Sending pouledata to new screen");
      activeGamesWindow.webContents.send('pouleData', arg);
    });
    ipcMain.on('updatePouleRanks', (event, arg) =>{
      console.log("updating poule ranks");
      activeGamesWindow.webContents.send('pouleDataUpdate', arg);
    });
    event.returnValue = true;
  });

  activeGamesWindow.on('closed', (e) => {
    console.log(`ActiveGamesWindow closed (${e})`);
    ipcMain.removeAllListeners('sendActiveGameInfo');
    ipcMain.removeAllListeners('sendAlreadyActiveGames');
    ipcMain.removeAllListeners('sendNewActiveGameInfo');
    ipcMain.removeAllListeners('sendStopActiveGame');
    ipcMain.removeAllListeners('returnPouleData');
    ipcMain.removeAllListeners('updatePouleRanks');
  });
});

function showLoadDialog(){
  var filePath = app.getPath("documents");
  return new Promise((resolve, reject)=>{
    dialog.showOpenDialog({
      buttonLabel: "Spel laden",
      properties: ["openFile"],
      filters:[
        {name: "DARTS files",
        extensions: "DARTS"}
      ],
      defaultPath: filePath
    }).then(fileNames=>{
      if(fileNames === undefined){
        console.log("Failed to open files.");
        reject("No file selected");
      }else{
        resolve(fileNames);
      }
    });
  });
}

function showSaveDialog(){
  var filePath = app.getPath("documents");
  return new Promise((resolve, reject)=>{
    const {dialog} = require('electron');
  
    dialog.showSaveDialog({
      buttonLabel:"Opslaan",
      filters:[
        {name: "DARTS files",
        extensions: 'darts'}
      ],
      properties:[
        {showOverwriteConfirmation: true}
      ],
      defaultPath: filePath
    }).then(fileNames=>{
      if(fileNames === undefined){
        console.log("Failed to open files");
        reject("No file selected");
      }else{
        resolve(fileNames);
      }
    });
  });
}

function showSaveDialogForDownload(){
  var filePath = app.getPath("downloads");
  return new Promise((resolve, reject) => {
    dialog.showOpenDialog({
      buttonLabel: "Locatie selecteren",
      properties: [
        'openDirectory',
        'createDirectory'
      ],
      defaultPath: filePath
    }).then(fileNames=>{
      if(fileNames === undefined){
        console.log("Failed to open directory.");
        reject("No directory selected");
      }else{
        resolve(fileNames);
      }
    });
  });
}

function showOpenDialog(){
  var filePath = app.getPath("documents");
  return new Promise((resolve, reject) => {
    dialog.showOpenDialog({
      buttonLabel: "Locatie selecteren",
      properties: [
        'openDirectory',
        'createDirectory'
      ],
      defaultPath: filePath
    }).then(fileNames=>{
      if(fileNames === undefined){
        console.log("Failed to open directory.");
        reject("No directory selected");
      }else{
        resolve(fileNames);
      }
    });
  });
}

const createWindow = (shouldCheckUpdate = true) => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 800,
    webPreferences:{
      nodeIntegration: true,
      contextIsolation: false
    },
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'icons/appIcon.ico'),
    frame: true,
    show: false
  });

  var updateAvailable = false;
  if(!app.getVersion().includes('b') && shouldCheckUpdate){
    var updateUrl;
    var fileName;
    
    let request = new XMLHttpRequest();

    request.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        let response = JSON.parse(this.responseText);
        //console.log(response);
        latestVersion = response["tag_name"].toString().replace('V', '');
        latestVersionList = latestVersion.split('.');

        currentVersion = app.getVersion().toString();
        currentVersionList = currentVersion.split('.')

        console.log(latestVersionList);
        console.log(currentVersionList);

        if(parseInt(latestVersionList[0]) > parseInt(currentVersionList[0])){
          updateAvailable = true;
        }else if(parseInt(latestVersionList[1]) > parseInt(currentVersionList[1]) && parseInt(latestVersionList[0]) >= parseInt(currentVersionList[0])){
          updateAvailable = true;
        }else if(parseInt(latestVersionList[2]) > parseInt(currentVersionList[2]) && parseInt(latestVersionList[1]) >= parseInt(currentVersionList[1]) && parseInt(latestVersionList[0]) >= parseInt(currentVersionList[0])){
          updateAvailable = true;
        }

        if(updateAvailable){
          var wantedExtension;
          if(process.platform == "win32"){
            wantedExtension = 'exe';
          }else if(process.platform == 'linux'){
            wantedExtension = 'AppImage';
          }
          for(asset in response["assets"]){
            if(response["assets"][asset]["name"].includes(wantedExtension)){
              updateUrl = response["assets"][asset]["browser_download_url"];
              fileName = response["assets"][asset]["name"];
              break;
            }
          }
          console.log(updateUrl);
          mainWindow.loadFile(path.join(__dirname, 'html/updateCheck.html'));
          mainWindow.maximize();
          //mainWindow.webContents.send('updateAvailable', updateUrl);
        }else{
          console.log("No update available");
          //mainWindow.webContents.send("noUpdateAvailable");
          mainWindow.loadFile(path.join(__dirname, 'html/index.html'));
          mainWindow.maximize();
        }
      }
    }

    request.open("GET", "https://api.github.com/repos/HeadlessHamsterr/darttoernooiElectron/releases/latest", true);
    request.send();
  }else{
    mainWindow.loadFile(path.join(__dirname, 'html/index.html'));
    mainWindow.maximize();
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    if(updateAvailable == true){
      console.log(`Sending ${updateUrl} to mainWindow via updateAvailable`);
      let msg = [updateUrl, fileName, process.platform];
      mainWindow.webContents.send('updateAvailable', msg);
    }else{
      console.log("Sending noUpdateAvailable to mainWindow");
      mainWindow.webContents.send('noUpdateAvailable');

      console.log("Sending version info to mainWindow")
      let msg = app.getVersion().toString()
      mainWindow.webContents.send('version', msg);
    }
  });
  mainWindow.once('closed', () => {
    var broadcastAdr;
    let interfaces = networkInterfaces();

    //Het broadcast adres moet gezocht worden
    for(let interface of Object.keys(interfaces)){  //Loop door alle interfaces
      for(let ip of interfaces[interface]){         //Loop door alle ip's van de interface
        if(ip.family == 'IPv4' && !ip.internal){
          if(ip.address.includes(address())){       //Als het adres van de interface het huidige adres bevat
            broadcastAdr = broadcastAddress(interface); //Haal het broadcast adres op
            break;
          }
        }
      }
      if(broadcastAdr != undefined){  //Broadcast adres is gevonden, dus het zoeken kan gestopt worden
        break;
      }
    }

    let msg = `serverClose,${hostName}`;
    udpServer = udp.createSocket("udp4");
    udpServer.on('listening', function(){
      udpServer.setBroadcast(true);
      udpServer.send(msg, 8889, broadcastAdr);
      msgSend = true;
    });
    udpServer.bind(8888);
    try{
      activeGamesWindow.close();
    }catch(e){}
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  /*
  let msg = `serverClose,${hostName}`;
  udpServer = udp.createSocket("udp4");
  udpServer.on('listening', function(){
    udpServer.setBroadcast(true);
    udpServer.send(msg, 8889, broadcastAdr);
    msgSend = true;
  });
  udpServer.bind(8888);
*/
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});



// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
