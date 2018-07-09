var socket = io();

console.log("Starting");

var myIP = $.getJSON('http://ip4.seeip.org/json', function(data)
{
  console.log("My IP:", data.ip);
  socket.emit("browser", data.ip);
})

//socket.emit('browser', "This is browser");

function updateTime()
{
  socket.emit("updateTime", player.currentTime());
}

var player;
var intervalObj;
$(document).ready(function() {
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
    console.log("New URL Recieved: %s", data);
    player = videojs('my-video');
    player.src(data);
    player.ready(function()
    {
      socket.emit('browser', "PLAYER READY");

      player.on("play", function()
      {
        console.log("Starting Playback");
        socket.emit('play_state_change', 'play');
        intervalObj = setInterval(updateTime, 2000);
      });

      player.on("pause", function()
      {
        socket.emit('play_state_change', 'pause');
        clearInterval(intervalObj);
      });
    })
    console.log(player);
  })
});
