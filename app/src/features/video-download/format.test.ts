import { describe, expect, test } from "vitest";

import { formatBytes, formatDownloadProgress, formatSpeed, resolveDownloadSpeed } from "./format";

describe("video download formatting", () => {
  test("formats byte sizes with readable units", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(-1)).toBe("0 B");
    expect(formatBytes(Number.NaN)).toBe("0 B");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(512 * 1024)).toBe("512 KB");
    expect(formatBytes(100139008)).toBe("95.5 MB");
    expect(formatBytes(1024 ** 3 * 1.25)).toBe("1.3 GB");
  });

  test("formats speed only when it is known", () => {
    expect(formatSpeed(0)).toBe("");
    expect(formatSpeed(Number.NaN)).toBe("");
    expect(formatSpeed(2202009)).toBe("2.1 MB/s");
  });

  test("describes progress with percent, size and speed", () => {
    expect(
      formatDownloadProgress({
        bytesWritten: 45298483,
        totalBytes: 100139008,
        speed: 2202009,
      }),
    ).toBe("45% · 43.2 MB / 95.5 MB · 2.1 MB/s");
  });

  test("falls back to the downloaded size when the total size is unknown", () => {
    expect(formatDownloadProgress({ bytesWritten: 1048576, totalBytes: 0, speed: 0 })).toBe("1 MB");
  });

  test("drops the speed segment once the file is fully downloaded", () => {
    expect(formatDownloadProgress({ bytesWritten: 2048, totalBytes: 2048, speed: 1024 })).toBe(
      "100% · 2 KB / 2 KB",
    );
  });

  test("calculates instantaneous speed from two samples", () => {
    expect(
      resolveDownloadSpeed({
        previousBytes: 0,
        previousTime: 0,
        bytesWritten: 2000,
        time: 1000,
      }),
    ).toBe(2000);
    expect(
      resolveDownloadSpeed({ previousBytes: 0, previousTime: 0, bytesWritten: 2000, time: 0 }),
    ).toBe(0);
    expect(
      resolveDownloadSpeed({
        previousBytes: 2000,
        previousTime: 1000,
        bytesWritten: 1000,
        time: 2000,
      }),
    ).toBe(0);
  });
});
