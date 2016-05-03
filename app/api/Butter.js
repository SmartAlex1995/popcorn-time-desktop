/**
 * API wrapper for popcorntime-api
 */

function Butter() {
  this.DEFAULTS = {
    moviesUrl: 'https://api-fetch.website/tv/movies',
    movieUrl: 'https://api-fetch.website/tv/movie',
    showsUrl: 'https://api-fetch.website/tv/shows',
    showUrl: 'https://api-fetch.website/tv/show'
  };

  this.items = [];

  return this;
}

/**
 * @desc    Base http request that converts response to json
 * @private
 */
Butter.prototype.get = function get(url) {
  return fetch(url).then(response => response.json());
};

Butter.prototype.getMovies = function getMovies(pageNumber = 1) {
  return this.get(`https://api-fetch.website/tv/shows/${pageNumber}`);
};

Butter.prototype.getMovie = function getMovie(movieId) {
  return this.get(`https://api-fetch.website/tv/movie/${movieId}`);
};

Butter.prototype.getShows = function getShows() {
  return this.get('https://api-fetch.website/tv/movies');
};

Butter.prototype.getShow = function getShow(showId) {
  return this.get(`https://api-fetch.website/tv/movie/${showId}`);
};

export default Butter;
