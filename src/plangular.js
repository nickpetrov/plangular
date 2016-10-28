// Plangular
// AngularJS Version

'use strict';

var plangular = angular.module('plangular', []);
var resolve = require('soundcloud-resolve-jsonp');
var Player = require('audio-player');
var hhmmss = require('hhmmss');

plangular.directive('plangular', ['$timeout', 'plangularConfig', '$ionicLoading', function($timeout, plangularConfig, $ionicLoading) {

  var client_id = plangularConfig.clientId;
  var player = new Player();

return {

    restrict: 'A',
    scope: false,

    link: function(scope, elem, attr) {

      //var src = attr.plangular;
      scope.player = player;
      scope.audio = player.audio;
      scope.currentTime = 0;
      scope.duration = 0;
      scope.track = false;
      scope.index = 0;
      scope.playlist;
      scope.tracks = [];

      if (!client_id) {
        var message = [
          'You must provide a client_id for Plangular',
          '',
          'Example:',
          "var app = angular.module('app', ['plangular'])",
          "  .config(function(plangularConfigProvider){",
          "    plangularConfigProvider.clientId = '[CLIENT_ID]';",
          "  });",
          '',
          'Register for app at https://developers.soundcloud.com/',
        ].join('\n');
        console.error(message);
        return false;
      }

      function createSrc(track) {
        if (track.stream_url) {
          var sep = track.stream_url.indexOf('?') === -1 ? '?' : '&'
          track.src = track.stream_url + sep + 'client_id=' + client_id;
        }
        return track;
      }

      scope.play = function(i) {
        if (typeof i !== 'undefined' && scope.tracks.length) {
          scope.index = i;
          scope.track = scope.tracks[i];
          if (scope.track.artist_id) {
            scope.curArtistId = scope.track.artist_id;
          }
          console.log('scope.curArtistId', scope.curArtistId);
        }
        player.play(scope.track.src);
      };

      scope.pause = function() {
        player.pause();
      };

      scope.playPause = function(i, src, curArtistId, newArtistId) {
        if (src && curArtistId != newArtistId) {
          resolve({ url: src, client_id: client_id }, function(error, response) {
            if (error) {
              console.error(error);
            }
            scope.$apply(function() {
              // scope.track = createSrc(response);
              console.log(scope.track);
              scope.curArtistId = newArtistId;
              if (Array.isArray(response)) {
                scope.tracks = response.map(function(track) {
                  return createSrc(track);
                })
              } else if (response.tracks) {
                scope.playlist = response;
                scope.tracks = response.tracks.map(function(track) {
                  return createSrc(track);
                })
              }

              if (scope.tracks[i].src) {
                if (typeof i !== 'undefined' && scope.tracks.length) {
                  scope.index = i;
                  scope.track = scope.tracks[i];
                  scope.curArtistId = newArtistId;
                  console.log('scope.curArtistId', scope.curArtistId);
                }
                player.playPause(scope.tracks[i].src);
              } else {
                $ionicLoading.show({
                  template: 'Sorry, this track is not available.',
                  duration: 1500
                });
              }
            })
          })
        } else {
          if (scope.tracks[i].src) {
            if (typeof i !== 'undefined' && scope.tracks.length) {
              scope.index = i;
              scope.track = scope.tracks[i];
              scope.curArtistId = newArtistId;
              console.log('scope.curArtistId', scope.curArtistId);
            }
            player.playPause(scope.tracks[i].src);
          } else {
            $ionicLoading.show({
              template: 'Sorry, this track is not available.',
              duration: 1500
            });
          }
        }


      };


      scope.playPauseFav = function(index, favList) {
        if (favList) {
          scope.track = createSrc(favList);
          if (Array.isArray(favList)) {
            scope.tracks = favList.map(function(track) {
              return createSrc(track);
            })
          } else if (favList.tracks) {
            scope.playlist = favList;
            scope.tracks = favList.tracks.map(function(track) {
              return createSrc(track);
            })
          }
          if (typeof index !== 'undefined' && scope.tracks.length) {
            scope.index = index;
            scope.track = scope.tracks[index];
            scope.curArtistId = scope.track.artist_id;
            console.log('scope.curArtistId', scope.curArtistId);
          }
          player.playPause(scope.tracks[index].src);
        }


      };

      scope.previous = function() {
        if (scope.tracks.length < 1) {
          return false
        }
        if (scope.index > 0) {
          scope.index--;
          scope.play(scope.index);
        }
      };

      scope.next = function() {
        if (scope.tracks.length < 1) {
          return false
        }
        if (scope.index < scope.tracks.length - 1) {
          scope.index++;
          scope.play(scope.index);
        } else {
          scope.pause();
        }
      };

      scope.seek = function(e) {
        console.log(scope.track.src, player.audio.src);
        if (scope.track.src === player.audio.src) {
          scope.player.seek(e);
        }
      };

      player.audio.addEventListener('timeupdate', function() {
        if (!scope.$$phase && scope.track.src === player.audio.src) {
          $timeout(function() {
            scope.currentTime = player.audio.currentTime;
            scope.duration = player.audio.duration;
          });
        }
      });

      player.audio.addEventListener('ended', function() {
        if (scope.track.src === player.audio.src) {
          scope.next();
        }
      });

    }

  }

}]);

plangular.filter('hhmmss', function() {
  return hhmmss;
});

plangular.provider('plangularConfig', function() {
  var self = this;
  this.$get = function() {
    return {
      clientId: self.clientId
    };
  };
});


module.exports = 'plangular';
