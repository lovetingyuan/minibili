import { describe, expect, test, vi } from "vitest";

import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import { DynamicItemResponseSchema, DynamicListResponseSchema } from "./dynamic-items.schema";
import { FollowingDynamicsNavResponseSchema } from "./following-dynamics-nav.schema";
import { FollowingDynamicsUpdateCountSchema } from "./following-dynamics-update.schema";
import {
  buildFollowingDynamicsNavUrl,
  buildFollowingDynamicsUpdateUrl,
  buildFollowingDynamicsUrl,
  countFollowingDynamicsUnreadUps,
  fetchFollowingDynamicsNavUpdates,
  fetchFollowingDynamicsUpdateCount,
  fetchFollowingDynamicsPage,
  FOLLOWING_DYNAMICS_NAV_MAX_PAGES,
  getFollowingDynamicsUpdateCount,
  getFollowingDynamicsLatestId,
  getFollowingDynamicsKey,
  getFollowingDynamicsListItems,
  isSameFollowingDynamicsNavState,
  isNewerFollowingDynamicId,
  mergeFollowingDynamicsNavUnread,
} from "./following-dynamics";
import type {
  FollowingDynamicsNavBatch,
  FollowingDynamicsRequest,
} from "./following-dynamics.types";

const account = { mid: "123", generation: 4 };

function item(id: string) {
  return DynamicItemResponseSchema.parse({
    id_str: id,
    type: "DYNAMIC_TYPE_WORD",
    basic: { comment_id_str: id, comment_type: 17 },
    modules: {
      module_author: {
        mid: "42",
        name: "测试UP",
        pub_action: "发布了动态",
        pub_time: "刚刚",
        pub_ts: "1725100000",
      },
      module_dynamic: {
        desc: { text: `动态 ${id}`, rich_text_nodes: [] },
        major: { type: "MAJOR_TYPE_OPUS", opus: { summary: { text: "" }, pics: [] } },
      },
      module_stat: {
        comment: { count: 0 },
        forward: { count: 0 },
        like: { count: 0 },
      },
    },
  });
}

function page(ids: string[], offset = "next", hasMore = true) {
  return DynamicListResponseSchema.parse({
    has_more: hasMore,
    offset,
    items: ids.map(item),
  });
}

function updatePage(values: { updateNum?: string | number }) {
  return FollowingDynamicsUpdateCountSchema.parse({
    update_num: values.updateNum ?? 0,
  });
}

function navPage(values: {
  items?: { mid: string | number; idStr: string }[];
  hasMore?: boolean;
  offset?: string;
  updateBaseline?: string;
}) {
  return FollowingDynamicsNavResponseSchema.parse({
    has_more: values.hasMore ?? false,
    items: (values.items ?? []).map((item) => ({
      author: { mid: item.mid, name: "测试UP" },
      id_str: item.idStr,
    })),
    offset: values.offset,
    update_baseline: values.updateBaseline,
  });
}

function navBatch(values: {
  items?: { mid: string; idStr: string }[];
  newestId?: string | null;
  oldestId?: string | null;
  complete?: boolean;
}): FollowingDynamicsNavBatch {
  return {
    items: values.items ?? [],
    newestId: values.newestId ?? null,
    oldestId: values.oldestId ?? null,
    complete: values.complete ?? true,
  };
}

describe("following dynamics paging", () => {
  test("builds the verified first and continuation requests", () => {
    const first = new URL(buildFollowingDynamicsUrl(), "https://api.bilibili.com");
    expect(Object.fromEntries(first.searchParams)).toMatchObject({
      timezone_offset: "-480",
      type: "all",
      platform: "web",
      page: "1",
    });
    expect(first.searchParams.has("offset")).toBe(false);
    expect(first.searchParams.get("features")).toContain("eva3CardVideo");
    expect(JSON.parse(first.searchParams.get("x-bili-device-req-json") ?? "")).toEqual({
      platform: "web",
      device: "pc",
      spmid: "333.1365",
    });

    const next = new URL(buildFollowingDynamicsUrl(2, "cursor-2"), first);
    expect(next.searchParams.get("page")).toBe("2");
    expect(next.searchParams.get("offset")).toBe("cursor-2");
  });

  test("isolates accounts and generations and stops on terminal pages", () => {
    const first = getFollowingDynamicsKey(account, 0, null);
    expect(first).toEqual(["bilibili-following-dynamics", "123", 4, 1, ""]);
    expect(getFollowingDynamicsKey(account, 1, page(["1"], "cursor-2"))).toEqual([
      "bilibili-following-dynamics",
      "123",
      4,
      2,
      "cursor-2",
    ]);
    expect(getFollowingDynamicsKey(null, 0, null)).toBeNull();
    expect(getFollowingDynamicsKey(account, 1, null)).toBeNull();
    expect(getFollowingDynamicsKey(account, 1, page([], "cursor-2"))).toBeNull();
    expect(getFollowingDynamicsKey(account, 1, page(["1"], "", true))).toBeNull();
    expect(getFollowingDynamicsKey(account, 1, page(["1"], "cursor-2", false))).toBeNull();
    expect(first).not.toEqual(getFollowingDynamicsKey({ mid: "456", generation: 4 }, 0, null));
    expect(first).not.toEqual(getFollowingDynamicsKey({ mid: "123", generation: 5 }, 0, null));
  });

  test("parses pages and deduplicates overlapping dynamic ids", async () => {
    const request = vi.fn<FollowingDynamicsRequest>().mockResolvedValue(page(["1", "2"]));
    const result = await fetchFollowingDynamicsPage(1, "", request, () => true);
    expect(result.items).toHaveLength(2);
    expect(request).toHaveBeenCalledWith(expect.stringContaining("page=1"));
    expect(getFollowingDynamicsListItems([result, page(["2", "3"])]).map(({ id }) => id)).toEqual([
      "1",
      "2",
      "3",
    ]);
    expect(getFollowingDynamicsLatestId(result)).toBe("1");
  });

  test("never requests stale sessions and rejects late success or failure", async () => {
    const request = vi.fn<FollowingDynamicsRequest>();
    await expect(fetchFollowingDynamicsPage(1, "", request, () => false)).rejects.toBeInstanceOf(
      BilibiliSessionChangedError,
    );
    expect(request).not.toHaveBeenCalled();

    for (const fail of [false, true]) {
      let current = true;
      request.mockImplementationOnce(async () => {
        current = false;
        if (fail) throw new Error("network failed");
        return page(["1"]);
      });
      await expect(
        fetchFollowingDynamicsPage(1, "", request, () => current),
      ).rejects.toBeInstanceOf(BilibiliSessionChangedError);
    }
  });

  test("rejects malformed responses", async () => {
    const request = vi
      .fn<FollowingDynamicsRequest>()
      .mockResolvedValue({ has_more: true, items: [{}] });
    await expect(fetchFollowingDynamicsPage(1, "", request, () => true)).rejects.toThrow();
  });
});

describe("following dynamics update count", () => {
  test("builds update count requests with type and optional baseline", () => {
    const base = new URL(buildFollowingDynamicsUpdateUrl(), "https://api.bilibili.com");
    expect(base.pathname).toBe("/x/polymer/web-dynamic/v1/feed/all/update");
    expect(base.searchParams.get("type")).toBe("all");
    expect(base.searchParams.has("update_baseline")).toBe(false);

    const withBaseline = new URL(
      buildFollowingDynamicsUpdateUrl("baseline-1"),
      "https://api.bilibili.com",
    );
    expect(withBaseline.searchParams.get("update_baseline")).toBe("baseline-1");
  });

  test("parses update count responses and normalizes count", () => {
    const parsed = FollowingDynamicsUpdateCountSchema.parse({
      update_num: "12",
      future_server_field: true,
    });
    expect(getFollowingDynamicsUpdateCount(parsed)).toBe(12);
    expect(getFollowingDynamicsUpdateCount(updatePage({ updateNum: "150" }))).toBe(99);
    expect(getFollowingDynamicsUpdateCount(updatePage({ updateNum: "bad" }))).toBe(0);
  });

  test("fetching update count rejects stale sessions before and after the request", async () => {
    const request = vi.fn<FollowingDynamicsRequest>();
    await expect(
      fetchFollowingDynamicsUpdateCount("baseline-1", request, () => false),
    ).rejects.toBeInstanceOf(BilibiliSessionChangedError);
    expect(request).not.toHaveBeenCalled();

    let current = true;
    request.mockImplementationOnce(async () => {
      current = false;
      return updatePage({ updateNum: 1 });
    });
    await expect(
      fetchFollowingDynamicsUpdateCount("baseline-1", request, () => current),
    ).rejects.toBeInstanceOf(BilibiliSessionChangedError);
  });
});

describe("following dynamics nav", () => {
  test("builds nav requests with optional baseline and offset", () => {
    expect(buildFollowingDynamicsNavUrl()).toBe("/x/polymer/web-dynamic/v1/feed/nav");

    const withBaseline = new URL(
      buildFollowingDynamicsNavUrl("1200000000000000001"),
      "https://api.bilibili.com",
    );
    expect(withBaseline.pathname).toBe("/x/polymer/web-dynamic/v1/feed/nav");
    expect(withBaseline.searchParams.get("update_baseline")).toBe("1200000000000000001");
    expect(withBaseline.searchParams.has("offset")).toBe(false);

    const withOffset = new URL(
      buildFollowingDynamicsNavUrl("1200000000000000001", "1200000000000000000"),
      "https://api.bilibili.com",
    );
    expect(withOffset.searchParams.get("update_baseline")).toBe("1200000000000000001");
    expect(withOffset.searchParams.get("offset")).toBe("1200000000000000000");
  });

  test("parses nav pages and rejects malformed items", () => {
    const parsed = FollowingDynamicsNavResponseSchema.parse({
      has_more: true,
      items: [
        { author: { mid: 42, name: "UP" }, id_str: "1200000000000000002", future_field: 1 },
        { author: { mid: "43" }, id_str: "1200000000000000001" },
      ],
      offset: "1200000000000000001",
      update_baseline: "1200000000000000002",
      update_num: "2",
    });
    expect(parsed.items.map((item) => String(item.author.mid))).toEqual(["42", "43"]);
    expect(String(parsed.items[1].id_str)).toBe("1200000000000000001");
    expect(parsed.update_num).toBe("2");

    expect(() =>
      FollowingDynamicsNavResponseSchema.parse({ items: [{ author: { mid: 42 } }] }),
    ).toThrow();
    expect(() => FollowingDynamicsNavResponseSchema.parse({ items: [{ id_str: "1" }] })).toThrow();
  });

  test("pages nav responses through offset until has_more is false", async () => {
    const request = vi.fn<FollowingDynamicsRequest>(async (url) => {
      const { searchParams } = new URL(url, "https://api.bilibili.com");
      expect(searchParams.get("update_baseline")).toBe("1200000000000000000");
      if (!searchParams.get("offset")) {
        return navPage({
          hasMore: true,
          items: [
            { mid: 42, idStr: "1200000000000000005" },
            { mid: 43, idStr: "1200000000000000004" },
          ],
          offset: "1200000000000000004",
          updateBaseline: "1200000000000000005",
        });
      }
      expect(searchParams.get("offset")).toBe("1200000000000000004");
      return navPage({
        items: [{ mid: "44", idStr: "1200000000000000003" }],
        offset: "1200000000000000003",
      });
    });

    const batch = await fetchFollowingDynamicsNavUpdates(
      "1200000000000000000",
      request,
      () => true,
    );
    expect(request).toHaveBeenCalledTimes(2);
    expect(batch.items).toEqual([
      { mid: "42", idStr: "1200000000000000005" },
      { mid: "43", idStr: "1200000000000000004" },
      { mid: "44", idStr: "1200000000000000003" },
    ]);
    expect(batch.newestId).toBe("1200000000000000005");
    expect(batch.oldestId).toBe("1200000000000000003");
    expect(batch.complete).toBe(true);
  });

  test("stops at the page cap and reports an incomplete batch", async () => {
    let page = 0;
    const request = vi.fn<FollowingDynamicsRequest>(async () => {
      page += 1;
      const id = `120000000000000000${page}`;
      return navPage({
        hasMore: true,
        items: [{ mid: page, idStr: id }],
        offset: id,
      });
    });

    const batch = await fetchFollowingDynamicsNavUpdates("", request, () => true);
    expect(request).toHaveBeenCalledTimes(FOLLOWING_DYNAMICS_NAV_MAX_PAGES);
    expect(batch.complete).toBe(false);
    expect(batch.items).toHaveLength(FOLLOWING_DYNAMICS_NAV_MAX_PAGES);
    expect(batch.oldestId).toBe(`120000000000000000${FOLLOWING_DYNAMICS_NAV_MAX_PAGES}`);
  });

  test("never requests stale sessions and rejects late nav results", async () => {
    const request = vi.fn<FollowingDynamicsRequest>();
    await expect(
      fetchFollowingDynamicsNavUpdates("1200000000000000000", request, () => false),
    ).rejects.toBeInstanceOf(BilibiliSessionChangedError);
    expect(request).not.toHaveBeenCalled();

    let current = true;
    request.mockImplementationOnce(async () => {
      current = false;
      return navPage({ items: [{ mid: 42, idStr: "1200000000000000001" }] });
    });
    await expect(
      fetchFollowingDynamicsNavUpdates("1200000000000000000", request, () => current),
    ).rejects.toBeInstanceOf(BilibiliSessionChangedError);
  });

  test("compares dynamic ids as decimal strings", () => {
    expect(isNewerFollowingDynamicId("1200000000000000002", "1200000000000000001")).toBe(true);
    expect(isNewerFollowingDynamicId("1200000000000000001", "1200000000000000001")).toBe(false);
    expect(isNewerFollowingDynamicId("1200000000000000000", "1200000000000000001")).toBe(false);
    expect(isNewerFollowingDynamicId("9999999999999999999", "10000000000000000000")).toBe(false);
    expect(isNewerFollowingDynamicId("1200000000000000001", "")).toBe(true);
  });
});

describe("following dynamics unread merge", () => {
  const newestId = "1200000000000000005";
  const oldestId = "1200000000000000003";

  test("first sync only stores the baseline", () => {
    expect(
      mergeFollowingDynamicsNavUnread({
        state: undefined,
        batch: navBatch({
          items: [
            { mid: "42", idStr: newestId },
            { mid: "43", idStr: oldestId },
          ],
          newestId,
          oldestId,
        }),
      }),
    ).toEqual({ baseline: newestId, unread: {} });
  });

  test("first sync skips the whole backlog and keeps the newest id", () => {
    expect(
      mergeFollowingDynamicsNavUnread({
        state: undefined,
        batch: navBatch({
          items: [{ mid: "42", idStr: oldestId }],
          newestId,
          oldestId,
          complete: false,
        }),
      }),
    ).toEqual({ baseline: newestId, unread: {} });
  });

  test("keeps the newest id per up and advances the baseline", () => {
    const merged = mergeFollowingDynamicsNavUnread({
      state: { baseline: "1200000000000000002", unread: { "42": oldestId } },
      batch: navBatch({
        items: [
          { mid: "42", idStr: "1200000000000000004" },
          { mid: "43", idStr: newestId },
        ],
        newestId,
        oldestId: "1200000000000000004",
      }),
    });
    expect(merged).toEqual({
      baseline: newestId,
      unread: { "42": "1200000000000000004", "43": newestId },
    });
  });

  test("keeps older ids out of the unread map", () => {
    const merged = mergeFollowingDynamicsNavUnread({
      state: { baseline: "1200000000000000002", unread: { "42": "1200000000000000004" } },
      batch: navBatch({
        items: [
          { mid: "42", idStr: oldestId },
          { mid: "42", idStr: "1200000000000000004" },
        ],
        newestId: "1200000000000000004",
        oldestId,
      }),
    });
    expect(merged.unread).toEqual({ "42": "1200000000000000004" });
  });

  test("drops items the user already read in this session", () => {
    const merged = mergeFollowingDynamicsNavUnread({
      state: { baseline: "1200000000000000002", unread: {} },
      batch: navBatch({
        items: [
          { mid: "42", idStr: "1200000000000000004" },
          { mid: "43", idStr: newestId },
        ],
        newestId,
        oldestId: "1200000000000000004",
      }),
      readIds: { "42": "1200000000000000004" },
    });
    expect(merged.unread).toEqual({ "43": newestId });
  });

  test("prunes ups that are no longer followed", () => {
    const merged = mergeFollowingDynamicsNavUnread({
      state: { baseline: "1200000000000000002", unread: { "42": "1200000000000000002" } },
      batch: navBatch({ items: [], newestId: null, oldestId: null }),
      followedMids: new Set(["43"]),
    });
    expect(merged.unread).toEqual({});
  });

  test("keeps the baseline when a complete batch has no new dynamics", () => {
    const merged = mergeFollowingDynamicsNavUnread({
      state: { baseline: "1200000000000000002", unread: { "42": "1200000000000000002" } },
      batch: navBatch({ items: [], newestId: null, oldestId: null }),
    });
    expect(merged).toEqual({
      baseline: "1200000000000000002",
      unread: { "42": "1200000000000000002" },
    });
  });

  test("only advances to the oldest id when the batch is incomplete", () => {
    const merged = mergeFollowingDynamicsNavUnread({
      state: { baseline: "1200000000000000002", unread: {} },
      batch: navBatch({
        items: [{ mid: "42", idStr: oldestId }],
        newestId,
        oldestId,
        complete: false,
      }),
    });
    expect(merged.baseline).toBe(oldestId);
  });

  test("counts only followed ups with unread dynamics", () => {
    expect(
      countFollowingDynamicsUnreadUps(
        { baseline: newestId, unread: { "42": "1", "43": "2" } },
        new Set(["43", "44"]),
      ),
    ).toBe(1);
    expect(countFollowingDynamicsUnreadUps(undefined, new Set(["43"]))).toBe(0);
  });

  test("detects an unchanged unread state", () => {
    const state = { baseline: newestId, unread: { "42": oldestId } };
    expect(
      isSameFollowingDynamicsNavState(state, { baseline: newestId, unread: { "42": oldestId } }),
    ).toBe(true);
    expect(isSameFollowingDynamicsNavState(state, { baseline: newestId, unread: {} })).toBe(false);
    expect(
      isSameFollowingDynamicsNavState(state, { baseline: oldestId, unread: { "42": oldestId } }),
    ).toBe(false);
    expect(isSameFollowingDynamicsNavState(undefined, state)).toBe(false);
  });
});
