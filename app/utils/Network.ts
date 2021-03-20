import speedTest from "speedtest-net";

export const timeout = 30_000;

export function getDownloadSpeed(): Promise<number> {
  return new Promise((resolve, reject) => {
    speedTest({ maxTime: timeout })
      .on("downloadspeed", (downloadSpeed: number) => {
        resolve(downloadSpeed);
      })
      .on("error", (error: Error) => {
        reject(error);
      });
  });
}

export function getUploadSpeed(): Promise<number> {
  return new Promise((resolve, reject) => {
    speedTest({ maxTime: timeout })
      .on("uploadspeed", (uploadSpeed: number) => {
        resolve(uploadSpeed);
      })
      .on("error", (error: Error) => {
        reject(error);
      });
  });
}
