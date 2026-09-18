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

test("没有直播也没有更新时不改变顺序，数字和字符串 mid 都能匹配", () => {
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

test("顺序是直播 → 有更新 → 其余，每档内保持原顺序", () => {
  expect(
    orderFollowedUps(ups, { 2: "live" }, undefined, new Set(["4", "5"])).map((up) => up.mid),
  ).toEqual([2, 4, 5, 1, 3, 6]);
});

test("有更新的特别关注比普通有更新的 UP 更靠前", () => {
  const special = new Set(["1", "6"]);
  // 6 直播中且特别关注；1 有更新且特别关注；4 只是有更新
  expect(
    orderFollowedUps(ups, { 6: "live" }, special, new Set(["1", "4"])).map((up) => up.mid),
  ).toEqual([6, 1, 4, 2, 3, 5]);
});

test("直播优先于有更新，特别关注在每一档里都排在前面", () => {
  const special = new Set(["3"]);
  // 2 既在直播又有更新，算直播档；3 是特别关注但没更新，排在其余档最前面
  expect(
    orderFollowedUps(ups, { 2: "live" }, special, new Set(["2", "4"])).map((up) => up.mid),
  ).toEqual([2, 4, 3, 1, 5, 6]);
});

test("特别关注里直播的先于有更新的，有更新的先于其他的", () => {
  const special = new Set(["1", "3", "6"]);
  expect(
    orderFollowedUps(ups, { 3: "live" }, special, new Set(["6", "1"])).map((up) => up.mid),
  ).toEqual([3, 1, 6, 2, 4, 5]);
});
