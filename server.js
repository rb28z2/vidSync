var express = require('express');

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

var playData = {};
var is_playing = false;
var syncObj;

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
    io.sockets.emit('new_url', data);
  })

  socket.on("updateTime", function(data)
  {
    playData[socket.id] = data;
  })


  socket.on('disconnect', function(socket){
  })
});

http.listen(80, function()
{
  console.log("Listen on port %s in HTTP mode", 80);
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
