import { describe, expect, test, vi } from "vitest";

import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import { DynamicItemResponseSchema, DynamicListResponseSchema } from "./dynamic-items.schema";
import { FollowingDynamicsUpdateCountSchema } from "./following-dynamics-update.schema";
import {
  buildFollowingDynamicsUpdateUrl,
  buildFollowingDynamicsUrl,
  fetchFollowingDynamicsUpdateCount,
  fetchFollowingDynamicsPage,
  getFollowingDynamicsUpdateCount,
  getFollowingDynamicsLatestId,
  getFollowingDynamicsKey,
  getFollowingDynamicsListItems,
} from "./following-dynamics";
import type { FollowingDynamicsRequest } from "./following-dynamics.types";

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
