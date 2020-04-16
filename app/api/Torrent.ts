/**
 * Torrents controller, responsible for playing, stoping, etc
 */
import os from "os";
import WebTorrent from "webtorrent";
// 'get-port' lib doesn't work here for some reason. Not sure why
import findFreePort from "find-free-port";
import { isExactEpisode } from "./torrents/BaseTorrentProvider";

type Metadata = {
  season: number;
  episode: number;
  activeMode: string;
};

/**
 * Get the subtitle file buffer given an array of files
 */
export function selectSubtitleFile(
  files: Array<{ name: string }> = [],
  activeMode: string,
  metadata: { season: number; episode: number }
): { name: string } | boolean {
  return (
    files.find((file) => {
      const formatIsSupported = file.name.includes(".srt");

      switch (activeMode) {
        // Check if the current file is the exact episode we're looking for
        case "season_complete": {
          const { season, episode } = metadata;
          return (
            formatIsSupported && isExactEpisode(file.name, season, episode)
          );
        }

        // Check if the current file is greater than the previous file
        default:
          return formatIsSupported;
      }
    }) || false
  );
}

export default class Torrent {
  inProgress = false;

  finished = false;

  checkDownloadInterval: number;

  engine: WebTorrent;

  magnetURI?: string;

  server:
    | {}
    | {
        close: () => void;
        listen: (port: number) => void;
      };

  async start(
    magnetURI: string,
    metadata: Metadata,
    supportedFormats: Array<string>,
    cb: (
      servingUrl: string,
      file: { name: string },
      files: string,
      torrent: string,
      subtitle: { name: string } | boolean
    ) => void
  ) {
    if (this.inProgress) {
      console.log("Torrent already in progress");
      return;
    }

    const [port] = await findFreePort(9090);
    const { season, episode, activeMode } = metadata;
    const maxConns = process.env.CONFIG_MAX_CONNECTIONS
      ? parseInt(process.env.CONFIG_MAX_CONNECTIONS, 10)
      : 20;

    this.engine = new WebTorrent({ maxConns });
    this.inProgress = true;
    this.magnetURI = magnetURI;

    const cacheLocation =
      process.env.CONFIG_PERSIST_DOWNLOADS === "true"
        ? process.env.CONFIG_DOWNLOAD_LOCATION || "/tmp/popcorn-time-desktop"
        : os.tmpdir();

    this.engine.add(magnetURI, { path: cacheLocation }, (torrent) => {
      const server = torrent.createServer();
      this.server = server.listen(port);

      const { file, torrentIndex } = torrent.files.reduce(
        (previous, current, index) => {
          const formatIsSupported = !!supportedFormats.find((format) =>
            current.name.includes(format)
          );

          switch (activeMode) {
            // Check if the current file is the exact episode we're looking for
            case "season_complete":
              if (
                formatIsSupported &&
                isExactEpisode(current.name, season, episode)
              ) {
                previous.file.deselect();
                return {
                  file: current,
                  torrentIndex: index,
                };
              }

              return previous;

            // Check if the current file is greater than the previous file
            default:
              if (formatIsSupported && current.length > previous.file.length) {
                previous.file.deselect();
                return {
                  file: current,
                  torrentIndex: index,
                };
              }

              return previous;
          }
        },
        { file: torrent.files[0], torrentIndex: 0 }
      );

      if (typeof torrentIndex !== "number") {
        console.warn(
          "File List",
          torrent.files.map((_file) => _file.name)
        );
        throw new Error(
          `No torrent could be selected. Torrent Index: ${torrentIndex}`
        );
      }

      const buffer = 1 * 1024 * 1024; // 1MB
      const { files } = torrent;

      file.select();

      torrent.on("done", () => {
        this.inProgress = false;
        this.clearIntervals();
      });

      this.checkDownloadInterval = setInterval(async () => {
        if (torrent.downloaded > buffer) {
          console.log("Ready...");
          if (!this.checkDownloadInterval) {
            return;
          }

          await cb(
            `http://localhost:${port}/${torrentIndex}`,
            file,
            files,
            torrent,
            false
            // selectSubtitleFile(files, activeMode, metadata)
          );

          this.clearIntervals();
        }
      }, 1000);
    });
  }

  clearIntervals() {
    clearInterval(this.checkDownloadInterval);
    this.checkDownloadInterval = undefined;
  }

  destroy() {
    if (this.inProgress) {
      if (this.server && this.server.close) {
        console.log("Closing the torrent server...");
        this.server.close();
        this.server = {};
      }

      this.clearIntervals();

      console.log("Destroying the torrent engine...");
      this.engine.destroy();
      this.engine = undefined;

      this.inProgress = false;
    }
  }
}

type TorrentSpeeds = {
  downloadSpeed: number;
  uploadSpeed: number;
  progress: number;
  numPeers: number;
  ratio: number;
};

export function formatSpeeds(torrentSpeeds: TorrentSpeeds): TorrentSpeeds {
  const {
    downloadSpeed,
    uploadSpeed,
    progress,
    numPeers,
    ratio,
  } = torrentSpeeds;

  return {
    downloadSpeed: downloadSpeed / 1000000,
    uploadSpeed: uploadSpeed / 1000000,
    progress: Math.round(progress * 100) / 100,
    numPeers,
    ratio,
  };
}
