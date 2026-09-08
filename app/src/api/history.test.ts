import { describe, expect, test, vi } from "vitest";

import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import {
  fetchBilibiliHistory,
  getHistoryKey,
  getHistoryListItems,
  INITIAL_HISTORY_CURSOR,
} from "./history";
import { HistoryResponseSchema } from "./history.schema";
import type { HistoryPage, HistoryRequest } from "./history.types";

const account = { mid: "123", generation: 4 };
const cursor = { max: 117169106979640, view_at: 1788001866, business: "archive" };
const record = {
  title: "视频标题",
  cover: "https://example.com/cover.jpg",
  author_mid: 42,
  author_name: "UP",
  author_face: "",
  duration: 120,
  view_at: 1788001866,
  history: { business: "archive", oid: 117169106979640, bvid: "BV1example", cid: 12, page: 1 },
};
function page(list = [record]): HistoryPage {
  return { ...HistoryResponseSchema.parse({ cursor, list }), hasMore: true, chainId: 1 };
}

describe("Bilibili cursor history", () => {
  test("requests only archive with the initial and server-provided cursors", async () => {
    const request = vi.fn<HistoryRequest>().mockResolvedValue({ cursor, list: [record] });
    const first = await fetchBilibiliHistory(INITIAL_HISTORY_CURSOR, request, () => true);
    expect(
      Object.fromEntries(
        new URL(request.mock.calls[0][0], "https://api.bilibili.com").searchParams,
      ),
    ).toEqual({
      max: "0",
      view_at: "0",
      business: "",
      ps: "20",
      type: "archive",
    });
    expect(getHistoryKey(account, 0, null)).toEqual(["bilibili-history", "123", 4, "0", 0, "", 0]);
    expect(getHistoryKey(account, 1, first)).toEqual([
      "bilibili-history",
      "123",
      4,
      String(cursor.max),
      cursor.view_at,
      "archive",
      first.chainId,
    ]);
    await fetchBilibiliHistory(first.cursor, request, () => true, first.chainId);
    const params = new URL(request.mock.calls[1][0], "https://api.bilibili.com").searchParams;
    expect(params.get("max")).toBe(String(cursor.max));
    expect(params.get("view_at")).toBe(String(cursor.view_at));
    expect(params.get("business")).toBe("archive");
    expect(params.get("type")).toBe("archive");
  });

  test("filters other businesses, deduplicates overlaps, retains distinct parts and watch times", () => {
    const live = { ...record, history: { ...record.history, business: "live" } };
    const part = { ...record, history: { ...record.history, cid: 13, page: 2 } };
    const older = { ...record, view_at: record.view_at - 86400 };
    const missing = { ...record, history: { ...record.history, oid: 123, bvid: "" } };
    const items = getHistoryListItems([page([record, live]), page([record, part, older, missing])]);
    expect(items).toHaveLength(4);
    expect(new Set(items.map((item) => item.key)).size).toBe(4);
    expect(items[0].video).toMatchObject({
      bvid: record.history.bvid,
      aid: record.history.oid,
      name: "UP",
      duration: 120,
    });
    expect(items[0].video).not.toHaveProperty("date");
    expect(items[0].watchedAt).toBe(record.view_at);
    expect(items.at(-1)?.video).toBeNull();
  });

  test("ends only for empty raw pages or unchanged cursor, not short or filtered pages", async () => {
    const request = vi.fn<HistoryRequest>();
    request.mockResolvedValueOnce({ cursor, list: [record] });
    expect((await fetchBilibiliHistory(INITIAL_HISTORY_CURSOR, request, () => true)).hasMore).toBe(
      true,
    );
    request.mockResolvedValueOnce({ cursor, list: [{ ...record, history: { business: "live" } }] });
    const filtered = await fetchBilibiliHistory(INITIAL_HISTORY_CURSOR, request, () => true);
    expect(getHistoryListItems([filtered])).toEqual([]);
    expect(filtered.hasMore).toBe(true);
    expect(getHistoryKey(account, 1, filtered)).not.toBeNull();
    request.mockResolvedValueOnce({ cursor, list: [] });
    const empty = await fetchBilibiliHistory(INITIAL_HISTORY_CURSOR, request, () => true);
    expect(empty.hasMore).toBe(false);
    expect(getHistoryKey(account, 1, empty)).toBeNull();
    request.mockResolvedValueOnce({
      cursor: { ...cursor, max: String(cursor.max) },
      list: [record],
    });
    expect((await fetchBilibiliHistory(cursor, request, () => true)).hasMore).toBe(false);
  });

  test("starts a new cache chain after refresh even when the next cursor is unchanged", async () => {
    const request = vi.fn<HistoryRequest>().mockResolvedValue({ cursor, list: [record] });
    const first = await fetchBilibiliHistory(INITIAL_HISTORY_CURSOR, request, () => true);
    const refreshed = await fetchBilibiliHistory(INITIAL_HISTORY_CURSOR, request, () => true);
    expect(first.chainId).not.toBe(refreshed.chainId);
    expect(getHistoryKey(account, 1, first)).not.toEqual(getHistoryKey(account, 1, refreshed));
    const next = await fetchBilibiliHistory(cursor, request, () => true, refreshed.chainId);
    expect(next.chainId).toBe(refreshed.chainId);
  });

  test("isolates accounts and session generations and disables absent sessions", () => {
    expect(getHistoryKey(null, 0, null)).toBeNull();
    expect(getHistoryKey(account, 1, null)).toBeNull();
    expect(getHistoryKey(account, 0, null)).not.toEqual(
      getHistoryKey({ ...account, mid: "456" }, 0, null),
    );
    expect(getHistoryKey(account, 0, null)).not.toEqual(
      getHistoryKey({ ...account, generation: 5 }, 0, null),
    );
  });

  test("never requests for expired sessions and rejects late successes and failures", async () => {
    const request = vi.fn<HistoryRequest>();
    await expect(fetchBilibiliHistory(cursor, request, () => false)).rejects.toBeInstanceOf(
      BilibiliSessionChangedError,
    );
    expect(request).not.toHaveBeenCalled();
    for (const fail of [false, true]) {
      let current = true;
      request.mockImplementationOnce(async () => {
        current = false;
        if (fail) throw new Error("network failed");
        return { cursor, list: [record] };
      });
      await expect(fetchBilibiliHistory(cursor, request, () => current)).rejects.toBeInstanceOf(
        BilibiliSessionChangedError,
      );
    }
  });

  test("rejects malformed response and keeps large string cursors exact", async () => {
    const request = vi.fn<HistoryRequest>().mockResolvedValue({ cursor });
    await expect(
      fetchBilibiliHistory(INITIAL_HISTORY_CURSOR, request, () => true),
    ).rejects.toThrow();
    const large = { ...cursor, max: "9007199254740993123" };
    request.mockResolvedValue({ cursor: large, list: [] });
    await fetchBilibiliHistory(large, request, () => true);
    expect(request.mock.calls[1][0]).toContain("max=9007199254740993123");
  });
});
