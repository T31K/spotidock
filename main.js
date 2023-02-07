const { app, BrowserWindow, globalShortcut, screen, ipcMain, powerMonitor, Notification, Menu } = require('electron');
const { Bash } = require('node-bash');
const path = require('path');
const store = new (require('electron-store'))();

// Globals
let mainWindow;
let settingsWindow;
var getTrackInterval;
let getTrackRetries = 0;
let allowActivate = true;
let allowError = true;
const menu = Menu.buildFromTemplate([]);
Menu.setApplicationMenu(menu);
let subToken = store.get('subToken');
if (!subToken) setUpSubToken();
setUpHooks();

// Windows creation
function createDock() {
  mainWindow = new BrowserWindow({
    transparent: true,
    alwaysOnTop: true,
    x: 140,
    y: 2000,
    width: 1150,
    height: 85,
    frame: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  mainWindow.loadFile('index.html');
  mainWindow.hide();
  mainWindow.webContents.openDevTools();
  mainWindow.setVisibleOnAllWorkspaces(true);
}

function createTrial() {
  trialWindow = new BrowserWindow({
    width: 500,
    height: 500,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  trialWindow.loadFile('trial.html');
  if (subToken.type === 'premium') {
    trialWindow.hide();
  }
  trialWindow.on('close', (e) => {
    e.preventDefault();
    trialWindow.hide();
  });
  trialWindow.webContents.openDevTools();
}

// App initialization
app.whenReady().then(async () => {
  let subToken = store.get('subToken');
  let today = new Date();
  let expire = new Date(subToken.expire);

  createTrial();
  await delay(1000);
  sendSubTokenToTrial();

  if (subToken.type === 'trial' && today.getTime() >= expire.getTime()) {
    trialWindow.show();
  } else {
    createDock();
    setWindowPos();
    setUpGlobals();
    setUpListener();
  }
});

// Helpers
async function getTrack() {
  try {
    let trackInfo =
      await Bash.$`osascript -e 'tell application "Spotify" to {name of current track, artist of current track, artwork url of current track, repeating, shuffling, player state}'`;
    let trackInfoArray = trackInfo.raw.split(',');
    let [name, artist, url, repeat, shuffle, status] = trackInfoArray;
    await mainWindow.webContents.send('mainChannel', {
      command: 'updateTrack',
      data: {
        name,
        artist,
        url,
        repeat,
        shuffle,
        status: status.trim(),
      },
    });
  } catch (err) {
    getTrackRetries++;
    console.log(err);
  }
}

function setWindowPos() {
  let mainScreen = screen.getPrimaryDisplay();
  let height = mainScreen.size.height;
  let width = mainScreen.size.width;
  mainWindow.setPosition((width - 1150) / 2, height + 1000);
}

function setUpGlobals() {
  globalShortcut.register('CommandOrControl+`', async () => {
    if (mainWindow.isVisible()) {
      // Hide the dock
      mainWindow.webContents.send('mainChannel', { command: 'scrollDown' });
      await delay(500);
      mainWindow.hide();
      clearInterval(getTrackInterval);
      Bash.$`osascript -e 'tell application "System Events" to set the autohide of the dock preferences to false'`;
      allowActivate = true;
      console.log('globalShortcut.if');
      console.log(allowActivate);
    } else {
      // Show the dock
      await Bash.$`osascript -e 'tell application "System Events" to set the autohide of the dock preferences to true'`;
      await delay(200);
      await mainWindow.show();
      await delay(200);
      mainWindow.webContents.send('mainChannel', { command: 'scrollUp' });
      getTrackRetries = 1;
      if (!allowError) return;
      getTrackInterval = setInterval(() => {
        if (getTrackRetries > 10) {
          clearInterval(getTrackInterval);
          console.log('END_________________END');
          sendErrorDetected();
        } else {
          getTrack();
        }
      }, 700);
      allowActivate = false;
      console.log('globalShortcut.else');
      console.log(allowActivate);
    }
  });
}

function setUpListener() {
  ipcMain.on('mainChannel', async (event, arg) => {
    let { command } = arg;
    switch (command) {
      case 'previous':
        Bash.$`osascript -e 'tell application "Spotify" to previous track'`;
        break;
      case 'next':
        Bash.$`osascript -e 'tell application "Spotify" to next track'`;
        break;
      case 'play':
        Bash.$`osascript -e 'tell application "Spotify" to playpause'`;
        break;
      case 'toggle':
        allowActivate = true;
        mainWindow.webContents.send('mainChannel', { command: 'scrollDown' });
        await delay(500);
        mainWindow.hide();
        Bash.$`osascript -e 'tell application "System Events" to set the autohide of the dock preferences to false'`;
        break;
      case 'spotify':
        Bash.$`open -a Spotify`;
        break;
      case 'settings':
        trialWindow.show();
        break;
      case 'updateSubToken':
        let newToken = store.get('subToken');
        newToken.type = 'premium';
        store.set('subToken', newToken);
        trialWindow.webContents.send('mainChannel', newToken);
        break;
      case 'refresh':
        getTrackInterval = setInterval(() => {
          if (getTrackRetries > 10) {
            clearInterval(getTrackInterval);
            sendErrorDetected();
          } else {
            allowError = true;
            getTrack();
          }
        }, 700);
    }
  });
}

function setUpHooks() {
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('before-quit', () => {
    Bash.$`osascript -e 'tell application "System Events" to set the autohide of the dock preferences to false'`;
  });

  app.on('activate', async () => {
    if (allowActivate) {
      allowActivate = false;
      // Show the dock
      await Bash.$`osascript -e 'tell application "System Events" to set the autohide of the dock preferences to true'`;
      await delay(200);
      await mainWindow.show();
      await delay(200);
      mainWindow.webContents.send('mainChannel', { command: 'scrollUp' });
      getTrackRetries = 1;
      if (!allowError) return;
      getTrackInterval = setInterval(() => {
        if (getTrackRetries > 10) {
          clearInterval(getTrackInterval);
          console.log('END_________________END');
          sendErrorDetected();
        } else {
          getTrack();
        }
      }, 700);
      await delay(200);
      console.log('app.on.activate');
      console.log(allowActivate);
    }
  });
}

function setUpSubToken() {
  let today = new Date();
  let sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
  store.set('subToken', { type: 'trial', date: today, expire: sevenDaysLater, valid: true });
}

function delay(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

function sendSubTokenToTrial() {
  trialWindow.webContents.send('mainChannel', subToken);
}

function sendErrorDetected() {
  getTrackRetries = 0;
  allowError = false;
  mainWindow.webContents.send('mainChannel', { command: 'errorDetected' });
}
