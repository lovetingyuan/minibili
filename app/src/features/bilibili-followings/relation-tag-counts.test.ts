import type { Cache, ScopedMutator, State } from "swr";
import { unstable_serialize } from "swr";
import { afterEach, describe, expect, test, vi } from "vitest";

import { getRelationTagsKey, getRelationUpTagsKey } from "../../api/relation-tags";
import type { RelationTag, RelationTagAccount } from "../../api/relation-tags.types";
import {
  getPendingTagCountChanges,
  getTagCountChanges,
  shiftTagCounts,
  syncRelationTagCounts,
} from "./relation-tag-counts";

const account: RelationTagAccount = { mid: "1", generation: 1 };
const mid = 10;
const tagsKey = getRelationTagsKey(account);
const upTagsKey = getRelationUpTagsKey(account, mid);

function createTag(tagid: number, count: number): RelationTag {
  return { tagid, name: `分组 ${tagid}`, count, tip: "" };
}

const before = [createTag(-10, 1), createTag(0, 5), createTag(446542, 2)];

function createCache(): Cache {
  const store = new Map<string, State>();
  return {
    get: (key) => store.get(key),
    set: (key, value) => {
      store.set(key, value);
    },
    delete: (key) => {
      store.delete(key);
    },
    keys: () => store.keys(),
  };
}

function readTags(cache: Cache) {
  return cache.get(unstable_serialize(tagsKey))?.data as RelationTag[] | undefined;
}

function countOf(tags: RelationTag[] | undefined, tagid: number) {
  return tags?.find((tag) => tag.tagid === tagid)?.count;
}

/** 模拟 SWR：单参数是重新请求，带数据是直接写缓存。 */
function setup(serverPages: RelationTag[][], previous?: readonly number[]) {
  vi.useFakeTimers();
  const cache = createCache();
  cache.set(unstable_serialize(tagsKey), { data: before });
  if (previous) {
    cache.set(unstable_serialize(upTagsKey), { data: previous });
  }
  let requests = 0;
  const calls: unknown[][] = [];
  const mutate = (async (...args: unknown[]) => {
    const [key, data] = args;
    calls.push(args);
    if (args.length === 1) {
      const next = serverPages[Math.min(requests++, serverPages.length - 1)];
      cache.set(unstable_serialize(key as never), { data: next });
      return next;
    }
    cache.set(unstable_serialize(key as never), { data });
    return data;
  }) as unknown as ScopedMutator;
  return { cache, mutate, calls, requests: () => requests };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("relation tag counts", () => {
  test("只统计发生变化的成员关系", () => {
    expect([...getTagCountChanges([-10, 0], [-10, 0, 446542])]).toEqual([[446542, 1]]);
    expect([...getTagCountChanges([-10, 0], [0])]).toEqual([[-10, -1]]);
    expect([...getTagCountChanges([0], [0])]).toEqual([]);
  });

  test("按人数变化就地更新分组，且不会出现负数", () => {
    const shifted = shiftTagCounts([createTag(-10, 0), createTag(0, 5)], new Map([[-10, -1]]));
    expect(shifted.map((tag) => tag.count)).toEqual([0, 5]);
    expect(shifted[1]).toBe(shifted[1]);
  });

  test("只把服务端仍是旧数字的分组视为待补正", () => {
    const changes = new Map([[446542, 1]]);
    const stale = before.map((tag) => ({ ...tag }));
    expect([...getPendingTagCountChanges(before, stale, changes)]).toEqual([[446542, 1]]);
    const fresh = before.map((tag) => (tag.tagid === 446542 ? { ...tag, count: 3 } : tag));
    expect([...getPendingTagCountChanges(before, fresh, changes)]).toEqual([]);
  });

  test("先本地更新人数，服务端追上后停止重试", async () => {
    const stale = before.map((tag) => ({ ...tag }));
    const fresh = [createTag(-10, 2), createTag(0, 5), createTag(446542, 3)];
    const { cache, mutate, requests } = setup([stale, fresh], [-10, 0]);

    const task = syncRelationTagCounts(mutate, cache, account, mid, [-10, 0, 446542], () => true);
    await vi.advanceTimersByTimeAsync(0);
    // 写成功后立刻更新，不等服务端统计
    expect(countOf(readTags(cache), 446542)).toBe(3);
    expect(cache.get(unstable_serialize(upTagsKey))?.data).toEqual([-10, 0, 446542]);

    await vi.advanceTimersByTimeAsync(1000);
    expect(requests()).toBe(1);
    // 服务端还是旧数字：保留本地结果
    expect(countOf(readTags(cache), 446542)).toBe(3);

    await vi.advanceTimersByTimeAsync(1500);
    await task;
    expect(requests()).toBe(2);
    expect(readTags(cache)).toEqual(fresh);
    expect(vi.getTimerCount()).toBe(0);
  });

  test("服务端一直返回旧数字时不回退，最多重试三次", async () => {
    const stale = before.map((tag) => ({ ...tag }));
    const { cache, mutate, requests } = setup([stale], [-10, 0]);

    const task = syncRelationTagCounts(mutate, cache, account, mid, [-10, 0, 446542], () => true);
    await vi.runAllTimersAsync();
    await task;

    expect(requests()).toBe(3);
    expect(countOf(readTags(cache), 446542)).toBe(3);
  });

  test("拿不到写之前的快照时只做普通刷新", async () => {
    const { cache, mutate, calls, requests } = setup([before]);

    await syncRelationTagCounts(mutate, cache, account, mid, [-10, 0, 446542], () => true);

    expect(requests()).toBe(1);
    expect(calls[0][0]).toEqual(upTagsKey);
    expect(cache.get(unstable_serialize(upTagsKey))?.data).toEqual([-10, 0, 446542]);
    expect(vi.getTimerCount()).toBe(0);
  });

  test("登录状态变化后停止延迟重试", async () => {
    const stale = before.map((tag) => ({ ...tag }));
    const { cache, mutate, requests } = setup([stale], [-10, 0]);

    const task = syncRelationTagCounts(mutate, cache, account, mid, [-10, 0, 446542], () => false);
    await vi.runAllTimersAsync();
    await task;

    expect(requests()).toBe(0);
  });

  test("同一个 UP 的新一次设置分组会接管补正", async () => {
    const stale = before.map((tag) => ({ ...tag }));
    const { cache, mutate, requests } = setup([stale], [-10, 0]);

    const first = syncRelationTagCounts(mutate, cache, account, mid, [-10, 0, 446542], () => true);
    const second = syncRelationTagCounts(mutate, cache, account, mid, [-10, 0], () => true);
    await vi.runAllTimersAsync();
    await Promise.all([first, second]);

    // 旧任务在重试前就发现已经有新的同步接管，不会再去请求或覆盖新结果
    expect(requests()).toBe(1);
    expect(countOf(readTags(cache), 446542)).toBe(2);
  });
});
