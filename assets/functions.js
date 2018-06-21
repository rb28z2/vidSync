var socket = io();

console.log("Starting");

socket.emit('browser', "This is browser");

function updateTime()
{
  socket.emit("updateTime", player.currentTime());
}

var player;
var intervalObj;
$(document).ready(function() {
  player = videojs('my-video');

  player.on('ready', function()
  {
    socket.emit('browser', "PLAYER READY");
  });

  player.on("play", function()
  {
    socket.emit('play_state_change', 'play');
    intervalObj = setInterval(updateTime, 2000);
  });

  player.on("pause", function()
  {
    socket.emit('play_state_change', 'pause');
    clearInterval(intervalObj);
  });

  $("form").submit(function(event)
  {
    event.preventDefault();
    console.log("submitted");
    url = $("#url_field").val();
    socket.emit("new_url", url);
    console.log(url);
  })
});

socket.on('connect', function()
{
  console.log("Connected!");

  socket.on("play_state", function(data)
  {
    if (data == "play")
    {
      player.play();
    }
    else if (data == "pause")
    {
      player.pause();
    }
  });

  socket.on('new_url', function(data)
  {
    player.src(data);
  })
});
