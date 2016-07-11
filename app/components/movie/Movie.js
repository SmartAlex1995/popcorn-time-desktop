/**
 * Movie component that is responsible for playing movie
 *
 * @todo: Remove state mutation, migrate to Redux reducers
 * @todo: Refactor to be more adapter-like
 */

/* eslint react/sort-comp: 0 */

import React, { Component, PropTypes } from 'react';
import { Link } from 'react-router';
import Rating from 'react-star-rating-component';
import CardList from '../card/CardList';
import Show from '../show/Show';
import Butter from '../../api/Butter';
import Torrent from '../../api/Torrent';
import Player from '../../api/Player';
import notie from 'notie';


export default class Movie extends Component {

  static propTypes = {
    itemId: PropTypes.string.isRequired,
    activeMode: PropTypes.string.isRequired
  };

  static defaultProps = {
    itemId: '',
    activeMode: 'movies'
  };

  defaultTorrent = {
    health: '',
    default: { quality: '', magnet: '' },
    '1080p': { quality: '', magnet: '' },
    '720p': { quality: '', magnet: '' },
    '480p': { quality: '', magnet: '' }
  };

  initialState = {
    item: {
      images: { fanart: '' },
      runtime: {}
    },
    selectedSeason: 1,
    selectedEpisode: 1,
    seasons: [],
    season: [],
    episode: {},
    torrent: this.defaultTorrent,
    usingVideoFallback: false,
    similarLoading: false,
    metadataLoading: false,
    torrentInProgress: false,
    torrentProgress: 0
  };

  constructor(props) {
    super(props);

    console.log(process.env.FLAG_SUPPORT_NON_NATIVE_CODECS_FALLBACK);

    this.butter = new Butter();
    this.torrent = new Torrent();
    this.player = new Player();
    this.engine = {};

    this.state = this.initialState;
  }

  componentDidMount() {
    this.getAllData(this.props.itemId);
  }

  componentWillUnmount() {
    this.torrent.destroy();
    this.player.destroy();
  }

  componentWillReceiveProps(nextProps) {
    this.getAllData(nextProps.itemId);
  }

  getAllData(itemId) {
    this.setState(this.initialState, () => {
      if (this.props.activeMode === 'shows') {
        this.getShowData(
          'seasons', itemId, this.state.selectedSeason, this.state.selectedEpisode
        );
      }
    });

    this.getItem(itemId).then(item => {
      this.getTorrent(itemId, item.title);
      this.instance.poster(item.images.fanart.full);
    });

    this.getSimilar(itemId);
  }

  async getShowData(type, imdbId, season, episode) {
    switch (type) {
      case 'seasons':
        this.setState({
          seasons: await this.butter.getSeasons(imdbId),
          episodes: await this.butter.getSeason(imdbId, 1),
          episode: await this.butter.getEpisode(imdbId, 1, 1)
        });
        break;
      case 'episodes':
        this.setState({
          episodes: await this.butter.getSeason(imdbId, season),
          episode: await this.butter.getEpisode(imdbId, season, 1)
        });
        break;
      case 'episode':
        this.setState({
          episode: await this.butter.getEpisode(imdbId, season, episode)
        });
        break;
      default:
        throw new Error('Invalid getShowData() type');
    }
  }

  /**
   * Get the details of a movie using the butter api
   *
   * @todo: remove the temporary loctaion reload once until a way is found to
   *        correctly configure destroy and reconfigure plyr
   *
   * @hack: Possbile solution is to remove the video element on change of movie
   */
  async getItem(imdbId) {
    this.setState({ metadataLoading: true });

    let item;

    switch (this.props.activeMode) {
      case 'movies':
        item = await this.butter.getMovie(imdbId);
        break;
      case 'shows':
        item = await this.butter.getShow(imdbId);
        break;
      default:
        throw new Error('Active mode not found');
    }

    this.setState({ item, metadataLoading: false });

    return item;
  }

  async getTorrent(imdbId, title) {
    let torrent;

    this.setState({ torrent: this.defaultTorrent });

    try {
      switch (this.props.activeMode) {
        case 'movies':
          torrent = await this.butter.getTorrent(imdbId, this.props.activeMode, {
            searchQuery: title
          });
          break;
        case 'shows': {
          torrent = await this.butter.getTorrent(imdbId, this.props.activeMode, {
            season: this.state.selectedSeason,
            episode: this.state.selectedEpisode,
            searchQuery: title
          });
          break;
        }
        default:
          throw new Error('Invalid active mode');
      }

      const { health, magnet } = this.getIdealTorrent([
        torrent['1080p'],
        torrent['720p'],
        torrent['480p']
      ]);

      console.log({ idealTorrentMagnet: magnet });

      this.setState({
        torrent: {
          '1080p': torrent['1080p'] || this.defaultTorrent,
          '720p': torrent['720p'] || this.defaultTorrent,
          '480p': torrent['480p'] || this.defaultTorrent,
          health
        }
      });
    } catch (err) {
      console.log(err);
    }
  }

  getIdealTorrent(torrents) {
    return torrents.sort((prev, next) => {
      if (prev.seeders === next.seeders) {
        return 0;
      }

      return prev.seeders > next.seeders ? -1 : 1;
    })[0];
  }

  async getSimilar(imdbId) {
    this.setState({ similarLoading: true });

    try {
      const similarItems = await this.butter.getSimilar(this.props.activeMode, imdbId);

      this.setState({
        similarItems,
        similarLoading: false,
        isFinished: true
      });
    } catch (err) {
      console.log(err);
    }
  }

  stopTorrent() {
    this.torrent.destroy();
    this.player.destroy();
    this.setState({ torrentInProgress: false });
  }

  selectShow(type, selectedSeason, selectedEpisode = 1) {
    switch (type) {
      case 'episodes':
        this.setState({ selectedSeason });
        this.getShowData('episodes', this.state.item.id, selectedSeason, selectedEpisode);
        this.getShowData('episode', this.state.item.id, selectedSeason, selectedEpisode);
        this.getTorrent(this.state.item.id, this.state.item.title);
        break;
      case 'episode':
        this.setState({ selectedSeason, selectedEpisode });
        this.getShowData('episode', this.state.item.id, selectedSeason, selectedEpisode);
        this.getTorrent(this.state.item.id, this.state.item.title);
        break;
      default:
        throw new Error('Invalid selectShow() type');
    }
  }

  /**
   * @todo: Abstract 'listening' event to Torrent api
   */
  startTorrent(magnetURI) {
    if (this.state.torrentInProgress) {
      this.stopTorrent();
    }

    this.engine = this.torrent.start(magnetURI);
    this.setState({ torrentInProgress: true });

    this.engine.server.on('listening', () => {
      const servingUrl = `http://localhost:${this.engine.server.address().port}/`;
      console.log('serving at:', servingUrl);

      this.setState({ servingUrl });

      const isFormatSupported = Player.isFormatSupported(this.engine.files[0].path);

      if (
        process.env.NODE_ENV !== 'production' &&
        process.env.FLAG_SUPPORT_NON_NATIVE_CODECS_FALLBACK === 'true' &&
        !isFormatSupported
      ) {
        this.player = this.player.initWebChimeraPlayer(servingUrl, this.state.item);
        this.setState({ usingVideoFallback: true });
        notie.alert(2, 'Falling back to non-native video codecs', 2);
      } else {
        if (!isFormatSupported) {
          notie.alert(3, 'Video format is not supported', 2);
          throw new Error('Video codec not supported');
        }
        this.setState({ usingVideoFallback: false });
        this.player = this.player.initPlyr(servingUrl, this.state.item);
      }
    });
  }

  restart() {
    if (this.player) {
      this.player.restart();
    }
  }

  pause() {
    if (this.player) {
      this.player.pause();
    }
  }

  render() {
    const opacity = { opacity: this.state.metadataLoading ? 0 : 1 };
    const torrentLoadingStatusStyle = { color: 'maroon' };

    return (
      <div className="container">
        <div className="row">
          <div className="col-xs-12">
            <div className="Movie">
              <Link to="/">
                <button
                  className="btn btn-info ion-android-arrow-back"
                  onClick={this.stopTorrent.bind(this)}
                >
                  Back
                </button>
              </Link>
              <button
                onClick={this.startTorrent.bind(this, this.state.torrent['1080p'].magnet)}
                disabled={!this.state.torrent['1080p'].quality}
              >
                Start 1080p
              </button>
              <button
                onClick={this.startTorrent.bind(this, this.state.torrent['720p'].magnet)}
                disabled={!this.state.torrent['720p'].quality}
              >
                Start 720p
              </button>
              {this.props.activeMode === 'shows' ?
                <button
                  onClick={this.startTorrent.bind(this, this.state.torrent['480p'].magnet)}
                  disabled={!this.state.torrent['480p'].quality}
                >
                  Start 480p
                </button>
                :
                null
              }
              <span>
                <a>1080p: {this.state.torrent['1080p'].seeders} seeders</a> |
                <a>720p: {this.state.torrent['720p'].seeders} seeders</a> |
                <a>480p: {this.state.torrent['480p'].seeders} seeders</a> |
                <a><strong>Torrent status: {this.state.torrent.health || ''}</strong></a>
              </span>
              <h1 id="title">
                {this.state.item.title}
              </h1>
              <h5>
                Year: {this.state.item.year}
              </h5>
              <h6 id="genres">
                Genres: {
                          this.state.item.genres
                            ? this.state.item.genres.map(genre => `${genre}, `)
                            : null
                        }
              </h6>
              <h5 id="runtime">
                Length: {this.state.item.runtime.full}
              </h5>
              <h6 id="summary">
                {this.state.item.summary}
              </h6>
              {this.state.item.rating ?
                <div>
                  <Rating
                    renderStarIcon={() => <span className="ion-android-star"></span>}
                    starColor={'white'}
                    name={'rating'}
                    value={this.state.item.rating}
                    editing={false}
                  />
                  {this.state.item.rating}
                </div>
                :
                null
              }
              <h2 style={torrentLoadingStatusStyle}>
                {
                  !this.state.servingUrl && this.state.torrentInProgress
                    ? 'Loading torrent...'
                    : null
                }
              </h2>

              {this.props.activeMode === 'shows' ?
                <Show
                  selectShow={this.selectShow.bind(this)}
                  seasons={this.state.seasons}
                  episodes={this.state.episodes}
                  selectedSeason={this.state.selectedSeason}
                  selectedEpisode={this.state.selectedEpisode}
                  overview={this.state.episode.overview}
                />
                :
                null
              }
              <div
                className="plyr"
                style={opacity}
                className={this.state.usingVideoFallback ? 'hidden' : ''}
              >
                <video controls poster={this.state.item.images.fanart.full} />
              </div>
            </div>
          </div>
          <div className="col-xs-12">
            <h3 className="text-center">Similar</h3>
            <CardList
              items={this.state.similarItems}
              metadataLoading={this.state.similarLoading}
              isFinished={this.state.isFinished}
            />
          </div>
        </div>
      </div>
    );
  }
}
