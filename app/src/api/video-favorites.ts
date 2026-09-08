import { UA } from "../constants";
import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import {
  createBilibiliRequestHeaders,
  getBilibiliCsrf,
  getBilibiliUserId,
  hasBilibiliLoginCookie,
} from "./bilibili-cookie.helpers";
import type { FavoriteAccount, FavoriteRequest } from "./favorites.types";
import {
  FavoriteDealDataSchema,
  FavoriteDealResponseSchema,
  VideoFavoriteFoldersSchema,
  VideoRelationSchema,
} from "./video-favorites.schema";
import type {
  FavoriteVideo,
  VideoFavoriteChange,
  VideoFavoriteFoldersKey,
  VideoFavoriteRequestDependencies,
  VideoRelationKey,
} from "./video-favorites.types";

export class FavoriteLoginRequiredError extends Error {}
export class FavoriteResultUnknownError extends Error {}

export function getVideoRelationKey(
  account: FavoriteAccount,
  video: FavoriteVideo,
): VideoRelationKey {
  return ["bilibili-video-relation", account.mid, account.generation, video.aid, video.bvid];
}

export function getVideoFavoriteFoldersKey(
  account: FavoriteAccount,
  video: FavoriteVideo,
): VideoFavoriteFoldersKey {
  return [
    "bilibili-video-favorite-folders",
    account.mid,
    account.generation,
    video.aid,
    video.bvid,
  ];
}

export function getFavoriteChanges(initialIds: number[], selectedIds: number[]) {
  const initial = new Set(initialIds);
  const selected = new Set(selectedIds);
  return {
    add: [...selected].filter((id) => !initial.has(id)),
    remove: [...initial].filter((id) => !selected.has(id)),
  };
}

function assertVideo(video: FavoriteVideo) {
  if (!/^[1-9]\d*$/.test(video.aid) || !Number.isSafeInteger(Number(video.aid)) || !video.bvid) {
    throw new Error("视频 ID 无效，请重新打开视频");
  }
}

async function readForAccount(url: string, request: FavoriteRequest, isCurrent: () => boolean) {
  if (!isCurrent()) throw new BilibiliSessionChangedError();
  try {
    const data = await request(url);
    if (!isCurrent()) throw new BilibiliSessionChangedError();
    return data;
  } catch (error) {
    if (!isCurrent()) throw new BilibiliSessionChangedError();
    if (error instanceof Error && "code" in error && (error.code === -101 || error.code === -111)) {
      throw new FavoriteLoginRequiredError("登录凭据失效，请重新登录 B站");
    }
    throw error;
  }
}

export async function fetchVideoRelation(
  video: FavoriteVideo,
  request: FavoriteRequest,
  isCurrent: () => boolean,
) {
  assertVideo(video);
  const query = new URLSearchParams({ aid: video.aid, bvid: video.bvid });
  return VideoRelationSchema.parse(
    await readForAccount(`/x/web-interface/archive/relation?${query}`, request, isCurrent),
  );
}

export async function fetchVideoFavoriteFolders(
  account: FavoriteAccount,
  video: FavoriteVideo,
  request: FavoriteRequest,
  isCurrent: () => boolean,
) {
  assertVideo(video);
  const query = new URLSearchParams({
    up_mid: account.mid,
    type: "2",
    rid: video.aid,
  });
  return VideoFavoriteFoldersSchema.parse(
    await readForAccount(`/x/v3/fav/folder/created/list-all?${query}`, request, isCurrent),
  );
}

export async function modifyVideoFavorites(
  account: FavoriteAccount,
  change: VideoFavoriteChange,
  dependencies: VideoFavoriteRequestDependencies,
) {
  function assertCurrent() {
    if (!dependencies.isCurrentAccount(account)) throw new BilibiliSessionChangedError();
  }
  assertCurrent();
  assertVideo(change.video);
  const { add, remove } = getFavoriteChanges(change.initialIds, change.selectedIds);
  if (
    [...change.initialIds, ...change.selectedIds].some((id) => !Number.isSafeInteger(id) || id <= 0)
  ) {
    throw new Error("收藏夹 ID 无效，请刷新后重试");
  }
  if (!add.length && !remove.length) return change;
  const cookie = await dependencies.readCookie();
  assertCurrent();
  if (!cookie || !hasBilibiliLoginCookie(cookie))
    throw new FavoriteLoginRequiredError("请先登录 B站");
  if (getBilibiliUserId(cookie) !== account.mid) throw new BilibiliSessionChangedError();
  const csrf = getBilibiliCsrf(cookie);
  if (!csrf) throw new FavoriteLoginRequiredError("登录凭据缺少 CSRF，请重新登录 B站");
  const url = "https://api.bilibili.com/x/v3/fav/resource/deal";
  const body = new URLSearchParams({
    rid: change.video.aid,
    type: "2",
    add_media_ids: add.join(","),
    del_media_ids: remove.join(","),
    platform: "web",
    from_spmid: "333.1007.tianma.2-1-3.click",
    spmid: "333.788.0.0",
    statistics: JSON.stringify({ appId: 100, platform: 5 }),
    csrf,
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let receivedResult = false;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: createBilibiliRequestHeaders(
        url,
        {
          accept: "application/json",
          "content-type": "application/x-www-form-urlencoded",
          "user-agent": UA,
          origin: "https://www.bilibili.com",
          referer: `https://www.bilibili.com/video/${encodeURIComponent(change.video.bvid)}/`,
        },
        cookie,
      ),
      credentials: "omit",
      body: body.toString(),
      signal: controller.signal,
    });
    assertCurrent();
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const parsed = FavoriteDealResponseSchema.safeParse(await response.json());
    assertCurrent();
    if (!parsed.success) throw new Error("响应格式异常");
    const { code, message, data } = parsed.data;
    if (code === 0 && !FavoriteDealDataSchema.safeParse(data).success)
      throw new Error("响应缺少有效收藏结果");
    receivedResult = true;
    if (code === -101 || code === -111)
      throw new FavoriteLoginRequiredError("登录凭据失效，请重新登录 B站");
    if (code !== 0) throw new Error(`收藏操作失败（${code}）：${message || "请稍后重试"}`);
    return change;
  } catch (error) {
    assertCurrent();
    if (!receivedResult) {
      throw new FavoriteResultUnknownError(
        controller.signal.aborted
          ? "收藏操作超时，请刷新收藏夹确认结果后再操作"
          : "无法确认收藏结果，请刷新收藏夹后再操作",
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
