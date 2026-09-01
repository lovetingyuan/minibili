import { describe, expect, test, vi } from "vitest";

import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import { DynamicItemResponseSchema, DynamicListResponseSchema } from "./dynamic-items.schema";
import {
  buildFollowingDynamicsUrl,
  fetchFollowingDynamicsPage,
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

describe("following dynamics paging", () => {
  test("builds the verified first and continuation requests", () => {
    const first = new URL(buildFollowingDynamicsUrl(), "https://api.bilibili.com");
    expect(Object.fromEntries(first.searchParams)).toMatchObject({
      timezone_offset: "-480",
      type: "all",
      platform: "web",
      page: "1",
      web_location: "333.1365",
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
