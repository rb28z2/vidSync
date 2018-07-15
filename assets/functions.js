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
  });

  $("#video-container").resizable({
    aspectRatio: 16/9
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
  });

  socket.on('partner_update', function(data){
	  $('#currentTime_other').text(data.current_time + "s");
	  $('#progressPercent_other').text(data.progress_percent + "%")
	  $('#buffered_other').text(data.buffered_percent + "%");
	  $('#bufferedSeconds_other').text(data.buffered_seconds + "s");
  });
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
  buffered_percent = (player.bufferedPercent()*100).toFixed(2);
  $('#buffered').text( buffered_percent + "%");

  buffered_seconds = player.bufferedEnd().toFixed(0)
  $('#bufferedSeconds').text(buffered_seconds + "s");

  current_time = player.currentTime().toFixed(0);
  $('#currentTime').text(current_time + "s");

  progress = ((player.currentTime() / player.duration())*100).toFixed(2);
  $('#progressPercent').text(progress + "%");
  if (!duration_set)
  {
    $('.duration').text(player.duration().toFixed(0))
    duration_set = true;
  }

  progress_data = {buffered_percent: buffered_percent, buffered_seconds: buffered_seconds, current_time: current_time,
  progress_percent: progress};

  socket.emit('partner_update_push', progress_data);
}