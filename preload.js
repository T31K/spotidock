window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type]);
  }
});

const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('ipcRenderer', {
  send: (channel, data) => {
    // Array of all ipcRenderer Channels used in the client
    if (validChannels.includes(channel)) {
      let validChannels = ['mainChannel'];
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    // Array of all ipcMain Channels used in the electron
    let validChannels = ['mainChannel'];
    if (validChannels.includes(channel)) {
      // Strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
});
