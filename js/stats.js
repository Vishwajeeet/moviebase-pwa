// Stats page: yearly and monthly statistics with Spotify Wrapped style canvas card
AppAuth.requireAuth(function (user) {

  var uid = user.uid;

  var allEntries = [];

  var currentYear = 'all';

  var currentMonth = 0;

  var statsTab = 'media';

  document.getElementById('stats-type-pills').addEventListener('click', function (e) {
    var btn = e.target.closest('.type-pill');
    if (!btn) return;
    document.querySelectorAll('#stats-type-pills .type-pill').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    statsTab = btn.dataset.tab === 'games' ? 'games' : 'media';
    render();
  });

  // BACK BUTTON

  document.getElementById('btn-back')
    .addEventListener('click', function () {
      if (document.referrer && document.referrer.indexOf(window.location.origin) === 0) {
        window.history.back();
      } else {
        window.location.href = '/home.html';
      }
    });

  // LOAD ENTRIES

  AppDB.getAllEntries(uid)
    .then(function (entries) {


      allEntries = entries || [];

      populateYearSelect(allEntries);

      render();

    })
    .catch(function (err) {

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

    entries.forEach(function (entry) {

      if (entry.yearWatched) {
        years[entry.yearWatched] = true;
      }

    });

    var sortedYears =
      Object.keys(years)
        .sort(function (a, b) {
          return b - a;
        });

    select.innerHTML = '';

    var allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'All Years';
    select.appendChild(allOption);

    sortedYears.forEach(function (year) {

      var option =
        document.createElement('option');

      option.value = year;

      option.textContent = year;

      select.appendChild(option);

    });

    select.value = currentYear;

    select.addEventListener(
      'change',
      function () {

        currentYear =
          select.value === 'all' ? 'all' : Number(select.value);

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

    chips.forEach(function (chip) {

      chip.addEventListener(
        'click',
        function () {

          chips.forEach(function (c) {
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
      function (entry) {

        var typeMatch =
          statsTab === 'games'
            ? entry.type === 'game'
            : entry.type !== 'game';

        var yearMatch =
          currentYear === 'all' || entry.yearWatched === currentYear;

        var monthMatch =
          currentMonth === 0
          || entry.monthWatched === currentMonth;

        return typeMatch && yearMatch && monthMatch;

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

    var isGamesTab = statsTab === 'games';

    document.getElementById('media-stats-strip').style.display = isGamesTab ? 'none' : 'grid';
    document.getElementById('games-stats-strip').style.display = isGamesTab ? 'grid' : 'none';
    document.getElementById('top-picks-section').style.display = isGamesTab ? 'none' : 'block';
    document.getElementById('deep-cuts-section').style.display = isGamesTab ? 'none' : 'block';
    document.getElementById('leaderboard-section').style.display = isGamesTab ? 'block' : 'none';

    if (isGamesTab) {
      renderGameStats(entries);
    }

    renderPlaytimeLeaderboard(entries);

    updateUIState(entries);

    window.currentStatsEntries = entries;

  }
  function renderGameStats(entries) {

    document.querySelector('#g-total .stat-number').textContent = entries.length;

    var totalMinutes = entries.reduce(function (sum, e) { return sum + (e.playtime || 0) * 60; }, 0);
    document.querySelector('#g-hours .stat-number').textContent = AppUtils.formatHours(totalMinutes);

    document.querySelector('#g-completed .stat-number').textContent =
      entries.filter(function (e) { return e.completionStatus === 'completed'; }).length;

    document.querySelector('#g-playing .stat-number').textContent =
      entries.filter(function (e) { return e.completionStatus === 'playing'; }).length;

    document.querySelector('#g-dropped .stat-number').textContent =
      entries.filter(function (e) { return e.completionStatus === 'dropped'; }).length;

    document.querySelector('#g-wishlist .stat-number').textContent =
      entries.filter(function (e) { return e.completionStatus === 'wishlist'; }).length;

    var genreMap = {};
    entries.forEach(function (e) {
      (e.genres || []).forEach(function (g) { genreMap[g] = (genreMap[g] || 0) + 1; });
      if (e.category) genreMap[e.category] = (genreMap[e.category] || 0) + 1;
    });
    var topGenre = Object.keys(genreMap).sort(function (a, b) { return genreMap[b] - genreMap[a]; })[0] || '—';
    document.querySelector('#g-genre .stat-number').textContent = topGenre;

    var rated = entries.filter(function (e) { return e.gameRating; });
    var avgRating = rated.length
      ? (rated.reduce(function (sum, e) { return sum + e.gameRating; }, 0) / rated.length)
      : 0;
    document.querySelector('#g-rating .stat-number').textContent = avgRating ? avgRating.toFixed(1) : '—';

    var monthMap = {};
    entries.forEach(function (e) {
      if (e.monthWatched) monthMap[e.monthWatched] = (monthMap[e.monthWatched] || 0) + 1;
    });
    var activeMonth = Object.keys(monthMap).sort(function (a, b) { return monthMap[b] - monthMap[a]; })[0];
    document.querySelector('#g-month .stat-number').textContent = activeMonth ? AppUtils.monthShort(Number(activeMonth)) : '—';

    var longest = null;
    entries.forEach(function (e) {
      if (!longest || (e.playtime || 0) > (longest.playtime || 0)) longest = e;
    });
    document.querySelector('#g-longest .stat-number').textContent =
      (longest && longest.playtime) ? longest.title + ' (' + longest.playtime + 'h)' : '—';

  }

  function renderStats(entries) {

    // TOTAL TITLES

    document.querySelector(
      '#s-titles .stat-number'
    ).textContent =
      entries.length;

    // HOURS WATCHED

    var totalMinutes =
      entries.reduce(function (sum, entry) {

        return sum + (entry.runtime || 0);

      }, 0);

    document.querySelector(
      '#s-hours .stat-number'
    ).textContent =
      AppUtils.formatHours(totalMinutes);

    // MOVIES

    var movieCount =
      entries.filter(function (entry) {

        return entry.type === 'movie';

      }).length;

    document.querySelector(
      '#s-movies .stat-number'
    ).textContent =
      movieCount;

    // SERIES

    var seriesCount =
      entries.filter(function (entry) {

        return entry.type === 'series';

      }).length;

    document.querySelector(
      '#s-series .stat-number'
    ).textContent =
      seriesCount;

    // TOP GENRE

    var genreMap = {};

    entries.forEach(function (entry) {

      (entry.genres || [])
        .forEach(function (genre) {

          genreMap[genre] =
            (genreMap[genre] || 0) + 1;

        });

    });

    var topGenre = '—';

    var topGenreCount = 0;

    Object.keys(genreMap)
      .forEach(function (genre) {

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
        entries.reduce(function (sum, entry) {

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

    entries.forEach(function (entry) {

      var month =
        entry.monthWatched;

      if (!month) return;

      monthMap[month] =
        (monthMap[month] || 0) + 1;

    });

    var activeMonth = '—';

    var activeCount = 0;

    Object.keys(monthMap)
      .forEach(function (month) {

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

    entries.forEach(function (entry) {

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

    entries.forEach(function (entry) {

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
      .forEach(function (month) {

        var ratings =
          monthRatings[month];

        var avg =
          ratings.reduce(
            function (sum, r) {
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

    entries.forEach(function (entry) {

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
      entries.filter(function (entry) {

        return entry.rating === 5;

      }).slice(0, 4);

    if (topRated.length === 0) {

      container.innerHTML =
        '<p class="text-muted">No 🤩 ratings in this period.</p>';

      return;

    }

    topRated.forEach(function (entry) {

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

        '<span class="badge badge-tl">' +
        AppUtils.ratingToEmoji(entry.rating) +
        '</span>' +

        '<div class="poster-overlay">' +

        '<div class="poster-title">' +
        entry.title +
        '</div>' +

        '<div class="poster-sub">' +
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

    var isGamesFacts = statsTab === 'games';

    var totalMinutes =
      entries.reduce(function (sum, entry) {

        return sum + (isGamesFacts ? (entry.playtime || 0) * 60 : (entry.runtime || 0));

      }, 0);

    var ratedEntries = isGamesFacts
      ? entries.filter(function (e) { return e.gameRating; })
      : entries;

    var avgRating =
      ratedEntries.length
        ? ratedEntries.reduce(function (sum, entry) {
          return sum + (isGamesFacts ? entry.gameRating : (entry.rating || 0));
        }, 0) / ratedEntries.length
        : 0;

    var highestRated =
      entries.filter(function (entry) {

        return isGamesFacts ? entry.gameRating >= 9 : entry.rating === 5;

      }).length;

    var facts = isGamesFacts ? [

      '🕹️ You played for '
      + AppUtils.formatHours(totalMinutes),

      '⭐ Your average game rating is '
      + avgRating.toFixed(1) + '/10',

      '🏆 You gave '
      + highestRated
      + ' game'
      + (highestRated !== 1 ? 's' : '')
      + ' a 9+ score',

      '🎮 You logged '
      + entries.length
      + ' total games'

    ] : [

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

    facts.forEach(function (fact) {

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
      .filter(function (e) { return e.type === 'game' && e.playtime > 0; })
      .sort(function (a, b) { return b.playtime - a.playtime; })
      .slice(0, 5);

    if (games.length === 0) {
      wrap.innerHTML = '<p class="text-sm text-muted">No tracked playtime yet.</p>';
      return;
    }

    var medals = ['🥇', '🥈', '🥉'];
    var maxHours = games[0].playtime;
    wrap.innerHTML = games.map(function (g, i) {
      var pct = Math.max(8, Math.round((g.playtime / maxHours) * 100));
      var rankLabel = medals[i] || ('#' + (i + 1));
      return (
        '<div class="leaderboard-row' + (i === 0 ? ' leaderboard-row-top' : '') + '">' +
        '<div class="leaderboard-rank">' + rankLabel + '</div>' +
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
      .sort(function (a, b) {
        return a.monthWatched - b.monthWatched;
      });

    var months = {};

    sortedByMonth.forEach(function (e) {
      if (e.monthWatched) {
        months[e.monthWatched] = true;
      }
    });

    var sortedMonths =
      Object.keys(months)
        .map(Number)
        .sort(function (a, b) {
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

    entries.forEach(function (entry) {

      var month = entry.monthWatched;

      if (month) {
        monthCounts[month] =
          (monthCounts[month] || 0) + 1;
      }

    });

    var maxMonth = 0;

    var maxCount = 0;

    Object.keys(monthCounts)
      .forEach(function (m) {

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
      entries.filter(function (e) {
        return e.type === 'movie';
      }).length;

    var seriesCnt =
      entries.filter(function (e) {
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
        function (sum, entry) {
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
      entries.reduce(function (sum, e) {
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

    deepCuts.forEach(function (cut) {

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
      function () {

        generateWrappedCard();

      }
    );

    downloadBtn.addEventListener(
      'click',
      function () {

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

    var isGames = statsTab === 'games';
    var accent = isGames ? '#a78bfa' : '#f4d15c';
    var accentDim = isGames ? 'rgba(124,58,237,0.35)' : 'rgba(201,168,76,0.35)';

    var periodLabel = currentYear === 'all' ? 'All Time' : String(currentYear);
    if (currentMonth !== 0) periodLabel = AppUtils.monthName(currentMonth) + ' ' + currentYear;

    var wrap = document.getElementById('canvas-wrap');
    wrap.style.display = 'block';
    wrap.innerHTML = '';

    var W = 1080, H = 1920;
    var canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = '100%';
    canvas.style.borderRadius = '20px';
    wrap.appendChild(canvas);
    var ctx = canvas.getContext('2d');

    var sorted = entries.slice().sort(function (a, b) {
      var ra = isGames ? (a.gameRating || 0) : (a.rating || 0);
      var rb = isGames ? (b.gameRating || 0) : (b.rating || 0);
      return rb - ra;
    });
    var top = sorted[0];
    var heroEntries = sorted.slice(0, 3);

    document.getElementById('btn-download').style.display = 'none';

    function loadImg(url) {
      return new Promise(function (resolve) {
        if (!url) return resolve(null);
        var img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function () { resolve(img); };
        img.onerror = function () { resolve(null); };
        img.src = AppUtils.getCanvasSafeUrl(url);
      });
    }

    function truncate(text, maxWidth) {
      var t = text;
      while (ctx.measureText(t).width > maxWidth && t.length > 3) t = t.slice(0, -1);
      if (t !== text) t = t.trim() + '…';
      return t;
    }

    function drawStatCard(cx, cy, cw, ch, value, label) {
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      AppUtils.roundRectPath(ctx, cx, cy, cw, ch, 20);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1.5;
      AppUtils.roundRectPath(ctx, cx, cy, cw, ch, 20);
      ctx.stroke();

      ctx.fillStyle = accent;
      var valText = String(value);
      var fontSize = valText.length > 9 ? 30 : valText.length > 6 ? 36 : 44;
      ctx.font = 'bold ' + fontSize + 'px Inter, sans-serif';
      ctx.fillText(truncate(valText, cw - 44), cx + 22, cy + ch - 46);

      ctx.fillStyle = '#999999';
      ctx.font = '600 20px Inter, sans-serif';
      ctx.fillText(label.toUpperCase(), cx + 22, cy + ch - 18);
    }

    Promise.all(heroEntries.map(function (e) { return loadImg(AppUtils.getPosterUrl(e.poster)); }))
      .then(function (heroImgs) {
        return loadImg(AppUtils.getPosterUrl(top.poster)).then(function (topImg) {
          return { heroImgs: heroImgs, topImg: topImg };
        });
      })
      .then(function (imgs) {

        // ===== BASE =====
        ctx.fillStyle = '#0b0b0d';
        ctx.fillRect(0, 0, W, H);

        // ===== HERO STRIP (top ~600px): fanned-out posters =====
        var heroH = 620;
        ctx.save();
        AppUtils.roundRectPath(ctx, 0, 0, W, heroH + 60, 0);
        ctx.clip();

        var tileW = 420, tileH = 600;
        var positions = [
          { x: W / 2 - tileW / 2 - 210, y: 40, rot: -0.09, z: 1 },
          { x: W / 2 - tileW / 2, y: 10, rot: 0, z: 3 },
          { x: W / 2 - tileW / 2 + 210, y: 40, rot: 0.09, z: 2 }
        ];
        positions.forEach(function (pos, i) {
          var img = imgs.heroImgs[i];
          ctx.save();
          ctx.translate(pos.x + tileW / 2, pos.y + tileH / 2);
          ctx.rotate(pos.rot);
          ctx.translate(-tileW / 2, -tileH / 2);
          ctx.shadowColor = 'rgba(0,0,0,0.6)';
          ctx.shadowBlur = 40;
          ctx.shadowOffsetY = 20;
          if (img) {
            AppUtils.roundRectPath(ctx, 0, 0, tileW, tileH, 24);
            ctx.clip();
            var scale = Math.max(tileW / img.width, tileH / img.height);
            var dw = img.width * scale, dh = img.height * scale;
            ctx.drawImage(img, (tileW - dw) / 2, (tileH - dh) / 2, dw, dh);
          } else {
            ctx.fillStyle = '#1e1e1e';
            AppUtils.roundRectPath(ctx, 0, 0, tileW, tileH, 24);
            ctx.fill();
          }
          ctx.restore();
        });

        // fade hero into base panel
        var fade = ctx.createLinearGradient(0, heroH - 260, 0, heroH + 60);
        fade.addColorStop(0, 'rgba(11,11,13,0)');
        fade.addColorStop(1, 'rgba(11,11,13,1)');
        ctx.fillStyle = fade;
        ctx.fillRect(0, 0, W, heroH + 60);

        // subtle top scrim so header text is legible
        var topScrim = ctx.createLinearGradient(0, 0, 0, 220);
        topScrim.addColorStop(0, 'rgba(0,0,0,0.55)');
        topScrim.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = topScrim;
        ctx.fillRect(0, 0, W, 220);
        ctx.restore();

        // ===== HEADER (over hero) =====
        ctx.textAlign = 'left';
        ctx.fillStyle = accent;
        ctx.font = '800 30px Inter, sans-serif';
        ctx.fillText((isGames ? '🎮 GAMES WRAPPED' : '🎬 WRAPPED') + ' · ' + periodLabel.toUpperCase(), 60, 80);

        // ===== ACCENT DIVIDER =====
        ctx.fillStyle = accent;
        ctx.fillRect(60, heroH + 20, 90, 8);

        // ===== BIG NUMBER =====
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 130px Inter, sans-serif';
        ctx.fillText(String(entries.length), 58, heroH + 175);
        ctx.font = '500 34px Inter, sans-serif';
        ctx.fillStyle = '#bbbbbb';
        ctx.fillText(isGames ? 'games logged' : 'titles logged', 62, heroH + 215);

        // ===== STAT CARD GRID =====
        var totalMinutes = entries.reduce(function (sum, e) {
          return sum + (isGames ? (e.playtime || 0) * 60 : (e.runtime || 0));
        }, 0);
        var totalHoursDisplay = AppUtils.formatHours(totalMinutes);

        var genreCounts = {};
        entries.forEach(function (e) {
          (e.genres || []).forEach(function (g) { genreCounts[g] = (genreCounts[g] || 0) + 1; });
          if (e.category) genreCounts[e.category] = (genreCounts[e.category] || 0) + 1;
        });
        var topGenre = Object.keys(genreCounts).sort(function (a, b) { return genreCounts[b] - genreCounts[a]; })[0] || '—';

        var monthCounts = {};
        entries.forEach(function (e) { if (e.monthWatched) monthCounts[e.monthWatched] = (monthCounts[e.monthWatched] || 0) + 1; });
        var bestMonthNum = Object.keys(monthCounts).sort(function (a, b) { return monthCounts[b] - monthCounts[a]; })[0];
        var bestMonth = bestMonthNum ? AppUtils.monthShort(Number(bestMonthNum)) : '—';

        var ratedEntries = isGames ? entries.filter(function (e) { return e.gameRating; }) : entries.filter(function (e) { return e.rating; });
        var avgRatingVal = ratedEntries.length
          ? ratedEntries.reduce(function (s, e) { return s + (isGames ? e.gameRating : e.rating); }, 0) / ratedEntries.length
          : 0;
        var avgRatingText = avgRatingVal ? (isGames ? avgRatingVal.toFixed(1) + '/10' : avgRatingVal.toFixed(1) + '/5') : '—';

        var statCards = isGames
          ? [
            [totalHoursDisplay, 'Hours Played'],
            [topGenre, 'Top Genre'],
            [bestMonth, 'Most Active'],
            [avgRatingText, 'Avg Rating'],
            [entries.filter(function (e) { return e.completionStatus === 'completed'; }).length + '', 'Completed'],
            [entries.filter(function (e) { return e.completionStatus === 'playing'; }).length + '', 'In Progress']
          ]
          : [
            [totalHoursDisplay, 'Watch Time'],
            [topGenre, 'Top Genre'],
            [bestMonth, 'Best Month'],
            [avgRatingText, 'Avg Rating'],
            [entries.filter(function (e) { return e.type === 'movie'; }).length + '', 'Movies'],
            [entries.filter(function (e) { return e.type === 'series'; }).length + '', 'Series Seasons']
          ];

        var gridTop = heroH + 260;
        var gap = 20;
        var cardW = (W - 60 * 2 - gap * 2) / 3;
        var cardH = 150;
        statCards.forEach(function (card, i) {
          var col = i % 3, row = Math.floor(i / 3);
          var cx = 60 + col * (cardW + gap);
          var cy = gridTop + row * (cardH + gap);
          drawStatCard(cx, cy, cardW, cardH, card[0], card[1]);
        });

        // ===== TOP PICK (with real poster thumbnail) =====
        var topY = gridTop + 2 * (cardH + gap) + 55;

        ctx.fillStyle = accent;
        ctx.font = '800 28px Inter, sans-serif';
        ctx.fillText('⭐ TOP PICK', 60, topY);

        var thumbW = 130, thumbH = 185;
        var thumbX = 60, thumbY = topY + 25;
        ctx.save();
        AppUtils.roundRectPath(ctx, thumbX, thumbY, thumbW, thumbH, 14);
        ctx.clip();
        if (imgs.topImg) {
          var s = Math.max(thumbW / imgs.topImg.width, thumbH / imgs.topImg.height);
          var dw2 = imgs.topImg.width * s, dh2 = imgs.topImg.height * s;
          ctx.drawImage(imgs.topImg, thumbX + (thumbW - dw2) / 2, thumbY + (thumbH - dh2) / 2, dw2, dh2);
        } else {
          ctx.fillStyle = '#1e1e1e';
          ctx.fillRect(thumbX, thumbY, thumbW, thumbH);
        }
        ctx.restore();

        var textX = thumbX + thumbW + 30;
        var textMaxW = W - textX - 60;

        ctx.fillStyle = '#ffffff';
        ctx.font = '800 46px Inter, sans-serif';
        ctx.fillText(truncate(top.title, textMaxW), textX, thumbY + 65);

        ctx.font = '500 28px Inter, sans-serif';
        ctx.fillStyle = '#cccccc';
        var ratingLine = isGames
          ? (top.gameRating ? top.gameRating + '/10' : 'Unrated')
          : (top.rating ? AppUtils.ratingToEmoji(top.rating) + ' ' + top.rating + '/5' : 'Unrated');
        ctx.fillText(ratingLine, textX, thumbY + 110);

        // small accent pill under rating
        ctx.fillStyle = accentDim;
        AppUtils.roundRectPath(ctx, textX, thumbY + 135, 140, 40, 20);
        ctx.fill();
        ctx.fillStyle = accent;
        ctx.font = '700 20px Inter, sans-serif';
        ctx.fillText(isGames ? (top.completionStatus || 'Logged').toUpperCase() : (top.type || '').toUpperCase(), textX + 18, thumbY + 161);

        // ===== FOOTER =====
        ctx.fillStyle = '#666666';
        ctx.font = '500 24px Inter, sans-serif';
        ctx.fillText('Generated with Playlog', 60, H - 45);

        document.getElementById('btn-download').style.display = 'block';
      });

  }

});