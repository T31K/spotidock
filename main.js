const { app, BrowserWindow, globalShortcut, screen, ipcMain, powerMonitor } = require('electron');
const { Bash } = require('node-bash');
const path = require('path');
const store = new (require('electron-store'))();

// Globals
let mainWindow;
let settingsWindow;
var getTrackInterval;
app.dock.hide();
store.clear();

// Windows creation
function createDock() {
  mainWindow = new BrowserWindow({
    transparent: true,
    x: 140,
    y: 2000,
    width: 1150,
    height: 85,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  mainWindow.loadFile('index.html');
  mainWindow.hide();
  mainWindow.webContents.openDevTools();
}

function createSettings() {
  settingsWindow = new BrowserWindow({
    width: 400,
    height: 260,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  settingsWindow.loadFile('settings.html');
  settingsWindow.webContents.openDevTools();
}

function createTrial() {
  trialWindow = new BrowserWindow({
    width: 400,
    height: 260,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  trialWindow.loadFile('trial.html');
  trialWindow.webContents.openDevTools();
  trialReminder = true;
}

function verifyLicense() {
  let license = store.get('license');

  if (!license) {
    store.set('license', { type: 'trial', date: new Date(), isValid: true });
  } else {
    let { type, date, isValid } = license;
    const difference = new Date() - new Date(date);
    const daysPassed = Math.floor(difference / (1000 * 60 * 60 * 24));
    if (daysPassed >= 7) {
      license.isValid = false;
      store.set('license', license);
    }
  }
}

function generateSubToken() {
  let subToken = store.get('subToken');
  if (!subToken) {
    store.set('subToken', { type: 'trial', date: new Date(), valid: true });
  }
}

// App initialization
app.whenReady().then(() => {
  let subToken = store.get('subToken');
  if (subToken.valid) {
    console.log('valid subToken');
    createDock();
    setWindowPos();
    setUpGlobals();
    setUpListener();
  } else {
  }
});

// Helpers
async function getTrack() {
  let name = await Bash.$`osascript -e 'tell application "Spotify" to name of current track'`;
  let artist = await Bash.$`osascript -e 'tell application "Spotify" to artist of current track'`;
  let url = await Bash.$`osascript -e 'tell application "Spotify" to artwork url of current track'`;
  let repeat = await Bash.$`osascript -e 'tell application "Spotify" to repeating'`;
  let shuffle = await Bash.$`osascript -e 'tell application "Spotify" to shuffling'`;
  let status = await Bash.$`osascript -e 'tell application "Spotify" to player state'`;
  await mainWindow.webContents.send('mainChannel', {
    command: 'updateTrack',
    data: {
      name: name.raw,
      artist: artist.raw,
      url: url.raw,
      repeat: repeat.raw,
      shuffle: shuffle.raw,
      status: status.raw,
    },
  });
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
    } else {
      // Show the window
      await Bash.$`osascript -e 'tell application "System Events" to set the autohide of the dock preferences to true'`;
      await delay(200);
      await mainWindow.show();
      await delay(200);
      mainWindow.webContents.send('mainChannel', { command: 'scrollUp' });
      getTrackInterval = setInterval(() => getTrack(), 500);
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
        break;
      case 'spotify':
        Bash.$`open -a Spotify`;
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

function delay(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}
