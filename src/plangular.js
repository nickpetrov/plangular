// Plangular
// AngularJS Version

'use strict';

var plangular = angular.module('plangular', []);
var resolve = require('soundcloud-resolve-jsonp');
var Player = require('audio-player');
var hhmmss = require('hhmmss');

plangular.directive('plangular', ['$timeout', 'plangularConfig', '$ionicLoading', '$q',
  function($timeout, plangularConfig, $ionicLoading, $q) {

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
        scope.curArtistId = null;
        scope.favList = null;

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
            console.log('play::scope.curArtistId', scope.curArtistId);
          }
          player.play(scope.track.src);
        };

        scope.pause = function() {
          player.pause();
        };

        function makeTracks(res) {
          if (Array.isArray(res)) {
            scope.tracks = res.map(function(track) {
              return createSrc(track);
            });
          } else if (res.tracks) {
            scope.playlist = res;
            scope.tracks = res.tracks.map(function(track) {
              return createSrc(track);
            });
          }
        }

        function resetTracks(src) {
          var deferred = $q.defer();

          resolve({ url: src, client_id: client_id }, function(err, res) {
            if (err) {
              deferred.reject(err);
            }
            scope.$apply(function() {
              makeTracks(res);
              deferred.resolve();
            });
          });

          return deferred.promise;
        }

        function setActiveTrack(index) {
          if (typeof index !== 'undefined' && scope.tracks.length && scope.tracks[index] && scope.tracks[index].src) {
            scope.index = index;
            scope.track = scope.tracks[index];
            player.playPause(scope.tracks[index].src);
          } else {
            $ionicLoading.show({
              template: 'Sorry, this track is not available.',
              duration: 1500
            });
          }
        }

        scope.playPause = function(index, src, artistId) {

          if (!src) return;

          if (scope.curArtistId !== artistId || !scope.favList) {
            resetTracks(src)
              .then(function() {
                scope.curArtistId = artistId;
                console.log('playPause::scope.curArtistId', scope.curArtistId);
                setActiveTrack(index);
              })
              .catch(function(err) {
                console.error(err);
              });
          } else {
            setActiveTrack(index);
          }
        };


        scope.playPauseFav = function(index, favList) {
          if (favList && favList.length) {
            makeTracks(favList);
            setActiveTrack(index);
            scope.curArtistId = scope.track.artist_id;
            console.log('playPauseFav::scope.curArtistId', scope.curArtistId);
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

  }
]);

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
