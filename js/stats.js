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

  renderDeepCuts(entries);

  renderPlaytimeLeaderboard(entries);

  updateUIState(entries);

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

  // BEST MONTH (HIGHEST AVG RATING)

  var monthRatings = {};

  entries.forEach(function(entry) {

    var month = entry.monthWatched;

    if (!month) return;

    if (!monthRatings[month]) {
      monthRatings[month] = [];
    }

    monthRatings[month].push(
      entry.rating || 0
    );

  });

  var bestMonth = '—';

  var bestAvg = 0;

  Object.keys(monthRatings)
    .forEach(function(month) {

      var ratings =
        monthRatings[month];

      var avg =
        ratings.reduce(
          function(sum, r) {
            return sum + r;
          }, 0
        ) / ratings.length;

      if (avg > bestAvg) {

        bestAvg = avg;

        bestMonth =
          AppUtils.monthShort(
            Number(month)
          ) + ' ' +
          AppUtils.ratingToEmoji(
            Math.round(avg)
          );

      }

    });

  document.querySelector(
    '#s-best-month .stat-number'
  ).textContent =
    bestMonth;

  // TOTAL TITLES THIS YEAR

  var totalTitlesBox =
    document.getElementById(
      's-total-titles'
    );

  if (currentMonth === 0) {

    totalTitlesBox.style.display =
      'block';

    document.querySelector(
      '#s-total-titles .stat-number'
    ).textContent =
      entries.length;

  } else {

    totalTitlesBox.style.display =
      'none';

  }

  // COMPLETION RATE

  var monthsWithEntries = {};

  entries.forEach(function(entry) {

    var month = entry.monthWatched;

    if (month) {
      monthsWithEntries[month] = true;
    }

  });

  var completionMonths =
    Object.keys(monthsWithEntries)
      .length;

  var completionPercent =
    Math.round(
      (completionMonths / 12) * 100
    );

  document.querySelector(
    '#s-completion-rate .stat-number'
  ).textContent =
    completionMonths + '/12 (' +
    completionPercent + '%)';

}

function updateUIState(entries) {

  // MOST ACTIVE MONTH VISIBILITY

  var monthBox =
    document.getElementById('s-month');

  if (currentMonth === 0) {

    monthBox.style.display = 'block';

  } else {

    monthBox.style.display = 'none';

  }

  // WRAPPED CARD BUTTON STATE

  var generateBtn =
    document.getElementById(
      'btn-generate'
    );

  var wrappedMessage =
    document.getElementById(
      'wrapped-card-message'
    );

  if (entries.length === 0) {

    generateBtn.disabled = true;

    generateBtn.style.opacity = '0.5';

    wrappedMessage.textContent =
      'Add some entries to generate your card.';

    wrappedMessage.style.display =
      'block';

  } else {

    generateBtn.disabled = false;

    generateBtn.style.opacity = '1';

    wrappedMessage.style.display =
      'none';

  }

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
      '<p class="text-muted">No 🤩 ratings in this period.</p>';

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
function renderPlaytimeLeaderboard(entries) {
  var wrap = document.getElementById('playtime-leaderboard');
  if (!wrap) return;

  var games = entries
    .filter(function(e) { return e.type === 'game' && e.playtime > 0; })
    .sort(function(a, b) { return b.playtime - a.playtime; })
    .slice(0, 5);

  if (games.length === 0) {
    wrap.innerHTML = '<p class="text-sm text-muted">No tracked playtime yet.</p>';
    return;
  }

  var maxHours = games[0].playtime;
  wrap.innerHTML = games.map(function(g, i) {
    var pct = Math.max(8, Math.round((g.playtime / maxHours) * 100));
    return (
      '<div class="leaderboard-row">' +
        '<div class="leaderboard-rank">#' + (i + 1) + '</div>' +
        '<div class="leaderboard-info">' +
          '<div class="leaderboard-title">' + g.title + '</div>' +
          '<div class="leaderboard-bar-track"><div class="leaderboard-bar-fill" style="width:' + pct + '%"></div></div>' +
        '</div>' +
        '<div class="leaderboard-hours">' + g.playtime + 'h</div>' +
      '</div>'
    );
  }).join('');
}
function renderDeepCuts(entries) {

  var container =
    document.getElementById(
      'deep-cuts'
    );

  container.innerHTML = '';

  if (entries.length < 3) {

    container.innerHTML =
      '<p class="text-muted">Add more entries for insights.</p>';

    return;

  }

  var deepCuts = [];

  // LONGEST WATCH STREAK

  var sortedByMonth = entries.slice()
    .sort(function(a, b) {
      return a.monthWatched - b.monthWatched;
    });

  var months = {};

  sortedByMonth.forEach(function(e) {
    if (e.monthWatched) {
      months[e.monthWatched] = true;
    }
  });

  var sortedMonths =
    Object.keys(months)
      .map(Number)
      .sort(function(a, b) {
        return a - b;
      });

  var maxStreak = 1;

  var currentStreak = 1;

  for (
    var i = 1;
    i < sortedMonths.length;
    i++
  ) {

    if (
      sortedMonths[i] ===
      sortedMonths[i - 1] + 1
    ) {

      currentStreak++;

      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }

    } else {

      currentStreak = 1;

    }

  }

  if (maxStreak >= 2) {

    deepCuts.push(
      '🔥 Your longest watch streak was ' +
      maxStreak +
      ' months in a row'
    );

  }

  // MOST PRODUCTIVE MONTH

  var monthCounts = {};

  entries.forEach(function(entry) {

    var month = entry.monthWatched;

    if (month) {
      monthCounts[month] =
        (monthCounts[month] || 0) + 1;
    }

  });

  var maxMonth = 0;

  var maxCount = 0;

  Object.keys(monthCounts)
    .forEach(function(m) {

      if (monthCounts[m] > maxCount) {

        maxCount = monthCounts[m];

        maxMonth = Number(m);

      }

    });

  if (maxMonth > 0) {

    deepCuts.push(
      '📊 Your most productive month was ' +
      AppUtils.monthName(maxMonth) +
      ' — you logged ' +
      maxCount +
      ' title' +
      (maxCount !== 1 ? 's' : '')
    );

  }

  // SERIES VS MOVIES

  var movieCnt =
    entries.filter(function(e) {
      return e.type === 'movie';
    }).length;

  var seriesCnt =
    entries.filter(function(e) {
      return e.type === 'series';
    }).length;

  if (seriesCnt > movieCnt) {

    deepCuts.push(
      '📺 You watched more series than movies'
    );

  } else if (movieCnt > seriesCnt) {

    deepCuts.push(
      '🎬 You\'re a movie person'
    );

  }

  // RATING ASSESSMENT

  var avgRating =
    entries.reduce(
      function(sum, entry) {
        return sum + (entry.rating || 0);
      }, 0
    ) / entries.length;

  if (avgRating >= 4) {

    deepCuts.push(
      '😊 You\'re generous — avg ' +
      avgRating.toFixed(1) +
      ' out of 5'
    );

  } else if (avgRating < 3) {

    deepCuts.push(
      '🤨 You\'re a tough critic — avg ' +
      avgRating.toFixed(1) +
      ' out of 5'
    );

  }

  // BACK-TO-BACK WATCH TIME

  var totalMinutes =
    entries.reduce(function(sum, e) {
      return sum + (e.runtime || 0);
    }, 0);

  var totalDays =
    totalMinutes / 60 / 24;

  if (totalDays >= 1) {

    deepCuts.push(
      '⏱️ If you watched back-to-back, you\'d finish in ' +
      totalDays.toFixed(1) +
      ' days'
    );

  }

  deepCuts.forEach(function(cut) {

    var box =
      document.createElement('div');

    box.className =
      'fun-fact-box';

    box.style.marginBottom =
      '12px';

    box.textContent =
      cut;

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

  var entries = window.currentStatsEntries || [];
  if (entries.length === 0) {
    AppUtils.showToast('No entries to generate.');
    return;
  }

  var wrap = document.getElementById('canvas-wrap');
  wrap.style.display = 'block';
  wrap.innerHTML = '';

  var canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  canvas.style.width = '100%';
  canvas.style.borderRadius = '20px';
  wrap.appendChild(canvas);
  var ctx = canvas.getContext('2d');

  var top = entries[0];
  var posterUrl = top.poster ? AppUtils.getPosterUrl(top.poster) : null;

  function loadPosterImg() {
    return new Promise(function(resolve) {
      if (!posterUrl) return resolve(null);
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function() { resolve(img); };
      img.onerror = function() { resolve(null); };
      img.src = AppUtils.getCanvasSafeUrl(posterUrl);
    });
  }

  document.getElementById('btn-download').style.display = 'none';

  loadPosterImg().then(function(img) {

    // BACKGROUND — full-bleed poster or fallback color
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (img) {
      var scale = Math.max(canvas.width / img.width, canvas.height / img.height);
      var dw = img.width * scale, dh = img.height * scale;
      ctx.drawImage(img, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
    }

    // DARK OVERLAY so text is readable over the poster
    var grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, 'rgba(10,10,10,0.55)');
    grad.addColorStop(0.45, 'rgba(10,10,10,0.75)');
    grad.addColorStop(1, 'rgba(10,10,10,0.95)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // TITLE
    ctx.fillStyle = '#f4d15c';
    ctx.font = 'bold 72px sans-serif';
    ctx.fillText('MovieBase Wrapped', 80, 140);

    // TOTAL TITLES
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 120px sans-serif';
    ctx.fillText(String(entries.length), 80, 320);
    ctx.font = '42px sans-serif';
    ctx.fillStyle = '#dddddd';
    ctx.fillText('Titles Watched', 80, 390);

    // HOURS
    var totalMinutes = entries.reduce(function(sum, e) { return sum + (e.runtime || 0); }, 0);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 96px sans-serif';
    ctx.fillText(AppUtils.formatHours(totalMinutes), 80, 560);
    ctx.font = '42px sans-serif';
    ctx.fillStyle = '#dddddd';
    ctx.fillText('Total Watch Time', 80, 620);

    // TOP TITLE
    ctx.fillStyle = '#f4d15c';
    ctx.font = 'bold 56px sans-serif';
    ctx.fillText('Top Pick', 80, 1600);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px sans-serif';
    ctx.fillText(top.title, 80, 1680);
    ctx.font = '42px sans-serif';
    ctx.fillStyle = '#dddddd';
    var ratingLine = top.type === 'game'
      ? (top.gameRating ? top.gameRating + ' / 10' : '')
      : (AppUtils.ratingToEmoji(top.rating) + ' ' + top.rating + '/5');
    ctx.fillText(ratingLine, 80, 1740);

    // FOOTER
    ctx.fillStyle = '#cccccc';
    ctx.font = '36px sans-serif';
    ctx.fillText('Generated with MovieBase', 80, 1840);

    document.getElementById('btn-download').style.display = 'block';
  });

}

});