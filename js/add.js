var state = {
  type: 'movie',
  selectedResult: null,
  selectedSeason: null,
  playlistId: null,
  uid: null,
  selectedMonth: null,
  selectedYear: null,
  selectedRating: null,
  searchToken: 0,
  lastQuery: ''
};

state.playlistId = new URLSearchParams(
  window.location.search
).get('playlistId');

if (!state.playlistId) {
  window.location.href = '/home.html';
}

AppAuth.requireAuth(function(user) {
  state.uid = user.uid;
  initPage();
});

function initPage() {

  buildYearSelect();

  buildMonthChips();

  buildEmojiRow();

  setupSearch();

  setupToggle();

  setupBackButtons();

}

function showStep(n) {
  document.querySelectorAll('.step')
    .forEach(function(step) {
      step.classList.remove('active');
    });

  document.getElementById('step-' + n)
    .classList.add('active');
}

function buildMonthChips() {

  var container =
    document.getElementById('month-chips');

  container.innerHTML = '';

  var months = [
    'Jan','Feb','Mar','Apr',
    'May','Jun','Jul','Aug',
    'Sep','Oct','Nov','Dec'
  ];

  months.forEach(function(month, index) {

    var btn = document.createElement('button');

    btn.className = 'chip';
    btn.textContent = month;
    btn.dataset.month = index + 1;

    btn.addEventListener('click', function() {

      container.querySelectorAll('.chip')
        .forEach(function(c) {
          c.classList.remove('selected');
        });

      btn.classList.add('selected');

      state.selectedMonth = index + 1;

      checkCanAdd();

    });

    container.appendChild(btn);

  });

}
function buildYearSelect() {

  var select =
    document.getElementById(
      'year-select'
    );

  select.innerHTML = '';

  var currentYear =
    new Date().getFullYear();

  for (
    var year = currentYear;
    year >= 2023;
    year--
  ) {

    var option =
      document.createElement(
        'option'
      );

    option.value = year;

    option.textContent = year;

    select.appendChild(option);

  }

  state.selectedYear =
    currentYear;

  select.value =
    currentYear;

  select.addEventListener(
    'change',
    function() {

      state.selectedYear =
        parseInt(this.value);

    }
  );

}

function buildEmojiRow() {

  var row = document.getElementById('emoji-row');

  row.innerHTML = '';

  var emojis = ['😭','🙁','😐','😊','🤩'];

  emojis.forEach(function(emoji, index) {

    var btn = document.createElement('button');

    btn.className = 'emoji-btn';
    btn.textContent = emoji;

    btn.addEventListener('click', function() {

      row.querySelectorAll('.emoji-btn')
        .forEach(function(b) {
          b.classList.remove('selected');
        });

      btn.classList.add('selected');

      state.selectedRating = index + 1;

      checkCanAdd();

    });

    row.appendChild(btn);

  });

}

function checkCanAdd() {

  document.getElementById('btn-add').disabled =
    !(state.selectedMonth && state.selectedRating);

}

function setupToggle() {

  document.getElementById('btn-movie')
    .addEventListener('click', function() {

      state.type = 'movie';

      document.getElementById('btn-movie')
        .classList.add('active');

      document.getElementById('btn-series')
        .classList.remove('active');

      clearSearch();

    });

  document.getElementById('btn-series')
    .addEventListener('click', function() {

      state.type = 'series';

      document.getElementById('btn-series')
        .classList.add('active');

      document.getElementById('btn-movie')
        .classList.remove('active');

      clearSearch();

    });

}

function clearSearch() {

  state.lastQuery = '';

  document.getElementById('search-input')
    .value = '';

  document.getElementById('search-results')
    .innerHTML = '';

  document.getElementById('search-status')
    .textContent = '';

}

function setupSearch() {

  var input =
    document.getElementById('search-input');

  var debouncedSearch = AppUtils.debounce(
    function(query) {
      doSearch(query);
    },
    600
  );

  input.addEventListener('input', function() {

    var query = this.value.trim();

    if (query.length < 2) {

      state.lastQuery = '';

      document.getElementById('search-results')
        .innerHTML = '';

      document.getElementById('search-status')
        .textContent = '';

      return;

    }

    if (query === state.lastQuery) {
      return;
    }

    state.lastQuery = query;

    document.getElementById('search-status')
      .textContent = 'Searching...';

    debouncedSearch(query);

  });

}

function doSearch(query) {

  var currentToken = ++state.searchToken;

  var fn = state.type === 'movie'
    ? AppTMDB.searchMovies.bind(AppTMDB)
    : AppTMDB.searchSeries.bind(AppTMDB);

  fn(query)

    .then(function(results) {

      if (currentToken !== state.searchToken) {
        return;
      }

      document.getElementById('search-status')
        .textContent = '';

      renderResults(results);

    })

    .catch(function(err) {

      if (currentToken !== state.searchToken) {
        return;
      }

      console.error(err);

      document.getElementById('search-status')
        .textContent =
          'Search failed. Check connection.';

      document.getElementById('search-results')
        .innerHTML = '';

    });

}

function renderResults(results) {

  var container =
    document.getElementById('search-results');

  container.innerHTML = '';

  if (!results || results.length === 0) {

    container.innerHTML =
      '<p class="text-sm text-muted" style="padding:12px 0">No results found.</p>';

    return;

  }

  results.forEach(function(r) {

    var item = document.createElement('div');

    item.className = 'result-item';

    var posterUrl =
      AppUtils.getPosterUrl(r.poster);

    item.innerHTML = (

      '<img class="result-thumb" src="'
        + (posterUrl || '')
        + '" alt="'
        + r.title
        + '" onerror="this.style.background=\'#2a2a2a\'">' +

      '<div class="result-info">' +

        '<p class="result-title">'
          + r.title +
        '</p>' +

        '<p class="result-meta">'
          + (r.releaseYear || '—')
          + ' · '
          + (r.type === 'movie'
            ? 'Movie'
            : 'Series')
          + '</p>' +

      '</div>'

    );

    item.addEventListener('click', function() {

      state.selectedResult = r;
      state.selectedSeason = null;
      state.selectedMonth = null;
      state.selectedRating = null;

      if (r.type === 'series') {

        loadSeasons(r.tmdbId);

      } else {

        showStep3();

      }

    });

    container.appendChild(item);

  });

}

function loadSeasons(tmdbId) {

  showStep(2);

  var list =
    document.getElementById('seasons-list');

  list.innerHTML =
    '<p class="text-muted text-sm" style="padding:16px 0">Loading seasons...</p>';

  AppTMDB.getSeriesSeasons(tmdbId)

    .then(function(seasons) {

      list.innerHTML = '';

      if (!seasons || seasons.length === 0) {

        list.innerHTML =
          '<p class="text-muted">No seasons found.</p>';

        return;

      }

      seasons.forEach(function(s) {

        var item = document.createElement('div');

        item.className = 'result-item';

        var posterUrl =
          AppUtils.getPosterUrl(s.poster);

        item.innerHTML = (

          '<img class="result-thumb" src="'
            + (posterUrl || '')
            + '" alt="'
            + s.seasonName
            + '" onerror="this.style.background=\'#2a2a2a\'">' +

          '<div class="result-info">' +

            '<p class="result-title">'
              + s.seasonName +
            '</p>' +

            '<p class="result-meta">'
              + s.episodeCount
              + ' episodes'
              + (s.airYear
                ? ' · ' + s.airYear
                : '')
              + '</p>' +

          '</div>'

        );

        item.addEventListener('click', function() {

          state.selectedSeason = s;

          showStep3();

        });

        list.appendChild(item);

      });

    })

    .catch(function(err) {

      console.error(err);

      list.innerHTML =
        '<p class="text-muted">Failed to load seasons.</p>';

    });

}

function showStep3() {

  var r = state.selectedResult;
  var s = state.selectedSeason;
  buildYearSelect();

  var posterUrl =
    AppUtils.getPosterUrl(
      s ? s.poster : r.poster
    );

  var previewPoster =
    document.getElementById('preview-poster');

  if (posterUrl) {

    previewPoster.src = posterUrl;
    previewPoster.style.display = 'block';

  } else {

    previewPoster.style.display = 'none';

  }

  document.getElementById('preview-title')
    .textContent = r.title;

  document.getElementById('preview-sub')
    .textContent =
      s ? s.seasonName : 'Movie';

  state.selectedMonth = null;
  state.selectedRating = null;

  document.querySelectorAll('.chip')
    .forEach(function(c) {
      c.classList.remove('selected');
    });

  document.querySelectorAll('.emoji-btn')
    .forEach(function(b) {
      b.classList.remove('selected');
    });

  document.getElementById('btn-add')
    .disabled = true;

  showStep(3);

}

function setupBackButtons() {

  document.getElementById('btn-back-s1')
    .addEventListener('click', function() {

      window.location.href =
        '/playlist.html?id='
        + state.playlistId;

    });

  document.getElementById('btn-back-s2')
    .addEventListener('click', function() {

      showStep(1);

    });

  document.getElementById('btn-back-s3')
    .addEventListener('click', function() {

      if (state.type === 'series') {

        showStep(2);

      } else {

        showStep(1);

      }

    });

}

document.getElementById('btn-add')
  .addEventListener('click', function() {

    var btn =
      document.getElementById('btn-add');

    btn.disabled = true;

    btn.textContent = 'Saving...';

    var r = state.selectedResult;
    var s = state.selectedSeason;

    function saveEntry(runtime, genres) {

      var entry = {

        playlistId: state.playlistId,

        tmdbId: r.tmdbId,

        title: r.title,

        type: r.type,

        season: s
          ? s.seasonNumber
          : null,

        seasonName: s
          ? s.seasonName
          : null,

        poster: s
          ? (s.poster || r.poster)
          : r.poster,

        releaseYear: s
          ? parseInt(s.airYear || 0)
          : parseInt(r.releaseYear || 0),

        runtime: runtime,

        genres: genres,

        monthWatched: state.selectedMonth,

        yearWatched:
          state.selectedYear,

        rating: state.selectedRating

      };

      AppDB.addEntry(state.uid, entry)

        .then(function() {

          window.location.href =
            '/playlist.html?id='
            + state.playlistId;

        })

        .catch(function(err) {

          console.error(err);

          btn.disabled = false;

          btn.textContent =
            'Add to Collection';

          AppUtils.showToast(
            'Failed to save. Try again.'
          );

        });

    }

    if (r.type === 'movie') {

      AppTMDB.getMovieDetails(r.tmdbId)

        .then(function(details) {

          saveEntry(
            details.runtime,
            details.genres
          );

        })

        .catch(function() {

          saveEntry(90, []);

        });

    } else {

      var epCount =
        s.episodeCount || 1;

      Promise.all([

        AppTMDB.getSeasonRuntime(
          r.tmdbId,
          s.seasonNumber
        ),

        AppTMDB.getSeriesGenres(
          r.tmdbId
        )

      ])

      .then(function(results) {

        var avgRuntime = results[0];

        var genres = results[1];

        saveEntry(
          avgRuntime * epCount,
          genres
        );

      })

      .catch(function() {

        saveEntry(
          30 * epCount,
          []
        );

      });

    }

  });