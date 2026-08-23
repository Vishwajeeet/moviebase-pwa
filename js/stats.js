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

    document.getElementById('playtime-leaderboard').parentElement
      ? null : null; // no-op, keeping structure

    var leaderboardHeading = document.querySelector('#playtime-leaderboard').previousElementSibling;
    if (leaderboardHeading) leaderboardHeading.style.display = statsTab === 'games' ? '' : 'none';
    document.getElementById('playtime-leaderboard').style.display = statsTab === 'games' ? '' : 'none';

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

    var totalMinutes =
      entries.reduce(function (sum, entry) {

        return sum + (entry.runtime || 0);

      }, 0);

    var avgRating =
      entries.reduce(function (sum, entry) {

        return sum + (entry.rating || 0);

      }, 0) / entries.length;

    var highestRated =
      entries.filter(function (entry) {

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

    var maxHours = games[0].playtime;
    wrap.innerHTML = games.map(function (g, i) {
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
    var accent = isGames ? '#7c3aed' : '#f4d15c';

    var periodLabel = currentYear === 'all' ? 'All Time' : String(currentYear);
    if (currentMonth !== 0) periodLabel = AppUtils.monthName(currentMonth) + ' ' + currentYear;

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

    // Pick up to 4 posters for the background collage — prefer top-rated
    var sorted = entries.slice().sort(function (a, b) {
      var ra = isGames ? (a.gameRating || 0) : (a.rating || 0);
      var rb = isGames ? (b.gameRating || 0) : (b.rating || 0);
      return rb - ra;
    });
    var collageEntries = sorted.slice(0, 4);

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

    Promise.all(collageEntries.map(function (e) {
      return loadImg(AppUtils.getPosterUrl(e.poster));
    })).then(function (images) {

      // ===== BACKGROUND: 2x2 poster collage (or fewer tiles if fewer entries) =====
      ctx.fillStyle = '#0d0d0d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      var n = images.filter(Boolean).length || images.length;
      var cellW = canvas.width / 2;
      var cellH = canvas.height / 2;
      images.forEach(function (img, i) {
        var cx = (i % 2) * cellW;
        var cy = Math.floor(i / 2) * cellH;
        if (img) {
          var scale = Math.max(cellW / img.width, cellH / img.height);
          var dw = img.width * scale, dh = img.height * scale;
          ctx.drawImage(img, cx + (cellW - dw) / 2, cy + (cellH - dh) / 2, dw, dh);
        } else {
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(cx, cy, cellW, cellH);
        }
      });

      // Dark vignette so text is always readable, heavier toward the edges/bottom
      var grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, 'rgba(8,8,8,0.55)');
      grad.addColorStop(0.35, 'rgba(8,8,8,0.75)');
      grad.addColorStop(0.7, 'rgba(8,8,8,0.9)');
      grad.addColorStop(1, 'rgba(6,6,6,0.98)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = accent;
      ctx.fillRect(0, 0, canvas.width, 10);

      ctx.textAlign = 'left';

      // ===== HEADER =====
      ctx.fillStyle = accent;
      ctx.font = '700 34px Inter, sans-serif';
      ctx.fillText((isGames ? '🎮 GAMES WRAPPED' : '🎬 WRAPPED') + ' · ' + periodLabel.toUpperCase(), 70, 110);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 100px Inter, sans-serif';
      ctx.fillText(String(entries.length), 70, 240);
      ctx.font = '500 36px Inter, sans-serif';
      ctx.fillStyle = '#dddddd';
      ctx.fillText(isGames ? 'Games Logged' : 'Titles Watched', 70, 285);

      // ===== STAT GRID (2x2 cards) =====
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
      entries.forEach(function (e) {
        if (e.monthWatched) monthCounts[e.monthWatched] = (monthCounts[e.monthWatched] || 0) + 1;
      });
      var bestMonthNum = Object.keys(monthCounts).sort(function (a, b) { return monthCounts[b] - monthCounts[a]; })[0];
      var bestMonth = bestMonthNum ? AppUtils.monthShort(Number(bestMonthNum)) : '—';

      var completed = isGames
        ? entries.filter(function (e) { return e.completionStatus === 'completed'; }).length
        : entries.length;
      var completionPct = entries.length ? Math.round((completed / entries.length) * 100) : 0;

      var statCards = isGames
        ? [
          [totalHoursDisplay, 'Hours Played'],
          [topGenre, 'Top Genre'],
          [bestMonth, 'Most Active'],
          [completionPct + '%', 'Completed']
        ]
        : [
          [totalHoursDisplay, 'Watch Time'],
          [topGenre, 'Top Genre'],
          [bestMonth, 'Best Month'],
          [entries.filter(function (e) { return e.type === 'series'; }).length + '', 'Series Seasons']
        ];

      var gridTop = 350;
      var cardW = (canvas.width - 70 * 2 - 24) / 2;
      var cardH = 160;
      statCards.forEach(function (card, i) {
        var col = i % 2, row = Math.floor(i / 2);
        var cx = 70 + col * (cardW + 24);
        var cy = gridTop + row * (cardH + 20);

        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        AppUtils.roundRectPath(ctx, cx, cy, cardW, cardH, 18);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        AppUtils.roundRectPath(ctx, cx, cy, cardW, cardH, 18);
        ctx.stroke();

        ctx.fillStyle = accent;
        var valText = String(card[0]);
        var fontSize = valText.length > 8 ? 34 : 46;
        ctx.font = 'bold ' + fontSize + 'px Inter, sans-serif';
        ctx.fillText(valText, cx + 24, cy + 70, cardW - 48);

        ctx.fillStyle = '#bbbbbb';
        ctx.font = '500 24px Inter, sans-serif';
        ctx.fillText(card[1].toUpperCase(), cx + 24, cy + 110);
      });

      // ===== TOP PICK =====
      var top = sorted[0];
      var topY = gridTop + 2 * (cardH + 20) + 60;

      ctx.fillStyle = accent;
      ctx.font = '700 32px Inter, sans-serif';
      ctx.fillText('⭐ TOP PICK', 70, topY);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 58px Inter, sans-serif';
      var topTitle = top.title;
      while (ctx.measureText(topTitle).width > canvas.width - 140 && topTitle.length > 3) {
        topTitle = topTitle.slice(0, -1);
      }
      if (topTitle !== top.title) topTitle = topTitle.trim() + '…';
      ctx.fillText(topTitle, 70, topY + 65);

      ctx.font = '500 32px Inter, sans-serif';
      ctx.fillStyle = '#dddddd';
      var ratingLine = isGames
        ? (top.gameRating ? top.gameRating + '/10' : 'Unrated')
        : (top.rating ? AppUtils.ratingToEmoji(top.rating) + ' ' + top.rating + '/5' : 'Unrated');
      ctx.fillText(ratingLine, 70, topY + 115);

      // ===== FOOTER =====
      ctx.fillStyle = '#999999';
      ctx.font = '500 28px Inter, sans-serif';
      ctx.fillText('Generated with MediaBase', 70, canvas.height - 50);

      document.getElementById('btn-download').style.display = 'block';
    });

  };

});