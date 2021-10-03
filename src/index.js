const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

ipcMain.on('enterFileName', async (event)=>{
  const result = await showSaveDialog();
  if(result["canceled"]){
    event.returnValue = null;
  }else{
    event.returnValue = result["filePath"];
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
const createWindow = () => {
  // Create the browser window.

  const mainWindow = new BrowserWindow({
    width: 800,
    height: 800,
    webPreferences:{
      nodeIntegration: true,
      contextIsolation: false,
    },
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'icons/appIcon.ico')
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();
  mainWindow.maximize();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
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
