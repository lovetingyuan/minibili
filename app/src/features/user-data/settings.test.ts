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
  ).toEqual({ $blackTags: { 游戏: "游戏" }, $videoCatesList: RanksConfig });
  expect(UserSettingsSchema.parse({ $blackTags: null }).$blackTags).toEqual({});
});
