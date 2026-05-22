// Stats page: yearly and monthly statistics with Spotify Wrapped style canvas card
AppAuth.requireAuth(function(user) {

  var uid = user.uid;

  var allEntries = [];

  var currentYear = AppUtils.getCurrentYear();

  var currentMonth = 0;

  // BACK BUTTON

  document.getElementById('btn-back')
    .addEventListener('click', function() {
      window.location.href = '/home.html';
    });

  // LOAD ENTRIES

  AppDB.getAllEntries(uid)
    .then(function(entries) {

      console.log(entries);

      allEntries = entries || [];

      populateYearSelect(allEntries);

      render();

    })
    .catch(function(err) {

      console.error(err);

      AppUtils.showToast(
        'Failed to load stats.'
      );

    });

  // YEAR SELECT

  function populateYearSelect(entries) {

    var select =
      document.getElementById(
        'year-select'
      );

    var years = {};

    entries.forEach(function(entry) {

      if (entry.yearWatched) {
        years[entry.yearWatched] = true;
      }

    });

    var sortedYears =
      Object.keys(years)
      .sort(function(a, b) {
        return b - a;
      });

    if (
      sortedYears.indexOf(
        String(currentYear)
      ) === -1
    ) {
      sortedYears.unshift(
        String(currentYear)
      );
    }

    select.innerHTML = '';

    sortedYears.forEach(function(year) {

      var option =
        document.createElement('option');

      option.value = year;

      option.textContent = year;

      select.appendChild(option);

    });

    select.value = currentYear;

    select.addEventListener(
      'change',
      function() {

        currentYear =
          Number(select.value);

        render();

      }
    );

  }

  // MONTH FILTER

  setupMonthFilter();

  function setupMonthFilter() {

    var chips =
      document.querySelectorAll(
        '#month-filter .chip'
      );

    chips.forEach(function(chip) {

      chip.addEventListener(
        'click',
        function() {

          chips.forEach(function(c) {
            c.classList.remove(
              'selected'
            );
          });

          chip.classList.add(
            'selected'
          );

          currentMonth =
            Number(
              chip.dataset.month
            );

          render();

        }
      );

    });

  }

  // FILTERED DATA

  function getFilteredEntries() {

    return allEntries.filter(
      function(entry) {

        var yearMatch =
          entry.yearWatched === currentYear;

        var monthMatch =
          currentMonth === 0
          || entry.monthWatched === currentMonth;

        return yearMatch && monthMatch;

      }
    );

  }

  // RENDER

  function render() {

  var entries =
    getFilteredEntries();

  renderStats(entries);

}

 function renderStats(entries) {

  // TOTAL TITLES

  document.querySelector(
    '#s-titles .stat-number'
  ).textContent =
    entries.length;

  // HOURS WATCHED

  var totalMinutes =
    entries.reduce(function(sum, entry) {

      return sum + (entry.runtime || 0);

    }, 0);

  document.querySelector(
    '#s-hours .stat-number'
  ).textContent =
    AppUtils.formatHours(totalMinutes);

  // MOVIES

  var movieCount =
    entries.filter(function(entry) {

      return entry.type === 'movie';

    }).length;

  document.querySelector(
    '#s-movies .stat-number'
  ).textContent =
    movieCount;

  // SERIES

  var seriesCount =
    entries.filter(function(entry) {

      return entry.type === 'series';

    }).length;

  document.querySelector(
    '#s-series .stat-number'
  ).textContent =
    seriesCount;

  // TOP GENRE

  var genreMap = {};

  entries.forEach(function(entry) {

    (entry.genres || [])
      .forEach(function(genre) {

        genreMap[genre] =
          (genreMap[genre] || 0) + 1;

      });

  });

  var topGenre = '—';

  var topGenreCount = 0;

  Object.keys(genreMap)
    .forEach(function(genre) {

      if (genreMap[genre] > topGenreCount) {

        topGenre =
          genre;

        topGenreCount =
          genreMap[genre];

      }

    });

  document.querySelector(
    '#s-genre .stat-number'
  ).textContent =
    topGenre;

  // AVG RATING

  var avgRating = 0;

  if (entries.length > 0) {

    avgRating =
      entries.reduce(function(sum, entry) {

        return sum + (entry.rating || 0);

      }, 0) / entries.length;

  }

  document.querySelector(
    '#s-rating .stat-number'
  ).textContent =
    avgRating
      ? avgRating.toFixed(1) + ' ⭐'
      : '—';

  // MOST ACTIVE MONTH

  var monthMap = {};

  entries.forEach(function(entry) {

    var month =
      entry.monthWatched;

    if (!month) return;

    monthMap[month] =
      (monthMap[month] || 0) + 1;

  });

  var activeMonth = '—';

  var activeCount = 0;

  Object.keys(monthMap)
    .forEach(function(month) {

      if (
        monthMap[month] > activeCount
      ) {

        activeCount =
          monthMap[month];

        activeMonth =
          AppUtils.monthShort(
            Number(month)
          );

      }

    });

  document.querySelector(
    '#s-month .stat-number'
  ).textContent =
    activeMonth;

  // LONGEST WATCH

  var longest = null;

  entries.forEach(function(entry) {

    if (
      !longest
      || (entry.runtime || 0)
        > (longest.runtime || 0)
    ) {

      longest = entry;

    }

  });

  document.querySelector(
    '#s-longest .stat-number'
  ).textContent =
    longest
      ? longest.title
      : '—';

}

});