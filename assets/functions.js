var socket = io();

console.log("Starting");

var myIP = $.getJSON('http://ip4.seeip.org/json', function(data)
{
  console.log("My IP:", data.ip);
  socket.emit("browser-connect", data.ip);
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
    console.log(player);
    playerReady();
    playerPlay();
    playerPause();
  })
});

function playerReady(){
  player.ready(function(){
    socket.emit('browser', "PLAYER READY");
    console.log(player.bufferedPercent());
    setInterval(updateBufferedPercent, 1000);
  });
}
function playerPlay(){
  player.on("play", function(){
    console.log('Playing');
    socket.emit('play_state_change', 'play');
    var duration_set = false;
    intervalObj = setInterval(updateTime(duration_set), 2000);
  });
}

function playerPause(){
  player.on("pause", function(){
    socket.emit('play_state_change', 'pause');
    clearInterval(intervalObj);
  });
}

function updateBufferedPercent(duration_set) // TODO: rename to something more generic
{
  $('#buffered').text((player.bufferedPercent()*100).toFixed(2) + "%");
  $('#bufferedSeconds').text(player.bufferedEnd().toFixed(0) + "s");
  $('#currentTime').text(player.currentTime().toFixed(0) + "s");
  progress = ((player.currentTime() / player.duration())*100).toFixed(2);
  $('#progressPercent').text(progress + "%");
  if (!duration_set)
  {
    $('#duration').text(player.duration())
    duration_set = true;
  }
}
