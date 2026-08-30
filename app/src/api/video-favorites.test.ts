import { afterEach, describe, expect, test, vi } from "vitest";

import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import {
  FavoriteLoginRequiredError,
  FavoriteResultUnknownError,
  fetchVideoFavoriteFolders,
  fetchVideoRelation,
  getFavoriteChanges,
  getVideoFavoriteFoldersKey,
  getVideoRelationKey,
  modifyVideoFavorites,
} from "./video-favorites";
import type {
  VideoFavoriteChange,
  VideoFavoriteRequestDependencies,
} from "./video-favorites.types";

const account = { mid: "123", generation: 2 };
const video = { aid: "116378950441190", bvid: "BV1VeQFBDEC2" };
const cookie = "SESSDATA=test-session; DedeUserID=123; bili_jct=a+b/==";
const folder = {
  id: 303350121,
  fid: 3033501,
  mid: 123,
  title: "默认收藏夹",
  media_count: 3,
  fav_state: 1,
};
const success = {
  code: 0,
  message: "OK",
  ttl: 1,
  data: { prompt: true, ga_data: null, toast_msg: "", success_num: 0 },
};
const change: VideoFavoriteChange = { video, initialIds: [], selectedIds: [303350121, 3328621821] };

function setup(value: string | null = cookie) {
  const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json(success));
  vi.stubGlobal("fetch", request);
  const dependencies: VideoFavoriteRequestDependencies = {
    readCookie: vi.fn(async () => value),
    isCurrentAccount: vi.fn(() => true),
  };
  return { request, dependencies };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("video favorite reads", () => {
  test("loads relation and membership with current aid, bvid and account MID", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({ favorite: true, like: true })
      .mockResolvedValueOnce({ count: 1, list: [folder] });
    expect(await fetchVideoRelation(video, request, () => true)).toEqual({
      favorite: true,
      like: true,
    });
    const result = await fetchVideoFavoriteFolders(account, video, request, () => true);
    expect(result.list[0].fav_state).toBe(1);
    expect(request.mock.calls[0][0]).toBe(
      `/x/web-interface/archive/relation?aid=${video.aid}&bvid=${video.bvid}&web_location=333.788`,
    );
    expect(request.mock.calls[1][0]).toBe(
      `/x/v3/fav/folder/created/list-all?up_mid=123&type=2&rid=${video.aid}&web_location=333.1387`,
    );
  });

  test("requires explicit membership and supports an empty folder list", async () => {
    const request = vi.fn().mockResolvedValue({ count: 0, list: null });
    expect((await fetchVideoFavoriteFolders(account, video, request, () => true)).list).toEqual([]);
    const { fav_state: _state, ...withoutState } = folder;
    request.mockResolvedValue({ count: 1, list: [withoutState] });
    await expect(fetchVideoFavoriteFolders(account, video, request, () => true)).rejects.toThrow();
  });

  test("isolates keys by video and login generation", () => {
    for (const getKey of [getVideoRelationKey, getVideoFavoriteFoldersKey]) {
      const key = getKey(account, video);
      expect(key).not.toEqual(getKey({ ...account, mid: "456" }, video));
      expect(key).not.toEqual(getKey({ ...account, generation: 3 }, video));
      expect(key).not.toEqual(getKey(account, { aid: "456", bvid: "BV2" }));
    }
  });

  test("rejects stale reads and expired credentials", async () => {
    let current = true;
    const request = vi.fn(async () => {
      current = false;
      return { favorite: true };
    });
    await expect(fetchVideoRelation(video, request, () => current)).rejects.toBeInstanceOf(
      BilibiliSessionChangedError,
    );
    request.mockRejectedValue(Object.assign(new Error("expired"), { code: -101 }));
    await expect(fetchVideoRelation(video, request, () => true)).rejects.toBeInstanceOf(
      FavoriteLoginRequiredError,
    );
  });
});

describe("video favorite writes", () => {
  test("posts encoded form data using a single credential snapshot, accepts success_num=0", async () => {
    const { request, dependencies } = setup();
    await expect(modifyVideoFavorites(account, change, dependencies)).resolves.toEqual(change);
    expect(request).toHaveBeenCalledOnce();
    expect(dependencies.readCookie).toHaveBeenCalledOnce();
    const [url, options] = request.mock.calls[0];
    expect(url).toBe("https://api.bilibili.com/x/v3/fav/resource/deal");
    expect(options?.method).toBe("POST");
    expect(options?.credentials).toBe("omit");
    const headers = new Headers(options?.headers);
    expect(headers.get("cookie")).toBe(cookie);
    expect(headers.get("content-type")).toBe("application/x-www-form-urlencoded");
    expect(headers.get("referer")).toBe(`https://www.bilibili.com/video/${video.bvid}/`);
    expect(headers.has("sec-fetch-mode")).toBe(false);
    expect(Object.fromEntries(new URLSearchParams(String(options?.body)))).toEqual({
      rid: video.aid,
      type: "2",
      add_media_ids: "303350121,3328621821",
      del_media_ids: "",
      platform: "web",
      from_spmid: "333.1007.tianma.2-1-3.click",
      spmid: "333.788.0.0",
      statistics: '{"appId":100,"platform":5}',
      csrf: "a+b/==",
    });
  });

  test.each([
    { initial: [], selected: [303350121], add: "303350121", remove: "" },
    { initial: [303350121], selected: [3328621821], add: "3328621821", remove: "303350121" },
    { initial: [303350121, 3328621821], selected: [], add: "", remove: "303350121,3328621821" },
  ])(
    "computes single, mixed and all-removed changes: $selected",
    async ({ initial, selected, add, remove }) => {
      const { request, dependencies } = setup();
      await modifyVideoFavorites(
        account,
        { video, initialIds: initial, selectedIds: selected },
        dependencies,
      );
      const body = new URLSearchParams(String(request.mock.calls[0][1]?.body));
      expect(body.get("add_media_ids")).toBe(add);
      expect(body.get("del_media_ids")).toBe(remove);
    },
  );

  test("does not submit an unchanged selection, regardless of ordering or duplicates", async () => {
    const { request, dependencies } = setup();
    expect(getFavoriteChanges([1, 2], [2, 1, 1])).toEqual({ add: [], remove: [] });
    await modifyVideoFavorites(
      account,
      { video, initialIds: [1, 2], selectedIds: [2, 1] },
      dependencies,
    );
    expect(request).not.toHaveBeenCalled();
    expect(dependencies.readCookie).not.toHaveBeenCalled();
  });

  test.each([null, "", "SESSDATA=x", "SESSDATA=x; DedeUserID=123"])(
    "blocks missing credentials: %s",
    async (value) => {
      const { request, dependencies } = setup(value);
      await expect(modifyVideoFavorites(account, change, dependencies)).rejects.toBeInstanceOf(
        FavoriteLoginRequiredError,
      );
      expect(request).not.toHaveBeenCalled();
    },
  );

  test("rejects a Cookie from a different account", async () => {
    const { request, dependencies } = setup("SESSDATA=x; DedeUserID=456; bili_jct=x");
    await expect(modifyVideoFavorites(account, change, dependencies)).rejects.toBeInstanceOf(
      BilibiliSessionChangedError,
    );
    expect(request).not.toHaveBeenCalled();
  });

  test.each([0, -1, NaN, 9007199254740992])(
    "rejects invalid folder id %s before sending",
    async (id) => {
      const { request, dependencies } = setup();
      await expect(
        modifyVideoFavorites(account, { ...change, selectedIds: [id] }, dependencies),
      ).rejects.toThrow("ID 无效");
      expect(request).not.toHaveBeenCalled();
    },
  );

  test.each([-101, -111])("recognizes login failures %s", async (code) => {
    const { request, dependencies } = setup();
    request.mockResolvedValue(Response.json({ code }));
    await expect(modifyVideoFavorites(account, change, dependencies)).rejects.toBeInstanceOf(
      FavoriteLoginRequiredError,
    );
  });

  test("keeps a business rejection distinct from an unknown result", async () => {
    const { request, dependencies } = setup();
    request.mockResolvedValue(Response.json({ code: -403, message: "操作被拒绝" }));
    await expect(modifyVideoFavorites(account, change, dependencies)).rejects.toThrow("操作被拒绝");
    expect(request).toHaveBeenCalledOnce();
  });

  test.each([
    () => Response.json(success, { status: 503 }),
    () => Response.json({ code: "0" }),
    () => Response.json({ code: 0 }),
    () => new Response("not json"),
  ])("requires reconciliation after malformed/HTTP responses, never retries", async (response) => {
    const { request, dependencies } = setup();
    request.mockResolvedValue(response());
    await expect(modifyVideoFavorites(account, change, dependencies)).rejects.toBeInstanceOf(
      FavoriteResultUnknownError,
    );
    expect(request).toHaveBeenCalledOnce();
  });

  test("requires reconciliation after network failure", async () => {
    const { request, dependencies } = setup();
    request.mockRejectedValue(new Error("offline"));
    await expect(modifyVideoFavorites(account, change, dependencies)).rejects.toBeInstanceOf(
      FavoriteResultUnknownError,
    );
    expect(request).toHaveBeenCalledOnce();
  });

  test.each(["credentials", "response", "body"])(
    "discards account changes during %s",
    async (phase) => {
      const { request, dependencies } = setup();
      let current = true;
      dependencies.isCurrentAccount = () => current;
      if (phase === "credentials")
        dependencies.readCookie = async () => {
          current = false;
          return cookie;
        };
      if (phase === "response")
        request.mockImplementation(async () => {
          current = false;
          return Response.json(success);
        });
      if (phase === "body") {
        const response = Response.json(success);
        vi.spyOn(response, "json").mockImplementation(async () => {
          current = false;
          return success;
        });
        request.mockResolvedValue(response);
      }
      await expect(modifyVideoFavorites(account, change, dependencies)).rejects.toBeInstanceOf(
        BilibiliSessionChangedError,
      );
      if (phase === "credentials") expect(request).not.toHaveBeenCalled();
    },
  );

  test("aborts after 15 seconds without retrying", async () => {
    vi.useFakeTimers();
    const { request, dependencies } = setup();
    request.mockImplementation(
      (_url, options) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    );
    const result = expect(modifyVideoFavorites(account, change, dependencies)).rejects.toThrow(
      "超时",
    );
    await vi.advanceTimersByTimeAsync(15000);
    await result;
    expect(request).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
});
