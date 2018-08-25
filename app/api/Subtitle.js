// @flow
import express from 'express';
import path from 'path';
import os from 'os';
import fs from 'fs';
import srt2vtt from 'srt2vtt';
import rndm from 'rndm';
import getPort from 'get-port';

export type subtitleType = {
  filename: string,
  basePath: string,
  port: number,
  fullPath: string,
  buffer: Buffer
};

export default class SubtitleServer {
  basePath = os.tmpdir();

  server: express;

  async startServer(): Promise<void> {
    // Find a port at runtime. Default to 4000 if it is available
    this.port =
      typeof process.env.SUBTITLES_PORT === 'number'
        ? parseInt(process.env.SUBTITLES_PORT, 10)
        : await getPort({ port: 4000 });

    // Start the static file server for the subtitle files
    const server = express();
    server.use(express.static(this.basePath));
    this.server = server.listen(this.port);

    console.info(
      `Subtitle server serving on http://localhost:${this.port}, serving ${
        this.basePath
      }`
    );
  }

  closeServer() {
    if (this.server) {
      this.server.close();
    }
  }

  convertFromBuffer(srtBuffer: Buffer): Promise<subtitleType> {
    const randomString = rndm(16);
    const filename = `${randomString}.vtt`;
    const { basePath, port } = this;
    const fullPath = path.join(basePath, filename);

    return new Promise((resolve, reject) => {
      srt2vtt(srtBuffer, (error?: Error, vttBuffer: Buffer) => {
        if (error) reject(error);

        fs.writeFile(fullPath, vttBuffer, () => {
          resolve({
            filename,
            basePath,
            port,
            fullPath,
            buffer: vttBuffer
          });
        });
      });
    });
  }
}
