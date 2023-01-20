let trackName = $('#track-name');
let trackArtist = $('#track-artist');
let trackImg = $('#track-img');
let playPause = $('#playpause');
let main = $('#main');

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
});

function updateTrack({ name, artist, url, repeat, shuffle, status }) {
  trackName.text(name);
  trackArtist.text(artist);
  trackImg.attr('src', url);
  if (status === 'playing') {
    playPause.attr('class', 'bx bx-pause');
  } else if (status === 'paused') {
    playPause.attr('class', 'bx bx-play');
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
  playPause.toggleClass('bx-play bx-pause');
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
