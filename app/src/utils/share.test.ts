import { expect, test } from "vitest";

import { buildVideoShareMessage, buildVideoShareUrl, isDynamicId } from "./share";

test("builds the share page url with the current part", () => {
  expect(buildVideoShareUrl("BV1XctB6PEuZ", 3)).toBe(
    "https://minibili.tingyuan.in/share?bvid=BV1XctB6PEuZ&p=3",
  );
  expect(buildVideoShareUrl("BV1XctB6PEuZ")).toBe(
    "https://minibili.tingyuan.in/share?bvid=BV1XctB6PEuZ&p=1",
  );
});

test("keeps sharing dynamics through the old url", () => {
  expect(isDynamicId(117212627142309)).toBe(true);
  expect(isDynamicId("117212627142309")).toBe(true);
  expect(isDynamicId("BV1XctB6PEuZ")).toBe(false);
  expect(buildVideoShareUrl(117212627142309)).toBe(
    "https://m.bilibili.com/dynamic/117212627142309",
  );
});

test("keeps the existing message format and truncates long titles", () => {
  expect(buildVideoShareMessage("阿布荒野", "短视频", "https://example.com/share")).toBe(
    ["MiniBili - 阿布荒野", "短视频", "https://example.com/share"].join("\n"),
  );
  const longTitle = "长".repeat(50);
  expect(buildVideoShareMessage("阿布荒野", longTitle, "https://example.com/share")).toBe(
    ["MiniBili - 阿布荒野", `${"长".repeat(40)}……`, "https://example.com/share"].join("\n"),
  );
});
