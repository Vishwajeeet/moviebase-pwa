var entryId = new URLSearchParams(window.location.search).get('id');
if (!entryId) window.location.href = '/home.html';

AppAuth.requireAuth(function (user) {
  var uid = user.uid;
  var docRef = db.collection('users').doc(uid).collection('entries').doc(entryId);

  docRef.get().then(function (doc) {
    if (!doc.exists) { window.location.href = '/home.html'; return; }
    render(Object.assign({ id: doc.id }, doc.data()));
  }).catch(function (err) {
    console.error(err);
    AppUtils.showToast('Failed to load entry.');
  });

  function render(e) {
    var isGame = e.type === 'game';
    var posterUrl = AppUtils.getPosterUrl(e.poster);
    document.title = e.title + ' — MediaBase';

    var rows = [];
    if (isGame) {
      var stLabels = { completed: 'Completed', playing: 'Playing', dropped: 'Dropped', wishlist: 'Wishlist' };
      rows.push(['Status', stLabels[e.completionStatus] || '—']);
      if (e.gameRating) rows.push(['Rating', e.gameRating + ' / 10']);
      if (e.playtime) rows.push(['Playtime', e.playtime + ' hours']);
      if (e.category) rows.push(['Genre', e.category]);
      if (e.monthWatched) rows.push(['Played', AppUtils.monthName(e.monthWatched) + ' ' + e.yearWatched]);
      if (e.dropReason) rows.push(['Drop Reason', e.dropReason]);
    } else {
      rows.push(['Rating', AppUtils.ratingToEmoji(e.rating) + ' (' + e.rating + '/5)']);
      rows.push(['Watched', AppUtils.monthName(e.monthWatched) + ' ' + e.yearWatched]);
      if (e.runtime) rows.push(['Runtime', AppUtils.formatHours(e.runtime)]);
      if (e.season) rows.push(['Season', e.seasonName || ('S' + e.season)]);
    }
    if (e.releaseYear) rows.push(['Release Year', e.releaseYear]);
    if (e.genres && e.genres.length) rows.push(['Genres', e.genres.join(', ')]);
    if (e.review) rows.push(['Review', e.review]);

    var rowsHTML = rows.map(function (r) {
      return '<div class="detail-row"><span class="detail-label">' + r[0] + '</span><span class="detail-value">' + r[1] + '</span></div>';
    }).join('');

    document.getElementById('entry-content').innerHTML = (
      '<div class="detail-hero">' +
        (posterUrl ? '<img class="detail-poster" src="' + posterUrl + '" alt="' + e.title + '">' : '<div class="poster-placeholder" style="height:340px;border-radius:16px">' + (isGame ? '🎮' : '🎬') + '</div>') +
      '</div>' +
      '<h2 style="margin:16px 0 4px">' + e.title + '</h2>' +
      '<p class="text-sm text-muted" style="margin-bottom:20px">' + (isGame ? '🎮 Game' : e.type === 'series' ? '📺 Series' : '🎬 Movie') + '</p>' +
      '<div class="detail-card">' + rowsHTML + '</div>' +
      '<button class="btn btn-danger" id="btn-delete" style="margin-top:20px">Delete Entry</button>'
    );

    document.getElementById('btn-delete').addEventListener('click', function () {
      document.getElementById('delete-modal').classList.add('open');
    });
    document.getElementById('btn-confirm-delete').addEventListener('click', function () {
      AppDB.deleteEntry(uid, entryId).then(function () {
        window.location.href = '/playlist.html?id=' + e.playlistId;
      }).catch(function () {
        AppUtils.showToast('Failed to delete.');
      });
    });
    document.getElementById('btn-cancel-delete').addEventListener('click', function () {
      document.getElementById('delete-modal').classList.remove('open');
    });
  }

  document.getElementById('btn-back').addEventListener('click', function () {
    window.history.back();
  });
});