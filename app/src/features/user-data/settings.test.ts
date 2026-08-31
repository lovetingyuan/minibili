import { expect, test } from "vitest";
import { RanksConfig } from "../../constants";
import { UserSettingsSchema } from "./settings.schema";

test("normalizes category IDs, restores labels, adds missing categories and fixes the hot tab first", () => {
  const config = UserSettingsSchema.parse({
    $videoCatesList: [
      { rid: 1012, label: "wrong" },
      { rid: -999 },
      { rid: 1012 },
      { rid: 0 },
      { rid: -1 },
    ],
  });
  expect(config.$videoCatesList.slice(0, 3)).toEqual([
    RanksConfig[0],
    RanksConfig.find((entry) => entry.rid === 1012),
    RanksConfig.find((entry) => entry.rid === 0),
  ]);
  expect(new Set(config.$videoCatesList.map((entry) => entry.rid)).size).toBe(RanksConfig.length);
  expect(config.$videoCatesList).toHaveLength(RanksConfig.length);
});

test("malformed settings fall back independently, without affecting valid keys", () => {
  expect(
    UserSettingsSchema.parse({ $blackTags: { 游戏: "游戏" }, $videoCatesList: "bad" }),
  ).toEqual({ $blackTags: { 游戏: "游戏" }, $videoCatesList: RanksConfig, $pinnedUpIds: [] });
  expect(UserSettingsSchema.parse({ $blackTags: null }).$blackTags).toEqual({});
});

test("pinned IDs default to empty and deduplicate without changing their order", () => {
  expect(UserSettingsSchema.parse({}).$pinnedUpIds).toEqual([]);
  expect(
    UserSettingsSchema.parse({ $pinnedUpIds: ["789", "123", "789", "456"] }).$pinnedUpIds,
  ).toEqual(["789", "123", "456"]);
});

test.each([null, "123", [123], [""], ["-1"], ["1.5"], ["0"], ["invalid"]])(
  "invalid pinned IDs %j do not corrupt other settings",
  (value) => {
    const settings = UserSettingsSchema.parse({
      $pinnedUpIds: value,
      $blackTags: { 游戏: "游戏" },
    });
    expect(settings.$pinnedUpIds).toEqual([]);
    expect(settings.$blackTags).toEqual({ 游戏: "游戏" });
  },
);
