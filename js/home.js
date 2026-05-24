// Home page logic
var ALL_ENTRIES = [];
var ALL_PLAYLISTS = [];
var ACTIVE_YEAR = 'all';
AppAuth.requireAuth(function(user) {

  var uid = user.uid;

  var grid =
    document.getElementById('playlists-grid');

  grid.innerHTML = (
    '<div class="skeleton" style="height:140px;border-radius:12px"></div>' +
    '<div class="skeleton" style="height:140px;border-radius:12px"></div>' +
    '<div class="skeleton" style="height:140px;border-radius:12px"></div>' +
    '<div class="skeleton" style="height:140px;border-radius:12px"></div>'
  );

  Promise.all([
    AppDB.getPlaylists(uid),
    AppDB.getAllEntries(uid)
  ])
    .then(function(results) {

        var playlists = results[0];
        var entries = results[1];

        ALL_PLAYLISTS = playlists;

        ALL_ENTRIES = entries;

        renderYearFilters(entries);

        applyYearFilter();

      })
    .catch(function(err) {

      console.error(err);

      AppUtils.showToast(
        'Failed to load. Refresh page.'
      );

    });

  function renderStats(playlists, entries) {

    var totalEntries =
      entries.length;

    var totalRuntime =
      entries.reduce(function(s, e) {
        return s + (e.runtime || 0);
      }, 0);

    var currentMonth =
      AppUtils.getCurrentMonth();

    var currentYear =
      AppUtils.getCurrentYear();

    var thisMonthCount =
      entries.filter(function(e) {

        return (
          e.monthWatched === currentMonth &&
          e.yearWatched === currentYear
        );

      }).length;

    var movieCount =
      entries.filter(function(e) {
        return e.type === 'movie';
      }).length;

    var seriesCount =
      entries.filter(function(e) {
        return e.type === 'series';
      }).length;

    document.getElementById(
      'stat-total'
    ).textContent = totalEntries;

    document.getElementById(
      'stat-hours'
    ).textContent =
      AppUtils.formatHours(totalRuntime);

    document.getElementById(
      'stat-month'
    ).textContent =
      thisMonthCount;

    document.getElementById(
      'stat-type'
    ).textContent =
      movieCount + ' · ' + seriesCount;

    document.getElementById(
      'fun-fact'
    ).textContent =
      AppUtils.computeFunFact(
        entries,
        playlists.length
      );

  }
  function renderYearFilters(entries) {

  var wrap =
    document.getElementById(
      'year-filters'
    );

  wrap.innerHTML = '';

  var years = [];

  entries.forEach(function(e) {

    if (
      e.yearWatched &&
      years.indexOf(e.yearWatched) === -1
    ) {

      years.push(e.yearWatched);

    }

  });

  years.sort(function(a, b) {

    return b - a;

  });

  years.unshift('all');

  years.forEach(function(year) {

    var btn =
      document.createElement('button');

    btn.className =
      'month-chip';

    if (year === ACTIVE_YEAR) {

      btn.classList.add('active');

    }

    btn.textContent =
      year === 'all'
      ? 'All'
      : year;

    btn.addEventListener(
      'click',
      function() {

        ACTIVE_YEAR = year;

        renderYearFilters(
          ALL_ENTRIES
        );

        applyYearFilter();

      }
    );

    wrap.appendChild(btn);

  });

}
function applyYearFilter() {

  var filteredEntries =
    ACTIVE_YEAR === 'all'

    ? ALL_ENTRIES

    : ALL_ENTRIES.filter(
        function(e) {

          return (
            e.yearWatched ==
            ACTIVE_YEAR
          );

        }
      );

  renderStats(
    ALL_PLAYLISTS,
    filteredEntries
  );

  renderPlaylists(
    ALL_PLAYLISTS,
    filteredEntries
  );

}

  function renderPlaylists(playlists, entries) {

    var grid =
      document.getElementById(
        'playlists-grid'
      );

    grid.innerHTML = '';

    if (playlists.length === 0) {

      document.getElementById(
        'empty-playlists'
      ).style.display = 'block';

      grid.style.display = 'none';

      return;
    }

    document.getElementById(
      'empty-playlists'
    ).style.display = 'none';

    grid.style.display = 'grid';

    playlists.forEach(function(playlist) {

      var card =
        document.createElement('a');

      card.className =
        'playlist-card';

      card.href =
        '/playlist.html?id=' + playlist.id;

      var playlistEntries =
        entries.filter(function(e) {

          return (
            e.playlistId === playlist.id
          );

        });

      var count =
        playlistEntries.length;

      var last3 =
        playlistEntries.slice(0, 3);

      var miniPostersHTML =
        last3.map(function(e) {

          return (
            '<img ' +
            'class="mini-poster" ' +
            'src="' +
            AppUtils.getPosterUrl(e.poster) +
            '" ' +
            'onerror="this.style.visibility=\'hidden\'">'
          );

        }).join('');

      while (last3.length < 3) {

        miniPostersHTML += (
          '<div class="mini-poster"></div>'
        );

        last3.push({});
      }

      card.innerHTML = (

        '<p class="playlist-card-name">' +
        playlist.name +
        '</p>' +

        '<p class="playlist-card-count">' +
        count +
        ' title' +
        (count !== 1 ? 's' : '') +
        '</p>' +

        '<div class="mini-posters">' +
        miniPostersHTML +
        '</div>'

      );

      grid.appendChild(card);

    });

  }

  var createModal =
    document.getElementById(
      'create-modal'
    );

  var input =
    document.getElementById(
      'playlist-name-input'
    );

  var createBtn =
    document.getElementById(
      'btn-create-playlist'
    );

  document.getElementById(
    'fab-create'
  ).addEventListener('click', function() {

    createModal.classList.add('open');

  });

  document.getElementById(
    'btn-cancel-modal'
  ).addEventListener('click', function() {

    createModal.classList.remove('open');

    input.value = '';

    createBtn.disabled = true;

  });

  input.addEventListener('input', function() {

    createBtn.disabled =
      input.value.trim() === '';

  });

  createBtn.addEventListener(
    'click',
    function() {

      var name =
        input.value.trim();

      if (!name) return;

      createBtn.disabled = true;

      createBtn.textContent =
        'Creating...';

      AppDB.createPlaylist(uid, name)

        .then(function() {

          createModal.classList.remove(
            'open'
          );

          input.value = '';

          createBtn.disabled = true;

          createBtn.textContent =
            'Create';

          AppUtils.showToast(
            'Playlist created ✓'
          );

          return Promise.all([
            AppDB.getPlaylists(uid),
            AppDB.getAllEntries(uid)
          ]);

        })

        .then(function(results) {

          renderStats(
            results[0],
            results[1]
          );

          renderPlaylists(
            results[0],
            results[1]
          );

        })

        .catch(function(err) {

          console.error(err);

          AppUtils.showToast(
            'Failed. Try again.'
          );

          createBtn.disabled = false;

          createBtn.textContent =
            'Create';

        });

    }
  );

  document.getElementById(
    'btn-stats'
  ).addEventListener('click', function() {

    window.location.href =
      '/stats.html';

  });

  document.getElementById(
    'btn-signout'
  ).addEventListener('click', function() {

    AppAuth.signOut()
      .then(function() {

        window.location.href =
          '/index.html';

      });

  });

});