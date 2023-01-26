let freeTrial = $('#free-trial');
let purchaseLicense = $('#purchase-license');

freeTrial.on('click', () => {
  console.log('clicked');
  ipcRenderer.send('mainChannel', { command: 'generateSubToken' });
});
