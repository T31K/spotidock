const { app, BrowserWindow, globalShortcut, screen, ipcMain, powerMonitor, Notification } = require('electron');
const { Bash } = require('node-bash');
const path = require('path');
const store = new (require('electron-store'))();

// Globals
let mainWindow;
let settingsWindow;
var getTrackInterval;
let activateEnabled = true;
app.dock.hide();
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
    width: 450,
    height: 350,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  trialWindow.loadFile('trial.html');
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
      // Hide the window
      mainWindow.webContents.send('mainChannel', { command: 'scrollDown' });
      await delay(500);
      mainWindow.hide();
      clearInterval(getTrackInterval);
      Bash.$`osascript -e 'tell application "System Events" to set the autohide of the dock preferences to false'`;
      activateEnabled = true;
    } else {
      // Show the window
      await Bash.$`osascript -e 'tell application "System Events" to set the autohide of the dock preferences to true'`;
      await delay(200);
      await mainWindow.show();
      await delay(200);
      mainWindow.webContents.send('mainChannel', { command: 'scrollUp' });
      getTrackInterval = setInterval(() => getTrack(), 5000);
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
        mainWindow.webContents.send('mainChannel', { command: 'scrollDown' });
        await delay(500);
        mainWindow.hide();
        Bash.$`osascript -e 'tell application "System Events" to set the autohide of the dock preferences to false'`;
        activateEnabled = true;
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
