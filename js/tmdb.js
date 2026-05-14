// TMDB API wrapper for movie and series search and details
window.AppTMDB = {

  _fetch: function(endpoint) {
    var url = APP_CONFIG.tmdb.baseUrl + endpoint
      + (endpoint.indexOf('?') > -1 ? '&' : '?')
      + 'api_key=' + APP_CONFIG.tmdb.key;
    return fetch(url).then(function(r) {
      if (!r.ok) throw new Error('TMDB error ' + r.status);
      return r.json();
    });
  },

  searchMovies: function(query) {
    return this._fetch(
      '/search/movie?query=' + encodeURIComponent(query)
    ).then(function(data) {
      return (data.results || [])
        .filter(function(r) { return r.title; })
        .slice(0, 8)
        .map(function(r) {
          return {
            tmdbId: r.id,
            title: r.title,
            releaseYear: r.release_date
              ? r.release_date.slice(0, 4) : '',
            poster: r.poster_path || null,
            type: 'movie'
          };
        });
    });
  },

  searchSeries: function(query) {
    return this._fetch(
      '/search/tv?query=' + encodeURIComponent(query)
    ).then(function(data) {
      return (data.results || [])
        .filter(function(r) { return r.name; })
        .slice(0, 8)
        .map(function(r) {
          return {
            tmdbId: r.id,
            title: r.name,
            releaseYear: r.first_air_date
              ? r.first_air_date.slice(0, 4) : '',
            poster: r.poster_path || null,
            type: 'series'
          };
        });
    });
  },

  getMovieDetails: function(tmdbId) {
    return this._fetch('/movie/' + tmdbId)
      .then(function(data) {
        return {
          runtime: data.runtime || 90,
          genres: (data.genres || []).map(function(g) {
            return g.name;
          })
        };
      });
  },

  getSeriesSeasons: function(tmdbId) {
    return this._fetch('/tv/' + tmdbId)
      .then(function(data) {
        return (data.seasons || [])
          .filter(function(s) {
            return s.season_number > 0;
          })
          .map(function(s) {
            return {
              seasonNumber: s.season_number,
              seasonName: s.name,
              poster: s.poster_path || null,
              episodeCount: s.episode_count || 0,
              airYear: s.air_date
                ? s.air_date.slice(0, 4) : ''
            };
          });
      });
  },

  getSeasonRuntime: function(seriesId, seasonNumber) {
    return this._fetch(
      '/tv/' + seriesId + '/season/' + seasonNumber
    ).then(function(data) {
      var episodes = (data.episodes || [])
        .filter(function(e) {
          return e.runtime && e.runtime > 0;
        });
      var avg = episodes.length > 0
        ? Math.round(
            episodes.reduce(function(s, e) {
              return s + e.runtime;
            }, 0) / episodes.length
          )
        : 30;
      return avg;
    });
  },

  getSeriesGenres: function(tmdbId) {
    return this._fetch('/tv/' + tmdbId)
      .then(function(data) {
        return (data.genres || []).map(function(g) {
          return g.name;
        });
      });
  }

};