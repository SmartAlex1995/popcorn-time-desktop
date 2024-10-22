import fetch from "node-fetch";
import {
  handleProviderError,
  timeout,
  resolveEndpoint,
} from "./BaseTorrentProvider";
import { TorrentProviderInterface } from "./TorrentProviderInterface";

const endpoint = "https://tv-v2.api-fetch.website";
const providerId = "PCT";
const resolvedEndpoint = resolveEndpoint(endpoint, providerId);

export default class PctTorrentProvider implements TorrentProviderInterface {
  static providerName = "PopcornTime API";

  static shows = {};

  static async fetch(
    itemId: string,
    type: string,
    extendedDetails: Record<string, any> = {}
  ) {
    const urlTypeParam = type === "movies" ? "movie" : "show";
    const request = timeout(
      fetch(`${resolvedEndpoint}/${urlTypeParam}/${itemId}`).then((res) =>
        res.json()
      )
    );

    switch (type) {
      case "movies":
        return request.then((movie) =>
          [
            { ...movie.torrents.en["1080p"], quality: "1080p" },
            { ...movie.torrents.en["720p"], quality: "720p" },
          ].map((torrent) => this.formatMovieTorrent(torrent))
        );
      case "shows": {
        const { season, episode } = extendedDetails;

        const show = await request
          .then((res) =>
            res.episodes.map((eachEpisode) => this.formatEpisode(eachEpisode))
          )
          .catch((error) => {
            handleProviderError(error);
            return [];
          });

        this.shows[itemId] = show;

        return this.filterTorrents(show, season, episode);
      }
      default:
        return [];
    }
  }

  /**
   * Filter torrent from episodes
   *
   * @param {array}  | Episodes
   * @param {number} | season
   * @param {number} | episode
   * @return {array} | Array of torrents
   */
  static filterTorrents(show, season: number, episode: number) {
    const filterTorrents = show
      .filter(
        (eachEpisode) =>
          String(eachEpisode.season) === String(season) &&
          String(eachEpisode.episode) === String(episode)
      )
      .map((eachEpisode) => eachEpisode.torrents);

    return filterTorrents.length > 0 ? filterTorrents[0] : [];
  }

  static formatEpisode({ season, episode, torrents }) {
    return {
      season,
      episode,
      torrents: this.formatEpisodeTorrents(torrents),
    };
  }

  static formatMovieTorrent(torrent) {
    return {
      quality: torrent.quality,
      magnet: torrent.url,
      seeders: torrent.seed || torrent.seeds,
      leechers: torrent.peer || 0,
      metadata: String(torrent.url),
      _provider: "pct",
    };
  }

  static formatEpisodeTorrents(torrents) {
    return Object.keys(torrents).map((videoQuality) => ({
      quality: videoQuality === "0" ? "0p" : videoQuality,
      magnet: torrents[videoQuality]?.url,
      metadata: String(torrents[videoQuality]?.url),
      seeders:
        torrents[videoQuality]?.seeds ||
        torrents[videoQuality]?.seed ||
        torrents[videoQuality]?.seeders ||
        0,
      leechers: torrents[videoQuality]?.peer || 0,
      _provider: "pct",
    }));
  }

  static getStatus() {
    return fetch(resolvedEndpoint)
      .then((res) => res.ok)
      .catch(() => false);
  }

  static provide(
    itemId: string,
    type: string,
    extendedDetails: Record<string, any> = {}
  ) {
    switch (type) {
      case "movies":
        return this.fetch(itemId, type, extendedDetails).catch((error) => {
          handleProviderError(error);
          return [];
        });
      case "shows":
        return this.fetch(itemId, type, extendedDetails).catch((error) => {
          handleProviderError(error);
          return [];
        });
      default:
        return Promise.resolve([]);
    }
  }
}
