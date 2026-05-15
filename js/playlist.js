// Playlist view: display and manage entries in a playlist
// Playlist page logic

var playlistId = new URLSearchParams(
  window.location.search
).get('id');

if (!playlistId) {
  window.location.href = '/home.html';
}

AppAuth.requireAuth(function(user) {

  var uid = user.uid;

  var currentName = '';

  loadPlaylist();

  function loadPlaylist() {

    showSkeletons();

    Promise.all([

      db.collection('users')
        .doc(uid)
        .collection('playlists')
        .doc(playlistId)
        .get(),

      AppDB.getEntriesByPlaylist(
        uid,
        playlistId
      )

    ])
      .then(function(results) {

        var playlistDoc = results[0];

        var entries = results[1];

        if (!playlistDoc.exists) {

          window.location.href =
            '/home.html';

          return;
        }

        currentName =
          playlistDoc.data().name;

        document.getElementById(
          'playlist-title'
        ).textContent = currentName;

        document.getElementById(
          'entry-count'
        ).textContent =
          entries.length +
          ' title' +
          (entries.length !== 1 ? 's' : '');

        renderEntries(entries);

      })
      .catch(function(err) {

        console.error(err);

        AppUtils.showToast(
          'Failed to load.'
        );

      });

  }

  function showSkeletons() {

    var grid =
      document.getElementById(
        'entries-grid'
      );

    grid.innerHTML = '';

    for (var i = 0; i < 6; i++) {

      var s =
        document.createElement('div');

      s.className =
        'skeleton skeleton-card';

      grid.appendChild(s);

    }

  }

  function renderEntries(entries) {

    var grid =
      document.getElementById(
        'entries-grid'
      );

    grid.innerHTML = '';

    var empty =
      document.getElementById(
        'empty-state'
      );

    if (entries.length === 0) {

      empty.style.display = 'block';

      return;
    }

    empty.style.display = 'none';

    entries.forEach(function(entry) {

      var card =
        document.createElement('div');

      card.className = 'card';

      var posterUrl =
        AppUtils.getPosterUrl(entry.poster);

            var posterHTML =
        posterUrl

        ? '<img class="poster-img" src="' +
            posterUrl +
            '" alt="' +
            entry.title +
            '" onerror="this.style.display=\'none\'">'

  : '<div class="poster-placeholder">🎬</div>';

      var seasonBadge =
        entry.type === 'series'

        ? '<span class="badge badge-tl">S' +
          entry.season +
          '</span>'

        : '';

      var ratingBadge =
        '<span class="badge badge-tr">' +
        AppUtils.ratingToEmoji(
          entry.rating
        ) +
        '</span>';

      card.innerHTML = (

        '<div class="poster-wrap">' +

          posterHTML +

          seasonBadge +

          ratingBadge +

          '<div class="poster-gradient"></div>' +

          '<p class="poster-title">' +
            entry.title +
          '</p>' +

        '</div>'

      );

      grid.appendChild(card);

    });

  }

  function goToAdd() {

    window.location.href =
      '/add.html?playlistId=' +
      playlistId;

  }

  document.getElementById(
    'btn-back'
  ).addEventListener('click', function() {

    window.location.href =
      '/home.html';

  });

  document.getElementById(
    'fab-add'
  ).addEventListener(
    'click',
    goToAdd
  );

  document.getElementById(
    'btn-add-empty'
  ).addEventListener(
    'click',
    goToAdd
  );

  // Rename playlist

  document.getElementById(
    'playlist-title'
  ).addEventListener('click', function() {

    document.getElementById(
      'rename-input'
    ).value = currentName;

    document.getElementById(
      'rename-modal'
    ).classList.add('open');

    document.getElementById(
      'rename-input'
    ).focus();

  });

  document.getElementById(
    'btn-cancel-rename'
  ).addEventListener('click', function() {

    document.getElementById(
      'rename-modal'
    ).classList.remove('open');

  });

  document.getElementById(
    'btn-confirm-rename'
  ).addEventListener('click', function() {

    var newName =
      document.getElementById(
        'rename-input'
      ).value.trim();

    if (!newName) return;

    AppDB.updatePlaylistName(
      uid,
      playlistId,
      newName
    )
      .then(function() {

        currentName = newName;

        document.getElementById(
          'playlist-title'
        ).textContent = newName;

        document.getElementById(
          'rename-modal'
        ).classList.remove('open');

        AppUtils.showToast(
          'Renamed ✓'
        );

      })
      .catch(function(err) {

        console.error(err);

        AppUtils.showToast(
          'Failed to rename.'
        );

      });

  });

});