let freeTrial = $('#free-trial');
let purchaseLicense = $('#purchase-license');

freeTrial.on('click', () => {
  ipcRenderer.send('mainChannel', { command: 'generateSubToken' });
});
