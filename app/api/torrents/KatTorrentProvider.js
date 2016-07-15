import kat from 'kat-api';
import {
  getHealth,
  formatSeasonEpisodeToString
} from './BaseTorrentProvider';


export default class KatTorrentProvider {

  static fetch(query, season, episode) {
    const formattedDetails = season && episode
                              ? formatSeasonEpisodeToString(season, episode)
                              : undefined;

    return kat.search({
      query,
      category: season && episode ? 'tv' : 'movies'
    })
    .then(
      resp => (
        season && episode
          ? resp.results.filter(
              res => res.magnet.includes(formattedDetails)
            )
          : resp.results
      )
    )
    .then(
      resp => resp.map(res => this.formatTorrent(res))
    )
    .catch(error => {
      console.log(error);
      return [];
    });
  }

  static formatTorrent(torrent) {
    return {
      magnet: torrent.magnet,
      seeders: torrent.seeds,
      leechers: torrent.leechs,
      metadata: torrent.link +
                torrent.title +
                torrent.torrentLink +
                torrent.guid +
                torrent.magnet,
      ...getHealth(torrent.seeds, torrent.peers, torrent.leechs),
      _provider: 'kat'
    };
  }

  static provide(imdbId, type, extendedDetails = {}) {
    const { searchQuery } = extendedDetails;

    switch (type) {
      case 'movies':
        return this.fetch(searchQuery)
          .catch(error => {
            console.log(error);
            return [];
          });
      case 'shows': {
        const { season, episode } = extendedDetails;

        return this.fetch(
          `${searchQuery} ${formatSeasonEpisodeToString(season, episode)}`,
          season,
          episode
        )
          .catch(error => {
            console.log(error);
            return [];
          });
      }
      default:
        return [];
    }
  }
}
