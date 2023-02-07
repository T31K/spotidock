let trackName = $('#track-name');
let trackArtist = $('#track-artist');
let trackImg = $('#track-img');
let playPause = $('#playpause');
let main = $('#main');
let error = $('#error');

ipcRenderer.receive('mainChannel', (res) => {
  let { command, data } = res;
  if (command === 'updateTrack') {
    updateTrack(data);
  }
  if (command === 'scrollUp') {
    main.addClass('active');
  }
  if (command === 'scrollDown') {
    main.removeClass('active');
  }

  if (command === 'errorDetected') {
    main.hide();
    error.show();
    error.addClass('active');
  }
});

function updateTrack({ name, artist, url, repeat, shuffle, status }) {
  trackName.text(name);
  trackArtist.text(artist);
  trackImg.attr('src', url);

  if (status === 'playing') {
    playPause.attr('class', 'bi bi-pause-circle-fill');
  } else if (status === 'paused') {
    playPause.attr('class', 'bi bi-play-circle-fill');
  }
}

function sendMessage(msg) {
  ipcRenderer.send('mainChannel', { command: msg });
}

$('.bxs-heart').on('click', () => {
  sendMessage('fav');
});
$('.bx-shuffle').on('click', () => {
  sendMessage('shuffle');
});
$('.bx-skip-previous').on('click', () => {
  sendMessage('previous');
});
playPause.on('click', () => {
  sendMessage('play');
});
$('.bx-skip-next').on('click', () => {
  sendMessage('next');
});
$('.bx-repeat').on('click', () => {
  sendMessage('repeat');
});
$('.bx-toggle-left').on('click', () => {
  sendMessage('toggle');
});

$('.bxl-spotify').on('click', () => {
  sendMessage('spotify');
});

$('.bxs-cog').on('click', () => {
  sendMessage('settings');
});

$('.bx-refresh').on('click', () => {
  sendMessage('refresh');
  error.removeClass('active');
  error.hide();
  main.show();
});
