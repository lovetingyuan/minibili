import { afterEach, describe, expect, test, vi } from "vitest";

import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import {
  createBilibiliFavoriteFolder,
  deleteBilibiliFavoriteFolder,
  FavoriteFolderResultUnknownError,
  fetchBilibiliFavoriteFolders,
  fetchBilibiliFavoriteResources,
  getFavoriteFoldersKey,
  getFavoriteListItems,
  getFavoriteResourcesKey,
} from "./favorites";
import { FavoriteFoldersSchema, FavoriteResourcesSchema } from "./favorites.schema";
import type { FavoriteRequest, FavoriteRequestDependencies } from "./favorites.types";
import { FavoriteLoginRequiredError } from "./video-favorites";

const account = { mid: "393120021", generation: 3 };
const folder = {
  id: 303350121,
  fid: 3033501,
  mid: 393120021,
  title: "默认收藏夹",
  media_count: 34,
};
const secondFolder = {
  ...folder,
  id: 3328621821,
  fid: 33286218,
  title: "研究生学习",
  media_count: 8,
};
const media = {
  id: 315372850,
  type: 2,
  title: "48个国际音标的示范跟读",
  cover: "http://i0.hdslb.com/bfs/archive/cover.jpg",
  intro: "-",
  duration: 258,
  pubtime: 1687964740,
  fav_time: 1782785143,
  bvid: "BV1MP411e7JJ",
  bv_id: "BV1MP411e7JJ",
  upper: { mid: 615661103, name: "英语Eric飞", face: "https://i2.hdslb.com/bfs/face/up.jpg" },
  cnt_info: { play: 3868027, danmaku: 33255, collect: 167216 },
};

function createPage(medias = [media], hasMore = false) {
  return FavoriteResourcesSchema.parse({ info: folder, medias, has_more: hasMore });
}

describe("Bilibili favorite folders and resources", () => {
  test("uses the signed-in MID and keeps the API's folder order", async () => {
    const request = vi
      .fn<FavoriteRequest>()
      .mockResolvedValue({ count: 2, list: [folder, secondFolder], season: null });
    const result = await fetchBilibiliFavoriteFolders(
      { mid: "98765", generation: 1 },
      request,
      () => true,
    );
    expect(request.mock.calls[0][0]).toBe("/x/v3/fav/folder/created/list-all?up_mid=98765");
    expect(result.list.map((item) => item.title)).toEqual(["默认收藏夹", "研究生学习"]);
  });

  test("uses folder id rather than fid and sends the requested page", async () => {
    const request = vi.fn<FavoriteRequest>().mockResolvedValue(createPage());
    await fetchBilibiliFavoriteResources(folder.id, 2, request, () => true);
    const url = new URL(request.mock.calls[0][0], "https://api.bilibili.com");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      media_id: "303350121",
      pn: "2",
      ps: "40",
      keyword: "",
      order: "mtime",
      type: "0",
      tid: "0",
      platform: "web",
    });
    expect(url.searchParams.get("media_id")).not.toBe(String(folder.fid));
  });

  test("normalizes null and missing lists for empty accounts and folders", () => {
    for (const list of [null, undefined, []]) {
      expect(FavoriteFoldersSchema.parse({ count: 0, list }).list).toEqual([]);
      expect(
        FavoriteResourcesSchema.parse({ info: folder, medias: list, has_more: false }).medias,
      ).toEqual([]);
    }
  });

  test("isolates caches by account, generation, folder and page", () => {
    expect(getFavoriteFoldersKey(account)).not.toEqual(
      getFavoriteFoldersKey({ ...account, mid: "2" }),
    );
    expect(getFavoriteFoldersKey(account)).not.toEqual(
      getFavoriteFoldersKey({ ...account, generation: 4 }),
    );
    const key = getFavoriteResourcesKey(account, folder.id, 0, null);
    expect(key).toEqual(["bilibili-favorite-resources", account.mid, 3, folder.id, 1]);
    expect(key).not.toEqual(getFavoriteResourcesKey({ ...account, mid: "2" }, folder.id, 0, null));
    expect(key).not.toEqual(
      getFavoriteResourcesKey({ ...account, generation: 4 }, folder.id, 0, null),
    );
    expect(key).not.toEqual(getFavoriteResourcesKey(account, secondFolder.id, 0, null));
    expect(key).not.toEqual(getFavoriteResourcesKey(account, folder.id, 1, createPage([], true)));
  });

  test("does not request while logged out, without a folder, or after has_more=false", () => {
    expect(getFavoriteResourcesKey(null, folder.id, 0, null)).toBeNull();
    expect(getFavoriteResourcesKey(account, undefined, 0, null)).toBeNull();
    expect(getFavoriteResourcesKey(account, folder.id, 1, createPage())).toBeNull();
    // A short page is not the end when the API still advertises more.
    expect(getFavoriteResourcesKey(account, folder.id, 1, createPage([media], true))?.at(-1)).toBe(
      2,
    );
  });

  test("maps playback metadata and deduplicates overlapping pages", () => {
    const pages = [
      createPage([media], true),
      createPage([media, { ...media, id: 116814889619672, bvid: "BV1Wh7G6HEYa" }]),
    ];
    const result = getFavoriteListItems(pages);
    expect(result).toHaveLength(2);
    expect(result[0].video).toMatchObject({
      bvid: media.bvid,
      aid: media.id,
      name: media.upper.name,
      mid: media.upper.mid,
      cover: media.cover,
      duration: 258,
      date: media.pubtime,
      play: 3868027,
      danmaku: 33255,
    });
    expect(result[1].video?.aid).toBe(116814889619672);
  });

  test("prefers bvid, falls back to bv_id, and keeps unsupported items non-playable", () => {
    const page = FavoriteResourcesSchema.parse({
      info: folder,
      has_more: false,
      medias: [
        { ...media, bvid: "preferred", bv_id: "fallback" },
        { ...media, id: 2, bvid: "", bv_id: "fallback" },
        { ...media, id: 3, bvid: null, bv_id: null, upper: null },
        { ...media, id: 4, type: 12 },
      ],
    });
    expect(getFavoriteListItems([page]).map((item) => item.video?.bvid ?? null)).toEqual([
      "preferred",
      "fallback",
      null,
      null,
    ]);
  });

  test.each(["folders", "resources"])(
    "rejects %s requests before starting or after a session change",
    async (kind) => {
      let active = false;
      const request = vi.fn<FavoriteRequest>(async () => {
        active = false;
        return kind === "folders" ? { count: 1, list: [folder] } : createPage();
      });
      const run = () =>
        kind === "folders"
          ? fetchBilibiliFavoriteFolders(account, request, () => active)
          : fetchBilibiliFavoriteResources(folder.id, 1, request, () => active);
      await expect(run()).rejects.toBeInstanceOf(BilibiliSessionChangedError);
      expect(request).not.toHaveBeenCalled();
      active = true;
      await expect(run()).rejects.toBeInstanceOf(BilibiliSessionChangedError);
      expect(request).toHaveBeenCalledOnce();
    },
  );

  test("propagates request/schema failures instead of presenting an empty folder", async () => {
    const request = vi.fn<FavoriteRequest>().mockRejectedValue(new Error("network"));
    await expect(fetchBilibiliFavoriteFolders(account, request, () => true)).rejects.toThrow(
      "network",
    );
    await expect(fetchBilibiliFavoriteResources(folder.id, 1, request, () => true)).rejects.toThrow(
      "network",
    );
    await expect(
      fetchBilibiliFavoriteResources(
        folder.id,
        1,
        async () => ({}),
        () => true,
      ),
    ).rejects.toThrow();
    await expect(
      fetchBilibiliFavoriteResources(
        secondFolder.id,
        1,
        async () => createPage(),
        () => true,
      ),
    ).rejects.toThrow("不匹配");
  });
});

describe("Bilibili favorite folder writes", () => {
  const writeAccount = { mid: "393120021", generation: 3 };
  const cookie = "SESSDATA=session; DedeUserID=393120021; bili_jct=csrf-token";
  const created = {
    id: 4069395795,
    fid: 40693957,
    mid: 393120021,
    title: "test",
    media_count: 0,
  };

  function setup(value: string | null = cookie) {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ code: 0, message: "OK", ttl: 1, data: created }));
    vi.stubGlobal("fetch", request);
    const dependencies: FavoriteRequestDependencies = {
      readCookie: vi.fn(async () => value),
      isCurrentAccount: vi.fn(() => true),
    };
    return { request, dependencies };
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("creates a folder with the captured form body and the CSRF token", async () => {
    const { request, dependencies } = setup();
    const result = await createBilibiliFavoriteFolder(
      { account: writeAccount, title: "test", privacy: 0 },
      dependencies,
    );
    expect(result).toEqual(created);
    expect(request).toHaveBeenCalledOnce();
    expect(dependencies.readCookie).toHaveBeenCalledOnce();
    const [url, options] = request.mock.calls[0];
    expect(url).toBe("https://api.bilibili.com/x/v3/fav/folder/add");
    expect(options?.method).toBe("POST");
    expect(options?.credentials).toBe("omit");
    const headers = new Headers(options?.headers);
    expect(headers.get("cookie")).toBe(cookie);
    expect(headers.get("content-type")).toBe("application/x-www-form-urlencoded");
    expect(Object.fromEntries(new URLSearchParams(String(options?.body)))).toEqual({
      title: "test",
      privacy: "0",
      csrf: "csrf-token",
    });
  });

  test("deletes a folder with the multipart body used by the web client", async () => {
    const { request, dependencies } = setup();
    request.mockResolvedValue(Response.json({ code: 0, message: "0", ttl: 1, data: null }));
    await deleteBilibiliFavoriteFolder(
      { account: writeAccount, folderId: 4069395795 },
      dependencies,
    );
    const [url, options] = request.mock.calls[0];
    expect(url).toBe("https://api.bilibili.com/x/v3/fav/folder/del");
    expect(options?.method).toBe("POST");
    const headers = new Headers(options?.headers);
    expect(headers.get("cookie")).toBe(cookie);
    // multipart boundary 由 fetch 生成，不能手写 content-type
    expect(headers.has("content-type")).toBe(false);
    const body = options?.body;
    expect(body).toBeInstanceOf(FormData);
    expect(Object.fromEntries((body as FormData).entries())).toEqual({
      media_ids: "4069395795",
      platform: "web",
      csrf: "csrf-token",
    });
  });

  test("refuses an invalid folder id before requesting", async () => {
    const { request, dependencies } = setup();
    for (const folderId of [0, -1, 1.5, Number.NaN]) {
      await expect(
        deleteBilibiliFavoriteFolder({ account: writeAccount, folderId }, dependencies),
      ).rejects.toThrow("收藏夹 ID 无效");
    }
    expect(request).not.toHaveBeenCalled();
  });

  test("requires the signed-in cookie, matching mid and a CSRF token", async () => {
    const missingLogin = setup("SESSDATA=session").dependencies;
    await expect(
      createBilibiliFavoriteFolder(
        { account: writeAccount, title: "test", privacy: 0 },
        missingLogin,
      ),
    ).rejects.toBeInstanceOf(FavoriteLoginRequiredError);

    const missingCsrf = setup("SESSDATA=session; DedeUserID=393120021").dependencies;
    await expect(
      deleteBilibiliFavoriteFolder({ account: writeAccount, folderId: 1 }, missingCsrf),
    ).rejects.toBeInstanceOf(FavoriteLoginRequiredError);

    const otherAccount = setup("SESSDATA=session; DedeUserID=1; bili_jct=csrf-token").dependencies;
    await expect(
      deleteBilibiliFavoriteFolder({ account: writeAccount, folderId: 1 }, otherAccount),
    ).rejects.toBeInstanceOf(BilibiliSessionChangedError);
  });

  test("rejects stale sessions before and after the request", async () => {
    let current = false;
    const request = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", request);
    const dependencies: FavoriteRequestDependencies = {
      readCookie: vi.fn(async () => cookie),
      isCurrentAccount: () => current,
    };
    await expect(
      createBilibiliFavoriteFolder(
        { account: writeAccount, title: "test", privacy: 1 },
        dependencies,
      ),
    ).rejects.toBeInstanceOf(BilibiliSessionChangedError);
    expect(request).not.toHaveBeenCalled();

    current = true;
    request.mockImplementation(async () => {
      current = false;
      return Response.json({ code: 0, message: "OK", data: created });
    });
    await expect(
      createBilibiliFavoriteFolder(
        { account: writeAccount, title: "test", privacy: 1 },
        dependencies,
      ),
    ).rejects.toBeInstanceOf(BilibiliSessionChangedError);
  });

  test("reports expired credentials and API failures with the server message", async () => {
    const expired = setup();
    expired.request.mockResolvedValue(Response.json({ code: -101, message: "账号未登录" }));
    await expect(
      createBilibiliFavoriteFolder(
        { account: writeAccount, title: "test", privacy: 0 },
        expired.dependencies,
      ),
    ).rejects.toBeInstanceOf(FavoriteLoginRequiredError);

    const rejected = setup();
    rejected.request.mockResolvedValue(Response.json({ code: 22001, message: "收藏夹名称已存在" }));
    await expect(
      createBilibiliFavoriteFolder(
        { account: writeAccount, title: "test", privacy: 0 },
        rejected.dependencies,
      ),
    ).rejects.toThrow("创建收藏夹失败（22001）：收藏夹名称已存在");
  });

  test("reports an unknown result when the response never arrives", async () => {
    const { request, dependencies } = setup();
    request.mockRejectedValue(new TypeError("Network request failed"));
    await expect(
      deleteBilibiliFavoriteFolder({ account: writeAccount, folderId: 1 }, dependencies),
    ).rejects.toBeInstanceOf(FavoriteFolderResultUnknownError);

    const invalid = setup();
    invalid.request.mockResolvedValue(Response.json({ code: 0, message: "OK", data: { id: 1 } }));
    await expect(
      createBilibiliFavoriteFolder(
        { account: writeAccount, title: "test", privacy: 0 },
        invalid.dependencies,
      ),
    ).rejects.toThrow("创建收藏夹结果异常");
  });
});
