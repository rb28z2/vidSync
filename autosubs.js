// var Opensubtitles = require('opensubtitles-js');
//
// var subs = new Opensubtitles();
//
// var query = {
//   imdbid: "tt1837576",
//   season: "2",
//   episode: "7",
// };
//
// subs.searchEpisode(query)
//   .then(function(result){
//     console.log(result)
//   }).fail(function(error){
//     console.log(error);
//   })
var config = require('./config');
const OS = require('opensubtitles-api');
const OpenSubtitles = new OS({
  useragent: config.ua,
  ssl: true
});

function getSubs(title, season, episode) {
  return OpenSubtitles.search({
    sublanguageid: 'eng',
    season: season,
    episode: episode,
    //imdbid: 'tt1837576',
    query: title,
    limit: 'all'
  });
}

module.exports = getSubs;
