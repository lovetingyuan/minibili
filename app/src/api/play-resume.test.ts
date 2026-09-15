import { describe, expect, test } from "vitest";

import { getPlayResumeKey, PLAY_RESUME_MIN_MS, resolvePlayResumePositionMs } from "./play-resume";
import { PlayResumeInfoSchema } from "./play-resume.schema";

const cid = 1458260037;

describe("play resume position", () => {
  test("resumes at the position bilibili stored for this part", () => {
    expect(resolvePlayResumePositionMs({ last_play_time: 220000, last_play_cid: cid }, cid)).toBe(
      220000,
    );
    expect(resolvePlayResumePositionMs({ last_play_time: 5000.4, last_play_cid: cid }, cid)).toBe(
      5000,
    );
  });

  test("ignores the position of another part", () => {
    expect(resolvePlayResumePositionMs({ last_play_time: 220000, last_play_cid: 999 }, cid)).toBe(
      0,
    );
    expect(resolvePlayResumePositionMs({ last_play_time: 220000 }, cid)).toBe(0);
    expect(resolvePlayResumePositionMs({ last_play_time: 220000, last_play_cid: null }, cid)).toBe(
      0,
    );
  });

  test("starts from the beginning for finished or unusable positions", () => {
    // 看完后 B站返回 -1000
    expect(resolvePlayResumePositionMs({ last_play_time: -1000, last_play_cid: cid }, cid)).toBe(0);
    expect(resolvePlayResumePositionMs({ last_play_time: 0, last_play_cid: cid }, cid)).toBe(0);
    expect(
      resolvePlayResumePositionMs(
        { last_play_time: PLAY_RESUME_MIN_MS - 1, last_play_cid: cid },
        cid,
      ),
    ).toBe(0);
    expect(
      resolvePlayResumePositionMs({ last_play_time: Number.NaN, last_play_cid: cid }, cid),
    ).toBe(0);
    expect(resolvePlayResumePositionMs({ last_play_time: null, last_play_cid: cid }, cid)).toBe(0);
    expect(resolvePlayResumePositionMs({}, cid)).toBe(0);
    expect(resolvePlayResumePositionMs(null, cid)).toBe(0);
    expect(resolvePlayResumePositionMs(undefined, cid)).toBe(0);
  });
});

describe("play resume request key", () => {
  test("builds the player info request for the current part", () => {
    expect(getPlayResumeKey(1501398719, cid)).toBe(`/x/player/wbi/v2?aid=1501398719&cid=${cid}`);
    expect(getPlayResumeKey("1501398719", cid)).toBe(`/x/player/wbi/v2?aid=1501398719&cid=${cid}`);
  });

  test.each([
    ["missing aid", undefined, cid],
    ["empty aid", "", cid],
    ["zero aid", "0", cid],
    ["non numeric aid", "BV1HS421w7wG", cid],
    ["missing cid", 1501398719, 0],
    ["unsafe cid", 1501398719, Number.MAX_SAFE_INTEGER + 1],
  ] as const)("skips the request with %s", (_name, aid, part) => {
    expect(getPlayResumeKey(aid, part)).toBeNull();
  });
});

describe("play resume response", () => {
  test("keeps the resume fields and ignores the rest of the payload", () => {
    const parsed = PlayResumeInfoSchema.parse({
      aid: 1254301090,
      bvid: "BV1wJ4m1T7ju",
      cid,
      last_play_time: 220000,
      last_play_cid: cid,
      subtitle: { subtitles: [] },
    });
    expect(parsed).toEqual({ last_play_time: 220000, last_play_cid: cid });
    expect(resolvePlayResumePositionMs(parsed, cid)).toBe(220000);
  });

  test("tolerates a finished video response", () => {
    const parsed = PlayResumeInfoSchema.parse({ last_play_time: -1000, last_play_cid: cid });
    expect(resolvePlayResumePositionMs(parsed, cid)).toBe(0);
  });
});
