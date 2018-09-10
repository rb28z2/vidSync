/**
 * socket.emit('something') emits back to the Server
 * io.sockets.emit('something') emits to all clients
 */

var socket = io();

console.log("Starting");

$.getJSON('http://ip4.seeip.org/json', function(data) {
  console.log("My IP:", data.ip);
  socket.emit("browser-connect", data.ip);
})

//socket.emit('browser', "This is browser");

function updateTime() {
  socket.emit("updateTime", player.currentTime());
}

var player;
var intervalObj;
$(document).ready(function() {

  $("#submit_url").on('click', function(){
    console.log("submitted");
    url = $("#url_field").val();
    socket.emit("new_url", url);
    console.log(url);
  });

  $("#load_subs").on('click', function(){
    console.log("Requesting new subtitles");

    request = {
      title: $("#title_field").val(),
      season: $("#season_field").val(),
      episode: $("#episode_field").val()
    };

    socket.emit("subtitle_request", request);
    $("#load_subs").html("Getting options...");
    $("#load_subs").prop("disabled", true);
  })

  $("#video-container").resizable({
    aspectRatio: 16 / 9
  })

  $("#get_current_time").on('click', function() {
    var time = player.currentTime().toFixed(0);
    $("#current_time_input").val(time);
  });

  $("#sync_now").on('click', function() {
    player.pause();
    var time = $("#current_time_input").val();
    socket.emit('jump_to_time', time);
    $("#sync_badge").fadeTo(1000, 1).delay(3000).fadeTo(1000, 0);
  });

  $("#subtitle_enable").change(function() {
    checked = $(this).is(':checked');
    if (checked) {
      player.textTracks()[0].mode = 'showing';
    }
    else {
      player.textTracks()[0].mode = 'hidden';
    }
  })

  $("#subtitle_list").on('click', "div.subtitle_item", function() {
    var sub_index = $(this).data().index;
    socket.emit('selected_subtitle', sub_index);
    $(this).css({
      "background": "#272727",
      "color": "#565656"
    });
  })

  $("#load_last_video").on('click', function() {
    socket.emit('get_last_video');
  })
});

socket.on('connect', function() {
  console.log("Connected!");

  socket.on("play_state", function(data) {
    if (data == "play") {
      player.play();
    } else if (data == "pause") {
      player.pause();
    }
  });

  socket.on('new_url', function(data) {
    console.log("New URL Recieved: %s", data);
    $("#new_url_badge").fadeIn().delay(3000).fadeOut();
    vid_div = $("#video-container");
    vid_div.html(data);
    player = videojs('my-video');
    //player.src(data);
    console.log(player);
    playerReady();
    playerPlay();
    playerPause();
  });

  socket.on('jump_to_time', function(data) {
    console.log("Jumping to time %s", data);
    player.currentTime(data);
  })

  socket.on('subtitle_listing', function(data) {
    console.log("Retrieved Subtitles");
    var listingDiv = $("#subtitle_list");
    for (var i = 0; i < data.length; i++) {
      var toAppend = `<div id="subtitle${i}" class="subtitle_item">${data[i].filename}</div>`
      //toAppend.data("index", i);
      console.log(toAppend);
      //$(toAppend).appendTo(listingDiv)
      var appended = listingDiv.append(toAppend).children().last();
      appended.data("index", i);
    }
    $("#load_subs").html("Load Subtitles");
    $("#load_subs").prop("disabled", false);
  })

  socket.on('partner_update', function(data) {
    $('#currentTime_other').text(data.current_time + "s");
    $('#progressPercent_other').text(data.progress_percent + "%")
    $('#buffered_other').text(data.buffered_percent + "%");
    $('#bufferedSeconds_other').text(data.buffered_seconds + "s");
  });
});

function playerReady() {
  player.ready(function() {
    socket.emit('browser', "PLAYER READY");
    console.log(player.bufferedPercent());
    setInterval(updateBufferedPercent, 1000);
  });
}

function playerPlay() {
  player.on("play", function() {
    console.log('Playing');
    socket.emit('play_state_change', 'play');
    var duration_set = false;
    intervalObj = setInterval(updateTime(duration_set), 2000);
  });
}

function playerPause() {
  player.on("pause", function() {
    socket.emit('play_state_change', 'pause');
    clearInterval(intervalObj);
  });
}

function updateBufferedPercent(duration_set) // TODO: rename to something more generic
{
  buffered_percent = (player.bufferedPercent() * 100).toFixed(2);
  $('#buffered').text(buffered_percent + "%");

  buffered_seconds = player.bufferedEnd().toFixed(0)
  $('#bufferedSeconds').text(buffered_seconds + "s");

  current_time = player.currentTime().toFixed(0);
  $('#currentTime').text(current_time + "s");

  progress = ((player.currentTime() / player.duration()) * 100).toFixed(2);
  $('#progressPercent').text(progress + "%");
  if (!duration_set) {
    $('.duration').text(player.duration().toFixed(0))
    duration_set = true;
  }

  progress_data = {
    buffered_percent: buffered_percent,
    buffered_seconds: buffered_seconds,
    current_time: current_time,
    progress_percent: progress
  };

  socket.emit('partner_update_push', progress_data);
}
