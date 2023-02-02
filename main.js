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
  mainWindow.setVisibleOnAllWorkspaces(true);
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
  // settingsWindow.webContents.openDevTools();
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
  trialWindow.hide();
  trialWindow.on('close', (e) => {
    e.preventDefault();
    trialWindow.hide();
  });
  // trialWindow.webContents.openDevTools();
}

// App initialization
app.whenReady().then(async () => {
  let subToken = store.get('subToken');
  let today = new Date();
  let expire = new Date(subToken.expire);

  if (subToken.type === 'trial' && today.getTime() < expire.getTime() && subToken.valid) {
    createTrial();
    createDock();
    setWindowPos();
    setUpGlobals();
    setUpListener();
  } else {
    trialWindow.show();
  }
});

// Helpers
async function getTrack() {
  try {
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
  } catch (err) {
    console.log(err);
  }
}

function setWindowPos() {
  let mainScreen = screen.getPrimaryDisplay();
  let height = mainScreen.size.height;
  let width = mainScreen.size.width;
  mainWindow.setPosition((width - 1150) / 2, height + 1000);
  screen.on('swipe', (event) => {
    console.log(event);
    // code to handle the swipe event
  });
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
      getTrackInterval = setInterval(() => getTrack(), 1000);
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
    }
  });
}

function setUpHooks() {
  console.log('yaz');
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  // app.on('activate', async () => {
  //   console.log('yo');
  //   try {
  //     if (activateEnabled) {
  //       console.log('inside');
  //       activateEnabled = false;
  //       await Bash.$`osascript -e 'tell application "System Events" to set the autohide of the dock preferences to true'`;
  //       await delay(200);
  //       await mainWindow.show();
  //       await delay(200);
  //       mainWindow.webContents.send('mainChannel', { command: 'scrollUp' });
  //       getTrackInterval = setInterval(() => getTrack(), 500);
  //     }
  //   } catch (err) {
  //     console.log(err);
  //   }
  // });

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
