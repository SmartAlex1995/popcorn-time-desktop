/**
 * Resolve requests from cache
 */

export default function MetadataAapter() {
  const providers = [
    require('./TraktMetadataProvider')
  ];
}

/**
 * Get details about a specific movie
 *
 * @param string imdbId
 */
function getMovie(imdbId) {}

/**
 * Get list of movies with specific paramaters
 *
 * @param number page
 * @param number limit
 * @param string genre
 * @param string sortBy
 */
function getMovies(page, limit, genre, sortBy) {}

/**
 * Get list of movies with specific paramaters
 *
 * @param string query
 * @param number page
 * @param number limit
 * @param string genre
 * @param string sortBy
 */
function search(query, page, limit, genre, sortBy) {}

/**
 * Get list of movies with specific paramaters
 *
 * @param string imdbId
 */
function similar(imdbId) {}
