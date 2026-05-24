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

  renderTopPicks(entries);

  renderFunFacts(entries);
  window.currentStatsEntries = entries;

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
function renderTopPicks(entries) {

  var container =
    document.getElementById(
      'top-picks'
    );

  container.innerHTML = '';

  var topRated =
    entries.filter(function(entry) {

      return entry.rating === 5;

    }).slice(0, 4);

  if (topRated.length === 0) {

    container.innerHTML =
      '<p class="text-muted">No 5-star titles yet.</p>';

    return;

  }

  topRated.forEach(function(entry) {

    var card =
      document.createElement('div');

    card.className =
      'poster-card';

    card.innerHTML = (

      '<img ' +
      'class="poster-img" ' +
      'src="' +
      AppUtils.getPosterUrl(entry.poster) +
      '">' +

      '<div class="poster-overlay">' +

        '<div class="poster-title">' +
          entry.title +
        '</div>' +

        '<div class="poster-sub">' +
          AppUtils.ratingToEmoji(
            entry.rating
          ) +
          ' · ' +
          entry.yearWatched +
        '</div>' +

      '</div>'

    );

    container.appendChild(card);

  });

}
function renderFunFacts(entries) {

  var container =
    document.getElementById(
      'fun-facts'
    );

  container.innerHTML = '';

  if (entries.length === 0) {

    container.innerHTML =
      '<p class="text-muted">No data yet.</p>';

    return;

  }

  var totalMinutes =
    entries.reduce(function(sum, entry) {

      return sum + (entry.runtime || 0);

    }, 0);

  var avgRating =
    entries.reduce(function(sum, entry) {

      return sum + (entry.rating || 0);

    }, 0) / entries.length;

  var highestRated =
    entries.filter(function(entry) {

      return entry.rating === 5;

    }).length;

  var facts = [

    '🕐 You watched for '
      + AppUtils.formatHours(
          totalMinutes
        ),

    '⭐ Your average rating is '
      + avgRating.toFixed(1),

    '🤩 You gave '
      + highestRated
      + ' title'
      + (highestRated !== 1 ? 's' : '')
      + ' a perfect score',

    '🎬 You logged '
      + entries.length
      + ' total titles'

  ];

  facts.forEach(function(fact) {

    var box =
      document.createElement('div');

    box.className =
      'fun-fact-box';

    box.style.marginBottom =
      '12px';

    box.textContent =
      fact;

    container.appendChild(box);

  });

}
setupWrappedCard();

function setupWrappedCard() {

  var generateBtn =
    document.getElementById(
      'btn-generate'
    );

  var downloadBtn =
    document.getElementById(
      'btn-download'
    );

  generateBtn.addEventListener(
    'click',
    function() {

      generateWrappedCard();

    }
  );

  downloadBtn.addEventListener(
    'click',
    function() {

      var canvas =
        document.querySelector(
          '#canvas-wrap canvas'
        );

      if (!canvas) return;

      var link =
        document.createElement('a');

      link.download =
        'moviebase-wrapped.png';

      link.href =
        canvas.toDataURL(
          'image/png'
        );

      link.click();

    }
  );

}
function generateWrappedCard() {

  var entries =
    window.currentStatsEntries || [];

  if (entries.length === 0) {

    AppUtils.showToast(
      'No entries to generate.'
    );

    return;

  }

  var wrap =
    document.getElementById(
      'canvas-wrap'
    );

  wrap.style.display =
    'block';

  wrap.innerHTML =
    '';

  var canvas =
    document.createElement(
      'canvas'
    );

  canvas.width = 1080;

  canvas.height = 1920;

  canvas.style.width =
    '100%';

  canvas.style.borderRadius =
    '20px';

  wrap.appendChild(canvas);

  var ctx =
    canvas.getContext('2d');

  // BACKGROUND

  ctx.fillStyle =
    '#0d0d0d';

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  // TITLE

  ctx.fillStyle =
    '#f4d15c';

  ctx.font =
    'bold 72px sans-serif';

  ctx.fillText(
    'MovieBase Wrapped',
    80,
    140
  );

  // TOTAL TITLES

  ctx.fillStyle =
    '#ffffff';

  ctx.font =
    'bold 120px sans-serif';

  ctx.fillText(
    String(entries.length),
    80,
    320
  );

  ctx.font =
    '42px sans-serif';

  ctx.fillStyle =
    '#aaaaaa';

  ctx.fillText(
    'Titles Watched',
    80,
    390
  );

  // HOURS

  var totalMinutes =
    entries.reduce(function(sum, e) {

      return sum + (e.runtime || 0);

    }, 0);

  ctx.fillStyle =
    '#ffffff';

  ctx.font =
    'bold 96px sans-serif';

  ctx.fillText(
    AppUtils.formatHours(totalMinutes),
    80,
    560
  );

  ctx.font =
    '42px sans-serif';

  ctx.fillStyle =
    '#aaaaaa';

  ctx.fillText(
    'Total Watch Time',
    80,
    620
  );

  // TOP TITLE

  var top =
    entries[0];

  ctx.fillStyle =
    '#f4d15c';

  ctx.font =
    'bold 56px sans-serif';

  ctx.fillText(
    'Top Pick',
    80,
    800
  );

  ctx.fillStyle =
    '#ffffff';

  ctx.font =
    'bold 64px sans-serif';

  ctx.fillText(
    top.title,
    80,
    900
  );

  ctx.font =
    '42px sans-serif';

  ctx.fillStyle =
    '#aaaaaa';

  ctx.fillText(
    AppUtils.ratingToEmoji(top.rating)
      + ' '
      + top.rating
      + '/5',
    80,
    970
  );

  // POSTER

  if (top.poster) {

    var img =
      new Image();

    img.crossOrigin =
      'anonymous';

    img.onload =
      function() {

        ctx.drawImage(
          img,
          80,
          1060,
          420,
          620
        );

      };

    img.src =
      AppUtils.getPosterUrl(
        top.poster
      );

  }

  // FOOTER

  ctx.fillStyle =
    '#666666';

  ctx.font =
    '36px sans-serif';

  ctx.fillText(
    'Generated with MovieBase',
    80,
    1840
  );

  document.getElementById(
    'btn-download'
  ).style.display =
    'block';

}

});