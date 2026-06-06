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

  var allEntries = [];

  var currentFilter = 'all';

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

        allEntries = entries;

        document.getElementById(
          'playlist-title'
        ).textContent = currentName;

        updateEntryCount();

        renderEntries(allEntries);

        setupFilterListeners();

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
        'entries-container'
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

  function updateEntryCount() {

    var filtered = getFilteredEntries();

    if (currentFilter === 'all') {

      document.getElementById(
        'entry-count'
      ).textContent =
        allEntries.length +
        ' title' +
        (allEntries.length !== 1 ? 's' : '');

    } else {

      document.getElementById(
        'entry-count'
      ).textContent =
        filtered.length +
        ' of ' +
        allEntries.length +
        ' title' +
        (allEntries.length !== 1 ? 's' : '');

    }

  }

  function getFilteredEntries() {

    if (currentFilter === 'all') {
      return allEntries;
    }

    return allEntries.filter(function(entry) {
      return entry.type === currentFilter;
    });

  }

  function setupFilterListeners() {

    var buttons = document.querySelectorAll(
      '#type-filter .toggle-btn'
    );

    buttons.forEach(function(btn) {

      btn.addEventListener('click', function() {

        buttons.forEach(function(b) {
          b.classList.remove('active');
        });

        btn.classList.add('active');

        currentFilter = btn.dataset.filter;

        updateEntryCount();

        renderEntries(getFilteredEntries());

      });

    });

  }

  function renderEntries(entries) {

  var container =
    document.getElementById(
      'entries-container'
    );

  container.innerHTML = '';

  var empty =
    document.getElementById(
      'empty-state'
    );

  if (entries.length === 0) {

    empty.style.display = 'block';

    var emptyText = empty.querySelector(
      '.empty-state-text'
    );

    if (currentFilter === 'movie') {

      emptyText.textContent =
        'No 🎬 movies in this playlist yet.';

    } else if (currentFilter === 'series') {

      emptyText.textContent =
        'No 📺 series in this playlist yet.';

    } else {

      emptyText.textContent =
        'Nothing here yet.';

    }

    return;
  }

  empty.style.display = 'none';

  var grouped = {};

  entries.forEach(function(entry) {

    var month =
      AppUtils.monthName(
        entry.monthWatched || 1
      );

    var year =
      entry.yearWatched || '';

    var key =
      month + ' ' + year;

    if (!grouped[key]) {
      grouped[key] = [];
    }

    grouped[key].push(entry);

  });

  Object.keys(grouped).forEach(function(groupName) {

    var section =
      document.createElement('section');

    section.style.marginBottom = '36px';

    var header =
      document.createElement('div');

    header.style.display = 'flex';
    header.style.justifyContent =
      'space-between';
    header.style.alignItems =
      'center';
    header.style.marginBottom =
      '16px';

    header.innerHTML = (

      '<h2 style="' +
      'font-size:20px;' +
      'font-weight:700' +
      '">' +

      groupName +

      '</h2>' +

      '<span class="text-sm text-muted">' +

      grouped[groupName].length +

      ' title' +

      (
        grouped[groupName].length !== 1
        ? 's'
        : ''
      ) +

      '</span>'

    );

    section.appendChild(header);

    var grid =
      document.createElement('div');

    grid.className = 'grid-2';

    grouped[groupName].forEach(function(entry) {

      var card =
        document.createElement('div');

      card.className = 'card';

      card.dataset.entryId = entry.id;

      var posterUrl =
        AppUtils.getPosterUrl(
          entry.poster
        );

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

          '<button class="btn-menu-entry" data-entry-id="' + entry.id + '">⋮</button>' +

          '<p class="poster-title">' +

            entry.title +

          '</p>' +

        '</div>'

      );

      card.querySelector('.btn-menu-entry').addEventListener('click', function(e) {

        e.stopPropagation();

        openEntryOptions(entry);

      });

      grid.appendChild(card);

    });

    section.appendChild(grid);

    container.appendChild(section);

  });

}

  function goToAdd() {

    window.location.href =
      '/add.html?playlistId=' +
      playlistId;

  }

  // Entry context for modals

  var currentEditEntry = null;
  var currentDeleteEntry = null;
  var currentMoveEntry = null;
  var allPlaylists = [];

  // OPTIONS MENU

  function openEntryOptions(entry) {

    currentEditEntry = entry;

    currentDeleteEntry = entry;

    document.getElementById(
      'entry-options-modal'
    ).classList.add('open');

  }

  // EDIT ENTRY

  function openEditModal(entry) {

    currentEditEntry = entry;

    document.getElementById(
      'entry-options-modal'
    ).classList.remove('open');

    document.getElementById(
      'edit-entry-title'
    ).textContent = entry.title;

    buildEditMonthChips(
      entry.monthWatched
    );

    buildEditEmojiRow(
      entry.rating
    );

    document.getElementById(
      'edit-entry-modal'
    ).classList.add('open');

  }

  function buildEditMonthChips(selectedMonth) {

    var container =
      document.getElementById(
        'edit-month-chips'
      );

    container.innerHTML = '';

    var months = [
      'Jan','Feb','Mar','Apr',
      'May','Jun','Jul','Aug',
      'Sep','Oct','Nov','Dec'
    ];

    months.forEach(function(month, index) {

      var btn = document.createElement('button');

      btn.className = 'month-chip';

      if (index + 1 === selectedMonth) {
        btn.classList.add('selected');
      }

      btn.textContent = month;

      btn.dataset.month = index + 1;

      btn.addEventListener('click', function() {

        container.querySelectorAll('.month-chip')
          .forEach(function(c) {
            c.classList.remove('selected');
          });

        btn.classList.add('selected');

        currentEditEntry.monthWatched =
          index + 1;

      });

      container.appendChild(btn);

    });

  }

  function buildEditEmojiRow(selectedRating) {

    var row =
      document.getElementById(
        'edit-emoji-row'
      );

    row.innerHTML = '';

    var emojis = ['😭','🙁','😐','😊','🤩'];

    emojis.forEach(function(emoji, index) {

      var btn = document.createElement('button');

      btn.className = 'emoji-btn';

      if (index + 1 === selectedRating) {
        btn.classList.add('selected');
      }

      btn.textContent = emoji;

      btn.addEventListener('click', function() {

        row.querySelectorAll('.emoji-btn')
          .forEach(function(b) {
            b.classList.remove('selected');
          });

        btn.classList.add('selected');

        currentEditEntry.rating = index + 1;

      });

      row.appendChild(btn);

    });

  }

  function saveEditEntry() {

    if (!currentEditEntry) return;

    var updateData = {
      monthWatched: currentEditEntry.monthWatched,
      rating: currentEditEntry.rating
    };

    AppDB.updateEntry(
      uid,
      currentEditEntry.id,
      updateData
    )
      .then(function() {

        document.getElementById(
          'edit-entry-modal'
        ).classList.remove('open');

        updateRatingBadge(
          currentEditEntry.id,
          currentEditEntry.rating
        );

        AppUtils.showToast(
          'Updated ✓'
        );

      })
      .catch(function(err) {

        console.error(err);

        AppUtils.showToast(
          'Failed to update.'
        );

      });

  }

  function updateRatingBadge(entryId, newRating) {

    var card = document.querySelector(
      '[data-entry-id="' + entryId + '"]'
    ).closest('.card');

    if (!card) return;

    var ratingBadge =
      card.querySelector('.badge-tr');

    if (ratingBadge) {

      ratingBadge.textContent =
        AppUtils.ratingToEmoji(newRating);

    }

  }

  // DELETE ENTRY

  function openDeleteConfirm(entry) {

    currentDeleteEntry = entry;

    document.getElementById(
      'entry-options-modal'
    ).classList.remove('open');

    document.getElementById(
      'delete-confirm-modal'
    ).classList.add('open');

  }

  function deleteCurrentEntry() {

    if (!currentDeleteEntry) return;

    AppDB.deleteEntry(
      uid,
      currentDeleteEntry.id
    )
      .then(function() {

        document.getElementById(
          'delete-confirm-modal'
        ).classList.remove('open');

        var card = document.querySelector(
          '[data-entry-id="' +
          currentDeleteEntry.id +
          '"]'
        ).closest('.card');

        if (card) {
          card.style.opacity = '0';

          setTimeout(function() {
            card.remove();
          }, 200);
        }

        allEntries = allEntries.filter(function(e) {
          return e.id !== currentDeleteEntry.id;
        });

        updateEntryCount();

        AppUtils.showToast(
          'Entry deleted'
        );

      })
      .catch(function(err) {

        console.error(err);

        AppUtils.showToast(
          'Failed to delete.'
        );

      });

  }

  // MOVE ENTRY

  function openMoveToModal(entry) {

    currentMoveEntry = entry;

    document.getElementById(
      'entry-options-modal'
    ).classList.remove('open');

    document.getElementById(
      'move-to-modal'
    ).classList.add('open');

    loadPlaylistsForMove();

  }

  function loadPlaylistsForMove() {

    AppDB.getPlaylists(uid)
      .then(function(playlists) {

        allPlaylists = playlists;

        buildPlaylistsList(playlists);

      })
      .catch(function(err) {

        console.error(err);

        AppUtils.showToast(
          'Failed to load playlists.'
        );

      });

  }

  function buildPlaylistsList(playlists) {

    var container =
      document.getElementById(
        'playlists-list'
      );

    container.innerHTML = '';

    var filtered = playlists.filter(function(p) {
      return p.id !== playlistId;
    });

    if (filtered.length === 0) {

      container.innerHTML =
        '<p class="text-muted" style="padding:12px 0">No other playlists.</p>';

      return;
    }

    filtered.forEach(function(playlist) {

      var entryCount = 0;

      for (var i = 0; i < allEntries.length; i++) {

        if (allEntries[i].playlistId === playlist.id) {
          entryCount++;
        }

      }

      var item = document.createElement('button');

      item.className = 'playlist-list-item';

      item.innerHTML = (

        '<div style="flex:1;text-align:left">' +

          '<p style="font-weight:600;font-size:15px;color:var(--text-primary);margin-bottom:4px">' +

            playlist.name +

          '</p>' +

          '<p style="font-size:13px;color:var(--text-muted)">' +

            entryCount +

            ' title' +

            (entryCount !== 1 ? 's' : '') +

          '</p>' +

        '</div>'

      );

      item.addEventListener('click', function() {

        moveEntryToPlaylist(
          currentMoveEntry.id,
          playlist.id,
          playlist.name
        );

      });

      container.appendChild(item);

    });

  }

  function moveEntryToPlaylist(entryId, newPlaylistId, playlistName) {

    AppDB.moveEntry(
      uid,
      entryId,
      newPlaylistId
    )
      .then(function() {

        document.getElementById(
          'move-to-modal'
        ).classList.remove('open');

        var card = document.querySelector(
          '[data-entry-id="' + entryId + '"]'
        ).closest('.card');

        if (card) {
          card.style.opacity = '0';

          setTimeout(function() {
            card.remove();
          }, 200);
        }

        allEntries = allEntries.filter(function(e) {
          return e.id !== entryId;
        });

        updateEntryCount();

        AppUtils.showToast(
          'Moved to ' + playlistName + ' ✓'
        );

      })
      .catch(function(err) {

        console.error(err);

        AppUtils.showToast(
          'Failed to move entry.'
        );

      });

  }

  // MODAL LISTENERS

  document.getElementById(
    'btn-edit-entry'
  ).addEventListener('click', function() {

    if (currentEditEntry) {
      openEditModal(currentEditEntry);
    }

  });

  document.getElementById(
    'btn-delete-entry'
  ).addEventListener('click', function() {

    if (currentDeleteEntry) {
      openDeleteConfirm(currentDeleteEntry);
    }

  });

  document.getElementById(
    'btn-move-entry'
  ).addEventListener('click', function() {

    if (currentEditEntry) {
      openMoveToModal(currentEditEntry);
    }

  });

  document.getElementById(
    'btn-cancel-edit'
  ).addEventListener('click', function() {

    document.getElementById(
      'edit-entry-modal'
    ).classList.remove('open');

  });

  document.getElementById(
    'btn-save-edit'
  ).addEventListener('click', function() {

    saveEditEntry();

  });

  document.getElementById(
    'btn-cancel-delete'
  ).addEventListener('click', function() {

    document.getElementById(
      'delete-confirm-modal'
    ).classList.remove('open');

  });

  document.getElementById(
    'btn-confirm-delete'
  ).addEventListener('click', function() {

    deleteCurrentEntry();

  });

  document.getElementById(
    'btn-cancel-move'
  ).addEventListener('click', function() {

    document.getElementById(
      'move-to-modal'
    ).classList.remove('open');

  });

  // Close modals when clicking overlay

  document.getElementById(
    'entry-options-modal'
  ).addEventListener('click', function(e) {

    if (e.target === this) {

      this.classList.remove('open');

    }

  });

  document.getElementById(
    'edit-entry-modal'
  ).addEventListener('click', function(e) {

    if (e.target === this) {

      this.classList.remove('open');

    }

  });

  document.getElementById(
    'delete-confirm-modal'
  ).addEventListener('click', function(e) {

    if (e.target === this) {

      this.classList.remove('open');

    }

  });

  document.getElementById(
    'move-to-modal'
  ).addEventListener('click', function(e) {

    if (e.target === this) {

      this.classList.remove('open');

    }

  });

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