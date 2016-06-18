import fetch from 'isomorphic-fetch';
import { getHealth } from './BaseTorrentProvider';


export default class PctTorrentProvider {

  static shows = {};

  /**
   * @todo: this should be properly cached
   *
   * Serve as a temporary cache
   * If not in cache, generate cached response
   *
   * shows = {
   *   imdbId: [
   *     torrents: <array> | array of formatted torrents
   *     season: <number>  | season to find
   *     episode: <number> | episode to find
   *   }
   * }
   * ...
   *
   * @return {array} | array of torrents
   */
  static async fetch(imdbId, extendedDetails) {
    const { season, episode } = extendedDetails;

    // if (this.shows[imdbId]) {
    //   return this.filterTorrents(this.shows[imdbId], season, episode);
    // }

    const show = await fetch(`http://api-fetch.website/tv/show/${imdbId}`)
      .then(res => res.json())
      .then(res => res.episodes.map(eachEpisode => this.formatEpisode(eachEpisode)))
      .catch(err => {
        console.log(err);
        return [];
      });

    this.shows[imdbId] = show;

    return this.filterTorrents(show, season, episode);
  }

  /**
   * Filter torrent from episodes
   *
   * @param {array}  | Episodes
   * @param {number} | season
   * @param {number} | episode
   * @return {array} | Array of torrents
   */
  static filterTorrents(show, season, episode) {
    return show
      .filter(
        eachEpisode => eachEpisode.season === season &&
                       eachEpisode.episode === episode
      )
      .map(eachEpisode => eachEpisode.torrents)[0];
  }

  static formatEpisode(episode) {
    return {
      season: episode.season,
      episode: episode.episode,
      torrents: Object
                  .values(episode.torrents)
                  .map((torrent, index) =>
                    this.formatTorrent(
                      torrent,
                      Object.keys(episode.torrents)[index]
                    )
                  )
    };
  }

  static formatTorrent(torrent, quality) {
    console.log(quality);
    return {
      quality,
      magnet: torrent.url,
      seeders: torrent.seeds,
      leechers: 0,
      ...getHealth(torrent.seeds, torrent.peers, 0),
      _provder: 'pct'
    };
  }

  static provide(imdbId, extendedDetails) {
    return this.fetch(imdbId, extendedDetails);
  }
}
