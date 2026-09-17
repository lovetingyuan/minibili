import { expect, test } from "vitest";
import type { UpInfo } from "../../types";
import { orderFollowedUps } from "./order-followings";

const ups: UpInfo[] = [1, 2, 3, 4, 5, 6].map((mid) => ({
  mid,
  name: `UP ${mid}`,
  face: "",
  sign: "",
}));

test("正在直播的 UP 排在最前，其余保持原顺序", () => {
  const result = orderFollowedUps(ups, { 2: "live", 5: "live" });
  expect(result.map((up) => up.mid)).toEqual([2, 5, 1, 3, 4, 6]);
  expect(result[0]).toBe(ups[1]);
  expect(ups.map((up) => up.mid)).toEqual([1, 2, 3, 4, 5, 6]);
});

test("没有直播时不改变顺序，数字和字符串 mid 都能匹配", () => {
  expect(orderFollowedUps(ups, {})).toEqual(ups);
  expect(orderFollowedUps([], { 1: "live" })).toEqual([]);
  const stringMids = ups.map((up) => ({ ...up, mid: String(up.mid) }));
  expect(orderFollowedUps(stringMids, { 3: "live" }).map((up) => up.mid)).toEqual([
    "3",
    "1",
    "2",
    "4",
    "5",
    "6",
  ]);
});

test("特别关注排在最前，直播与其余依次排在后面", () => {
  const special = new Set(["4", "6"]);
  // 6 同时在直播中，仍留在特别关注分组里
  expect(orderFollowedUps(ups, { 2: "live", 5: "live", 6: "live" }, special).map((up) => up.mid)).toEqual([
    4, 6, 2, 5, 1, 3,
  ]);
  expect(orderFollowedUps(ups, { 2: "live" }, new Set()).map((up) => up.mid)).toEqual([
    2, 1, 3, 4, 5, 6,
  ]);
});
