import { expect, test } from "vitest";
import {
  buildPlayerUrl,
  buildShareSearch,
  buildSourceUrl,
  formatCount,
  formatDate,
  formatDuration,
  normalizePage,
  parseShareParams,
  upgradeImageUrl,
} from "./format";

test("parses the share parameters and defaults the page to 1", () => {
  expect(parseShareParams("?bvid=BV1XctB6PEuZ&p=3")).toEqual({ bvid: "BV1XctB6PEuZ", page: 3 });
  expect(parseShareParams("?bvid=BV1XctB6PEuZ")).toEqual({ bvid: "BV1XctB6PEuZ", page: 1 });
  expect(parseShareParams("?bvid=BV1XctB6PEuZ&p=abc")).toEqual({
    bvid: "BV1XctB6PEuZ",
    page: 1,
  });
  expect(parseShareParams("?p=2")).toBeNull();
  expect(parseShareParams("?bvid=av123")).toBeNull();
  expect(parseShareParams("")).toBeNull();
});

test("normalizes the page against the part count", () => {
  expect(normalizePage("2", 3)).toBe(2);
  expect(normalizePage(3, 3)).toBe(3);
  expect(normalizePage("4", 3)).toBe(1);
  expect(normalizePage("0", 3)).toBe(1);
  expect(normalizePage("-1", 3)).toBe(1);
  expect(normalizePage(undefined, 3)).toBe(1);
  expect(normalizePage("abc", 3)).toBe(1);
});

test("builds the player, source and share urls", () => {
  expect(buildPlayerUrl("BV1XctB6PEuZ", 2)).toBe(
    "https://player.bilibili.com/player.html?bvid=BV1XctB6PEuZ&p=2",
  );
  expect(buildSourceUrl("BV1XctB6PEuZ", 2)).toBe("https://www.bilibili.com/video/BV1XctB6PEuZ?p=2");
  expect(buildShareSearch("BV1XctB6PEuZ", 1)).toBe("?bvid=BV1XctB6PEuZ&p=1");
});

test("upgrades insecure image urls", () => {
  expect(upgradeImageUrl("http://i1.hdslb.com/a.jpg")).toBe("https://i1.hdslb.com/a.jpg");
  expect(upgradeImageUrl("https://i1.hdslb.com/a.jpg")).toBe("https://i1.hdslb.com/a.jpg");
  expect(upgradeImageUrl("")).toBe("");
});

test("formats counts the way bilibili does", () => {
  expect(formatCount(0)).toBe("0");
  expect(formatCount(9999)).toBe("9999");
  expect(formatCount(12345)).toBe("1.2万");
  expect(formatCount(100000)).toBe("10万");
  expect(formatCount(100000000)).toBe("1亿");
  expect(formatCount(Number.NaN)).toBe("--");
});

test("formats durations and dates", () => {
  expect(formatDuration(59)).toBe("0:59");
  expect(formatDuration(2041)).toBe("34:01");
  expect(formatDuration(3725)).toBe("1:02:05");
  expect(formatDuration(Number.NaN)).toBe("--");
  const local = new Date(2025, 0, 2, 3, 4);
  expect(formatDate(local.getTime() / 1000)).toBe("2025-01-02 03:04");
  expect(formatDate(0)).toBe("--");
});
