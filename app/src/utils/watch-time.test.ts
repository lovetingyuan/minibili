import { expect, test } from "vitest";
import { formatWatchTime } from "./watch-time";

test("formats Unix seconds using local calendar fields, with full year and padded time", () => {
  const local = new Date(2025, 0, 2, 3, 4);
  expect(formatWatchTime(local.getTime() / 1000)).toBe("观看于 2025-01-02 03:04");
});
