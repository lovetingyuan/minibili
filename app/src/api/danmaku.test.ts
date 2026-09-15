import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("expo/fetch", () => ({ fetch: vi.fn() }));
vi.mock("./get-cookie", () => ({ getCookie: vi.fn(async () => "SESSDATA=x") }));

import { fetch as expoFetch } from "expo/fetch";

import {
  DANMAKU_SEGMENT_SECONDS,
  fetchDanmakuSegment,
  getDanmakuSegmentIndex,
  invalidateDanmakuSegment,
} from "./danmaku";

const mockedFetch = vi.mocked(expoFetch);
type SegmentResponse = Awaited<ReturnType<typeof expoFetch>>;

/**
 * 只需要 status 与 arrayBuffer 两个成员：空字节串会被解码成空弹幕数组
 */
function emptySegment() {
  return {
    status: 200,
    arrayBuffer: async () => new Uint8Array(0).buffer,
  } as unknown as SegmentResponse;
}

beforeEach(() => {
  mockedFetch.mockReset();
  mockedFetch.mockResolvedValue(emptySegment());
  invalidateDanmakuSegment(4321, 0);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("danmaku segment cache", () => {
  test("reuses the cached segment request", async () => {
    await fetchDanmakuSegment(4321, 0);
    await fetchDanmakuSegment(4321, 0);
    expect(mockedFetch).toHaveBeenCalledOnce();
  });

  test("refetches after the segment is invalidated", async () => {
    await fetchDanmakuSegment(4321, 0);
    invalidateDanmakuSegment(4321, 0);
    await fetchDanmakuSegment(4321, 0);
    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });

  test("keeps other segments cached when one segment is invalidated", async () => {
    await fetchDanmakuSegment(4321, 0);
    await fetchDanmakuSegment(4321, 1);
    invalidateDanmakuSegment(4321, 1);
    await fetchDanmakuSegment(4321, 0);
    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });

  test("treats an out of range segment as empty", async () => {
    mockedFetch.mockResolvedValue({
      status: 304,
      arrayBuffer: async () => new ArrayBuffer(0),
    } as unknown as SegmentResponse);

    await expect(fetchDanmakuSegment(4321, 7)).resolves.toEqual([]);
  });

  test("throws on a failed request and does not cache the failure", async () => {
    mockedFetch.mockResolvedValue({
      status: 500,
      arrayBuffer: async () => new ArrayBuffer(0),
    } as unknown as SegmentResponse);

    await expect(fetchDanmakuSegment(4321, 8)).rejects.toThrow("弹幕分段请求失败：500");

    mockedFetch.mockResolvedValue(emptySegment());
    await expect(fetchDanmakuSegment(4321, 8)).resolves.toEqual([]);
    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });
});

describe("getDanmakuSegmentIndex", () => {
  test("maps a playback progress to its segment", () => {
    const segmentMs = DANMAKU_SEGMENT_SECONDS * 1000;
    expect(getDanmakuSegmentIndex(0)).toBe(0);
    expect(getDanmakuSegmentIndex(segmentMs - 1)).toBe(0);
    expect(getDanmakuSegmentIndex(segmentMs)).toBe(1);
    expect(getDanmakuSegmentIndex(segmentMs * 2 + 1000)).toBe(2);
    expect(getDanmakuSegmentIndex(-100)).toBe(0);
  });
});
