// Utility functions for DOM manipulation, formatting, and helpers
window.AppUtils = {

  showToast: function(message, duration) {
    duration = duration || 2500;
    var toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function() {
      toast.classList.remove('show');
    }, duration);
  },

  formatHours: function(totalMinutes) {
    if (!totalMinutes || totalMinutes <= 0) return '0m';
    var h = Math.floor(totalMinutes / 60);
    var m = totalMinutes % 60;
    if (h === 0) return m + 'm';
    if (m === 0) return h + 'h';
    return h + 'h ' + m + 'm';
  },

  ratingToEmoji: function(rating) {
    var map = { 1:'😭', 2:'🙁', 3:'😐', 4:'😊', 5:'🤩' };
    return map[rating] || '😐';
  },

  monthName: function(num) {
    var months = ['January','February','March','April',
      'May','June','July','August','September',
      'October','November','December'];
    return months[num - 1] || '';
  },

  monthShort: function(num) {
    var months = ['Jan','Feb','Mar','Apr','May','Jun',
      'Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[num - 1] || '';
  },

    getPosterUrl: function(path) {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return APP_CONFIG.tmdb.posterBase + path;
  },

  // Proxies external images through a CORS-friendly service so they can
  // be drawn onto a <canvas> and exported (RAWG's CDN has no CORS headers).
  getCanvasSafeUrl: function(url) {
    if (!url) return null;
    var bare = url.replace(/^https?:\/\//, '');
    return 'https://images.weserv.nl/?url=' + encodeURIComponent(bare);
  },

  debounce: function(fn, delay) {
    var timer;
    return function() {
      var args = arguments;
      var ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function() {
        fn.apply(ctx, args);
      }, delay);
    };
  },

  getCurrentMonth: function() {
    return new Date().getMonth() + 1;
  },

  getCurrentYear: function() {
    return new Date().getFullYear();
  },

  computeFunFact: function(entries, playlistCount) {
    if (!entries || entries.length === 0) {
      return '🎬 Start logging to see your stats here';
    }
    var totalMinutes = entries.reduce(function(sum, e) {
      return sum + (e.runtime || 0);
    }, 0);
    var totalHours = Math.round(totalMinutes / 60);
    var currentMonth = new Date().getMonth() + 1;
    var currentYear = new Date().getFullYear();
    var thisMonth = entries.filter(function(e) {
      return e.monthWatched === currentMonth
        && e.yearWatched === currentYear;
    }).length;
    var highRated = entries.filter(function(e) {
      return e.rating >= 4;
    }).length;
    var pct = entries.length > 0
      ? Math.round((highRated / entries.length) * 100)
      : 0;
    var facts = [
      '🕐 You\'ve watched ' + totalHours
        + ' hours — that\'s '
        + (totalHours / 24).toFixed(1)
        + ' days non-stop',
      '📂 ' + entries.length + ' titles across '
        + (playlistCount || 1) + ' playlists',
      '⭐ ' + pct + '% of what you watched'
        + ' got 4 stars or above',
      '📅 This month you\'ve logged '
        + thisMonth + ' title'
        + (thisMonth !== 1 ? 's' : '')
    ];
    return facts[Math.floor(Math.random() * facts.length)];
  }

};