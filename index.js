const express = require("express");
const app = express();
const path = require('path');
const bodyParser = require("body-parser");
const ytpl = require("ytpl");
const SpotifyWebApi = require('spotify-web-api-node');
const spotifyApi = new SpotifyWebApi({
  clientId: 'f4b08cb37a464a988d4b33f7857fa2ff',
  clientSecret: 'cccbf7808d334373a974070e9e71372a',
});

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs'); // Set EJS as the view engine
app.set('views', __dirname + '/public/views');

app.get('/', (req, res) => {
 res.sendFile(__dirname + "/public/index.html");
});

app.get('/youtube', (req, res) => {
 res.sendFile(__dirname + "/public/youtube.html");
});

app.get('/spotify', (req, res) => {
 res.sendFile(__dirname + "/public/spotify.html");
});

app.get('/otherprojects', (req, res) => {
 res.sendFile(__dirname + "/public/otherprojects.html");
});

app.get("*", function(req, res) {
  res.redirect("/");
});

app.post('/youtube', async(req, res) => {
  const playlist = req.body.playlistyt;
  const speed = req.body.speed;
  const result = await lengthyt(playlist, speed);
  res.render('youtube', { result }); 
});

app.post('/spotify', async (req, res) => {
  const playlist = req.body.playlistsp;
  const result = await lengthsp(playlist);
  res.render('spotify', { result });
});

app.listen(8080, async function() {
  console.log(`Playlist Length Calculator!`);
  console.log(`Now Active on Port: 8080`)
  console.log("========================")
});

function getPlaylistIdyt(url) {
    var regex = /[?&]list=([^&]+)/;
    var match = url.match(regex);
    return match[1];
}

function formatTimeyt(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return [hours, minutes, remainingSeconds].map(time => {
    return time < 10 ? `0${time}` : time;
  }).join(":");
}

async function lengthyt(url, speed) {
  const ID = getPlaylistIdyt(url);
  try {
    const playlist = await ytpl(ID).catch(e => { return; });
    if (!playlist || !playlist.items || playlist.items.length === 0) {
      return 'Playlist is private/unlisted or does not exist.';
    }
    if (playlist.privacy === 'PUBLIC') {
      return 'Playlist is private/unlisted or does not exist.';
    }
    const totalDuration = playlist.items.reduce((acc, item) => {
      return acc + parseInt(item.durationSec);
    }, 0);
    return `Length of the playlist is ${formatTimeyt(totalDuration/speed)}`;
  } catch (err) {
    console.error(err);
  }
}

function getPlaylistIdsp(url) {
const regex = /^https:\/\/open\.spotify\.com\/playlist\/(\w+).*$/;
const match = url.match(regex);
const playlistId = match ? match[1] : null;
return playlistId;
}

function formatTimesp(ms) {
  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return [hours, minutes, remainingSeconds].map(time => {
    return time < 10 ? `0${time}` : time;
  }).join(":");
}

async function lengthsp(url) {
  return new Promise((resolve, reject) => {
    const ID = getPlaylistIdsp(url);
    spotifyApi.clientCredentialsGrant()
      .then((data) => {
        spotifyApi.setAccessToken(data.body.access_token);
        spotifyApi.getPlaylistTracks(`${ID}`)
          .then((data) => {
            const tracks = data.body.items;
            const totalDuration = tracks.reduce((acc, track) => {
              return acc + track.track.duration_ms;
            }, 0);
            const formattedDuration = formatTimesp(totalDuration);
            resolve(formattedDuration);
          })
          .catch((error) => reject(error));
      })
      .catch((error) => reject(error));
  });
}