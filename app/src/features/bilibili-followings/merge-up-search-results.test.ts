import { expect, test } from "vitest";

import type { SearchedUpType } from "@/api/search-up";
import type { UpInfo } from "@/types";

import { buildUpSearchItems } from "./merge-up-search-results";

const up = (mid: number, name: string): UpInfo => ({
  mid,
  name,
  face: `face-${mid}`,
  sign: `sign-${mid}`,
});

const apiUp = (mid: number, name: string, fans = 100): SearchedUpType => ({
  mid,
  name,
  face: `face-${mid}`,
  sign: `sign-${mid}`,
  fans,
});

test("本地已关注的命中项按关注列表原顺序排在接口结果前面", () => {
  const followedUps = [up(1, "老番茄"), up(2, "番茄酱"), up(3, "其他UP")];
  const searchedUps = [apiUp(9, "接口UP")];

  const items = buildUpSearchItems("番茄", followedUps, searchedUps);

  expect(items.map((item) => item.mid)).toEqual([1, 2, 9]);
  expect(items[0]).toEqual({ mid: 1, name: "老番茄", face: "face-1", sign: "sign-1" });
  expect(items[0].fans).toBeUndefined();
  expect(items[2].fans).toBe(100);
});

test("匹配忽略首尾空格与大小写", () => {
  const followedUps = [up(1, "LexBurner")];

  expect(buildUpSearchItems("  lex  ", followedUps, undefined).map((item) => item.mid)).toEqual([1]);
  expect(buildUpSearchItems("LEX", followedUps, []).map((item) => item.mid)).toEqual([1]);
});

test("接口结果中与前排重复的 mid 被剔除", () => {
  const followedUps = [up(1, "老番茄")];
  const searchedUps = [apiUp(1, "老番茄"), apiUp(2, "接口UP")];

  const items = buildUpSearchItems("番茄", followedUps, searchedUps);

  expect(items.map((item) => item.mid)).toEqual([1, 2]);
  expect(items[0].fans).toBeUndefined();
});

test("接口跨分页重复的 mid 只保留一条", () => {
  const searchedUps = [apiUp(5, "接口UP"), apiUp(5, "接口UP"), apiUp(6, "另一个UP")];

  const items = buildUpSearchItems("接口", [], searchedUps);

  expect(items.map((item) => item.mid)).toEqual([5, 6]);
});

test("已关注但本地名称未命中的 UP 按接口顺序保留在后面", () => {
  const followedUps = [up(1, "老番茄"), up(2, "哔哩哔哩")];
  const searchedUps = [apiUp(2, "哔哩哔哩", 999), apiUp(3, "接口UP")];

  const items = buildUpSearchItems("bilibili", followedUps, searchedUps);

  expect(items.map((item) => item.mid)).toEqual([2, 3]);
  expect(items[0].fans).toBe(999);
});

test("关键词为空或纯空格时返回空数组", () => {
  const followedUps = [up(1, "老番茄")];

  expect(buildUpSearchItems("", followedUps, [apiUp(2, "接口UP")])).toEqual([]);
  expect(buildUpSearchItems("   ", followedUps, [apiUp(2, "接口UP")])).toEqual([]);
});
