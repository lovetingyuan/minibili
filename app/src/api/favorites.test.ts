import { describe, expect, test, vi } from "vitest";

import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import {
  fetchBilibiliFavoriteFolders,
  fetchBilibiliFavoriteResources,
  getFavoriteFoldersKey,
  getFavoriteListItems,
  getFavoriteResourcesKey,
} from "./favorites";
import { FavoriteFoldersSchema, FavoriteResourcesSchema } from "./favorites.schema";
import type { FavoriteRequest } from "./favorites.types";

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
    expect(request.mock.calls[0][0]).toBe(
      "/x/v3/fav/folder/created/list-all?up_mid=98765&web_location=333.1387",
    );
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
      web_location: "333.1387",
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
