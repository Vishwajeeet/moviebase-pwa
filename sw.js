// Service Worker
var CACHE = 'watchdiary-v3';

var SHELL = [

  '/index.html',
  '/home.html',
  '/playlist.html',
  '/add.html',
  '/stats.html',

  '/css/main.css',

  '/js/config.js',
  '/js/firebase-init.js',
  '/js/auth.js',
  '/js/utils.js',
  '/js/firestore.js',
  '/js/tmdb.js',

  '/js/home.js',
  '/js/playlist.js',
  '/js/add.js',
  '/js/stats.js',
  '/js/entry.js',
  '/js/rawg.js',
  '/entry.html'

];

self.addEventListener(
  'install',
  function(e) {

    e.waitUntil(

      caches.open(CACHE)
        .then(function(cache) {

          return cache.addAll(
            SHELL
          );

        })

    );

    self.skipWaiting();

  }
);

self.addEventListener(
  'activate',
  function(e) {

    e.waitUntil(

      caches.keys()
        .then(function(keys) {

          return Promise.all(

            keys
              .filter(function(k) {

                return k !== CACHE;

              })
              .map(function(k) {

                return caches.delete(k);

              })

          );

        })

    );

    self.clients.claim();

  }
);

self.addEventListener(
  'fetch',
  function(e) {

    var url =
      e.request.url;

    var isExternal = (

      url.indexOf(
        'googleapis.com'
      ) > -1 ||

      url.indexOf(
        'gstatic.com'
      ) > -1 ||

      url.indexOf(
        'themoviedb.org'
      ) > -1 ||

      url.indexOf(
        'firebaseapp.com'
      ) > -1 ||

      url.indexOf(
        'firestore.googleapis.com'
      ) > -1 ||

      url.indexOf(
        'fonts.gstatic.com'
      ) > -1

    );

    if (isExternal) {

      e.respondWith(

        fetch(e.request)
          .catch(function() {

            return caches.match(
              e.request
            );

          })

      );

    } else {

      e.respondWith(

        fetch(e.request)
          .then(function(res) {
            var resClone = res.clone();
            caches.open(CACHE).then(function(cache) {
              cache.put(e.request, resClone);
            });
            return res;
          })
          .catch(function() {
            return caches.match(e.request);
          })

      );

    }

  }
);