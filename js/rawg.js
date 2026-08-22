// RAWG API wrapper for game search and details
window.AppRAWG = {

  _fetch: function(endpoint) {
    var url = APP_CONFIG.rawg.baseUrl + endpoint;
    url += (endpoint.indexOf('?') > -1 ? '&' : '?') + 'key=' + APP_CONFIG.rawg.key;
    return fetch(url).then(function(r) {
      if (!r.ok) throw new Error('RAWG error ' + r.status);
      return r.json();
    });
  },

  searchGames: function(query) {
    return this._fetch(
      '/games?search=' + encodeURIComponent(query) + '&page_size=8&search_exact=false'
    ).then(function(data) {
      return (data.results || [])
        .filter(function(r) { return r.name; })
        .map(function(r) {
          return {
            rawgId: r.id,
            title: r.name,
            releaseYear: r.released ? r.released.slice(0, 4) : '',
            poster: r.background_image || null,
            genres: (r.genres || []).map(function(g) { return g.name; }),
            type: 'game'
          };
        });
    });
  },

  getGameDetails: function(rawgId) {
    return this._fetch('/games/' + rawgId)
      .then(function(data) {
        return {
          genres: (data.genres || []).map(function(g) { return g.name; }),
          playtime: data.playtime || 0,
          description: data.description_raw
            ? data.description_raw.slice(0, 200) : ''
        };
      });
  }

};