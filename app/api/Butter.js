/**
 * The highest level abstraction layer for querying torrents and metadata
 *
 * @todo: Add caching method to resolve from cache before sending request
 */

import TorrentAdapter, { getHealth } from './torrents/TorrentAdapter';
import MetadataAdapter from './metadata/TraktMetadataProvider';

export default class Butter {

  constructor() {
    this.metadataAdapter = new MetadataAdapter();
  }

  getMovies(page = 1, limit = 50) {
    return this.metadataAdapter.getMovies(page, limit);
  }

  getMovie(imdbId) {
    return this.metadataAdapter.getMovie(imdbId);
  }

  getShows(page = 1, limit = 50) {
    return this.metadataAdapter.getShows(page, limit);
  }

  getShow(imdbId) {
    return this.metadataAdapter.getShow(imdbId);
  }

  /**
   * @param {string}  imdbId
   * @param {string}  type            | Type of torrent: movie or show
   * @param {object}  extendedDetails | Additional details provided for heuristics
   * @param {boolean} returnAll
   */
  getTorrent(imdbId, type, extendedDetails = {}, returnAll) {
    return TorrentAdapter(imdbId, type, extendedDetails, returnAll); // eslint-disable-line new-cap
  }

  getTorrentHealth(magnet) {
    return getHealth(magnet);
  }

  search(query) {
    return this.metadataAdapter.search(query);
  }

  getSimilarMovies(imdbId) {
    return this.metadataAdapter.similar('movie', imdbId, 5);
  }

  // getShows(imdbId) {}

  // getShow(imdbId) {}

  // getSimilarShows(imdbId) {}
}
