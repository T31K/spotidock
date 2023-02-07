// const { ipcRenderer } = require('electron');

let freeTrial = $('#free-trial');
let submitBtn = $('#submit');
let licenseKeyInput = $('#license-key-input');
$('.thank-you').hide();

ipcRenderer.receive('mainChannel', (res) => {
  console.log(res);
  if (res) {
    let { type } = res;
    if (type === 'trial') {
      console.log('trial');
      $('div.controls').show();
      $('.thank-you').hide();
    }
    if (type === 'premium') {
      $('div.controls').hide();
      $('.thank-you').show();
    }
  }
});

submitBtn.on('click', async () => {
  const response = await fetch('http://api.docktopus.com/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: `${licenseKeyInput.val()}` }),
  });

  const json = await response.json();
  let { message } = json;
  let toast = $('p.toast');
  toast.text(message);
  toast.css('visibility', 'visible');
  setTimeout(() => toast.css('visibility', 'hidden'), 1500);
  if (message === 'success') {
    ipcRenderer.send('mainChannel', { command: 'updateSubToken' });
  }
  console.log(json);
});

// window.addEventListener('keydown', function (e) {
//   if (e.key === 'r' && (e.metaKey || e.ctrlKey)) {
//     e.preventDefault();
//   }
// });
