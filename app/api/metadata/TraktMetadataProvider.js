import Trakt from 'trakt.tv';


export default class TraktMetadataAdapter {

  client_id = '647c69e4ed1ad13393bf6edd9d8f9fb6fe9faf405b44320a6b71ab960b4540a2';

  client_secret = 'f55b0a53c63af683588b47f6de94226b7572a6f83f40bd44c58a7c83fe1f2cb1';

  headers = {
    'Content-Type': 'application/json',
    'trakt-api-version': 2,
    'trakt-api-key': this.client_id
  };

  constructor() {
    this.trakt = new Trakt({
      client_id: this.client_id,
      client_secret: this.client_secret
    });
  }

  getMovies(page = 1, limit = 50) {
    return this.trakt.movies.popular({
      paginate: true,
      page,
      limit,
      extended: 'full,images,metadata'
    })
    .then(movies => movies.map(movie => formatMovie(movie)));
  }

  getMovie(movieId) {
    return this.trakt.movies.summary({
      id: movieId,
      extended: 'full,images,metadata'
    })
    .then(response => formatMovie(response));
  }

  search(query = 'batman', type = 'movie') {
    return this.trakt.search({
      query,
      type
    })
    .then(response => response
      .filter(item => item.movie.ids.imdb !== '')
      .map(movie => formatMovie(movie.movie))
    );
  }

  provide() {}
}

export function formatMovie(movie = {}) {
  return {
    title: movie.title,
    year: movie.year,
    imdbId: movie.ids.imdb,
    id: movie.ids.imdb,
    summary: movie.overview,
    rating: movie.rating ? movie.rating / 2 : 'n/a',
    images: {
      fanart: {
        full: movie.images.fanart.full,
        medium: movie.images.fanart.medium,
        thumb: movie.images.fanart.thumb
      },
      poster: {
        full: movie.images.poster.full,
        medium: movie.images.poster.medium,
        thumb: movie.images.poster.thumb
      }
    }
  };
}
