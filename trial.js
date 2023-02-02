let freeTrial = $('#free-trial');
let submitBtn = $('#submit');
let licenseKeyInput = $('#license-key-input');

freeTrial.on('click', () => {
  ipcRenderer.send('mainChannel', { command: 'generateSubToken' });
});

submitBtn.on('click', async () => {
  const response = await fetch('http://localhost:4242/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: `${licenseKeyInput.val()}` }),
  });

  const json = await response.json();
  console.log(json);
});
