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
console.log('run');
function updateTrack({ name, artist, url, repeat, shuffle, status }) {
  $('#track-name').text(name);
  $('#track-artist').text(artist);
  $('#track-img').attr('src', url);
  if (status === 'playing') {
    $('#playpause').attr('class', 'bx bx-pause');
  } else if (status === 'paused') {
    $('#playpause').attr('class', 'bx bx-play');
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
$('#playpause').on('click', () => {
  $('#playpause').toggleClass('bx-play bx-pause');
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
