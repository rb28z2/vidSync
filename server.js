var express = require('express');
var download = require('download-file');
var srt2vtt = require('srt-to-vtt')
var fs = require('fs');

console.log("Starting");

const app = express();
app.use(express.static("assets"));

var http = require('http')
  .Server(app);

console.log("Initializing socket.io");
var io = require('socket.io')(http);


app.get('/', function(req, res)
{
  res.sendFile(__dirname + "/index.html");
});

app.get('/subs.vtt', function(req, res)
{
  res.sendFile("/subs.vtt");
})

var playData = {};
var is_playing = false;
var syncObj;
var subtitles_list;

io.on('connection', function(socket)
{

  socket.on('browser-connect', function(data){
    console.log("Client connected with ID:", socket.id, "IP:", data)
  })

  socket.on('browser', function(data){
    console.log(data);
  })

  socket.on('play_state_change', function(data)
  {
    if (data == "play")
    {
      console.log("PLAYING");
      socket.broadcast.emit('play_state', "play");
      is_playing = true;
    }
    else if (data == "pause")
    {
      console.log("PAUSING");
      socket.broadcast.emit('play_state', "pause");
      is_playing = false;
    }

    if (is_playing)
    {
      if (!syncObj)
        syncObj = setInterval(checkSync, 3000);
    }
    else
    {
      console.log("Stopping sync check");
      clearInterval(syncObj);
      syncObj = null;
    }

  });

  socket.on('new_url', function(data)
  {
    videoObject = `<div id="video">
    	<video id="my-video" class="video-js" data-setup='{"controls": true, "autoplay": false, "preload": "auto", "fluid": true}'>
    	  <source src="${data}" type="video/mp4" />
        <track src="subs.vtt" kind="captions" srclang="en" label="English" default>
    	  <p class="vjs-no-js">
    		Please enable JS
    	  </p>
    	</video>
    </div>`
    io.sockets.emit('new_url', videoObject);
  });

  socket.on('subtitle_request', function(data){
    console.log("Subtitles requested for: %s s%de%d", data.title, data.season, data.episode);
    var subRequester = require('./autosubs');
    new subRequester(data.title, data.season, data.episode).then(function(data){
      console.log("Subtitles retrieved successfully");
      io.sockets.emit('subtitle_listing', data.en);
      subtitles_list = data.en
    });
  })

  socket.on('selected_subtitle', function(data){
    var selected = subtitles_list[data];
    var url = selected.url;
    var options = {
      directory: "./assets/",
      filename: "subs.srt"
    };

    download(url, options, function(err){
      if (err) throw err;
    })
    console.log("Downloaded %s successfully as %s in %s", data.filename, options.filename, options.directory);

    fs.createReadStream('./assets/subs.srt')
      .pipe(srt2vtt())
      .pipe(fs.createWriteStream('./assets/subs.vtt'))

  })

  socket.on("updateTime", function(data)
  {
    playData[socket.id] = data;
  })

  socket.on("partner_update_push", function(data){
    socket.broadcast.emit("partner_update", data); // send progress info to everyone except sender
  })


  socket.on('disconnect', function(socket){
    //socket.broadcast.emit("play_state", "pause");
  })
});

http.listen(80, function()
{
  console.log("Listening on port %s in HTTP mode", 80);
});

function checkSync()
{
  console.log("Checking Sync");
  var smallestPlayed = 0;
  var clients = Object.keys(io.sockets.sockets);
  for (var i = 0; i < playData.length; i++)
  {
    smallestPlayed = playData[clients[i]];
  }
}
