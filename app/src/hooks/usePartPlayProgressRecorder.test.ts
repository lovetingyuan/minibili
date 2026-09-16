import { describe, expect, test, vi } from "vitest";

vi.mock("@/store/part-play-progress", () => ({
  clearPartPlayProgress: vi.fn(),
  recordPartPlayProgress: vi.fn(),
  getPartPlayProgressKey: (bvid: string, cid: number) => {
    const key = bvid.trim();
    return key && Number.isSafeInteger(cid) && cid > 0 ? `${key}:${cid}` : null;
  },
}));

import { createPartPlayProgressRecorder } from "./usePartPlayProgressRecorder";

function createRecorder() {
  const writer = {
    record: vi.fn(),
    clear: vi.fn(),
  };
  return { recorder: createPartPlayProgressRecorder(writer), writer };
}

describe("part play progress recorder", () => {
  test("flushes each part with its own latest position", () => {
    const { recorder, writer } = createRecorder();
    const firstKey = recorder.update({
      bvid: "BV1",
      cid: 101,
      currentTimeMs: 20_000,
      durationMs: 60_000,
      isPlaying: true,
    });
    const secondKey = recorder.update({
      bvid: "BV1",
      cid: 102,
      currentTimeMs: 30_000,
      durationMs: 90_000,
      isPlaying: false,
    });

    recorder.flush(firstKey);
    recorder.flush(secondKey);
    expect(writer.record.mock.calls).toEqual([
      ["BV1", 101, 20_000, 60_000],
      ["BV1", 102, 30_000, 90_000],
    ]);
  });

  test("clears a completed part and does not write it back during cleanup", () => {
    const { recorder, writer } = createRecorder();
    const key = recorder.update({
      bvid: "BV1",
      cid: 101,
      currentTimeMs: 59_000,
      durationMs: 60_000,
      isPlaying: true,
    });
    recorder.finish("BV1", 101);
    recorder.flush(key);

    expect(writer.clear).toHaveBeenCalledWith("BV1", 101);
    expect(writer.record).not.toHaveBeenCalled();
  });

  test("records again after a loop restarts from the beginning", () => {
    const { recorder, writer } = createRecorder();
    recorder.update({
      bvid: "BV1",
      cid: 101,
      currentTimeMs: 59_000,
      durationMs: 60_000,
      isPlaying: true,
    });
    recorder.finish("BV1", 101);
    const key = recorder.update({
      bvid: "BV1",
      cid: 101,
      currentTimeMs: 15_000,
      durationMs: 60_000,
      isPlaying: true,
    });
    recorder.flush(key);

    expect(writer.record).toHaveBeenCalledWith("BV1", 101, 15_000, 60_000);
  });
});
