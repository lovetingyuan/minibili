import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("./fetcher", () => ({ default: mocks.request }));

import { getVideoDownloadSource, VideoDownloadUnsupportedError } from "./play-url";

describe("video download source", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("returns the progressive mp4 url with cdn backups", async () => {
    mocks.request.mockResolvedValue({
      quality: 64,
      durl: [
        {
          order: 1,
          length: 567497,
          size: 95558589,
          ahead: "",
          vhead: "",
          url: "https://cdn/main.mp4",
          backup_url: ["https://cdn/backup.mp4", "https://cdn/main.mp4"],
        },
      ],
    });

    const source = await getVideoDownloadSource("BV1test", 123);

    expect(source.urls).toEqual(["https://cdn/main.mp4", "https://cdn/backup.mp4"]);
    expect(source.quality).toBe(64);
    expect(source.size).toBe(95558589);

    const url = mocks.request.mock.calls[0][0] as string;
    expect(url).toContain("/x/player/wbi/playurl?");
    expect(url).toContain("type=mp4");
    expect(url).toContain("qn=64");
    // fnval 不能带 DASH 位，否则服务端只返回 dash、没有 durl
    expect(url).toContain("fnval=0");
    expect(url).toContain("platform=pc");
  });

  test("rejects with an unsupported error when the response has no durl", async () => {
    mocks.request.mockResolvedValue({ quality: 64, dash: {} });

    await expect(getVideoDownloadSource("BV1test", 123)).rejects.toBeInstanceOf(
      VideoDownloadUnsupportedError,
    );
  });

  test("rejects without a cid and does not call the api", async () => {
    await expect(getVideoDownloadSource("BV1test", 0)).rejects.toBeInstanceOf(
      VideoDownloadUnsupportedError,
    );
    expect(mocks.request).not.toHaveBeenCalled();
  });
});
