import { UA } from "../constants";
import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import {
  createBilibiliRequestHeaders,
  getBilibiliCsrf,
  getBilibiliUserId,
  hasBilibiliLoginCookie,
} from "./bilibili-cookie.helpers";
import {
  FavoriteFolderMutationResponseSchema,
  FavoriteFolderSchema,
  FavoriteFoldersSchema,
  FavoriteResourcesSchema,
} from "./favorites.schema";
import type {
  CreateFavoriteFolderInput,
  DeleteFavoriteFolderInput,
  FavoriteAccount,
  FavoriteFoldersKey,
  FavoriteListItem,
  FavoriteRequest,
  FavoriteRequestDependencies,
  FavoriteResources,
  FavoriteResourcesKey,
} from "./favorites.types";
import { FavoriteLoginRequiredError } from "./video-favorites";

const FAVORITE_PAGE_SIZE = 40;
const FAVORITE_FOLDER_ADD_URL = "https://api.bilibili.com/x/v3/fav/folder/add";
const FAVORITE_FOLDER_DEL_URL = "https://api.bilibili.com/x/v3/fav/folder/del";
const FAVORITE_FOLDER_MUTATION_TIMEOUT = 15000;

export class FavoriteFolderResultUnknownError extends Error {}

export function getFavoriteFoldersKey(account: FavoriteAccount): FavoriteFoldersKey {
  return ["bilibili-favorite-folders", account.mid, account.generation];
}

export function getFavoriteResourcesKey(
  account: FavoriteAccount | null,
  folderId: number | undefined,
  pageIndex: number,
  previousPage: FavoriteResources | null,
): FavoriteResourcesKey | null {
  if (!account || !folderId || (previousPage && !previousPage.has_more)) {
    return null;
  }
  return ["bilibili-favorite-resources", account.mid, account.generation, folderId, pageIndex + 1];
}

async function requestForCurrentAccount(
  url: string,
  request: FavoriteRequest,
  isCurrentAccount: () => boolean,
) {
  function assertCurrent() {
    if (!isCurrentAccount()) {
      throw new BilibiliSessionChangedError();
    }
  }
  assertCurrent();
  try {
    const data = await request(url);
    assertCurrent();
    return data;
  } catch (error) {
    assertCurrent();
    throw error;
  }
}

export async function fetchBilibiliFavoriteFolders(
  account: FavoriteAccount,
  request: FavoriteRequest,
  isCurrentAccount: () => boolean,
) {
  const url = `/x/v3/fav/folder/created/list-all?up_mid=${encodeURIComponent(account.mid)}`;
  return FavoriteFoldersSchema.parse(
    await requestForCurrentAccount(url, request, isCurrentAccount),
  );
}

export async function fetchBilibiliFavoriteResources(
  folderId: number,
  page: number,
  request: FavoriteRequest,
  isCurrentAccount: () => boolean,
) {
  const url = `/x/v3/fav/resource/list?media_id=${folderId}&pn=${page}&ps=${FAVORITE_PAGE_SIZE}&keyword=&order=mtime&type=0&tid=0&platform=web`;
  const data = FavoriteResourcesSchema.parse(
    await requestForCurrentAccount(url, request, isCurrentAccount),
  );
  if (data.info.id !== folderId) {
    throw new Error("收藏夹数据不匹配，请重试");
  }
  return data;
}

export function getFavoriteListItems(pages: FavoriteResources[]): FavoriteListItem[] {
  const seen = new Set<string>();
  const items: FavoriteListItem[] = [];
  for (const page of pages) {
    for (const media of page.medias) {
      const key = `${media.type}:${media.id}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      const bvid = media.bvid?.trim() || media.bv_id?.trim();
      const playable = media.type === 2 && Boolean(bvid);
      items.push({
        key,
        title: media.title,
        video:
          playable && bvid
            ? {
                bvid,
                aid: media.id,
                title: media.title,
                cover: media.cover ?? "",
                desc: media.intro ?? "",
                duration: media.duration ?? 0,
                date: media.pubtime ?? 0,
                mid: media.upper?.mid ?? 0,
                name: media.upper?.name ?? "未知UP主",
                face: media.upper?.face ?? "",
                play: media.cnt_info?.play ?? undefined,
                danmaku: media.cnt_info?.danmaku ?? undefined,
              }
            : null,
      });
    }
  }
  return items;
}

type FavoriteFolderMutationRequest = {
  account: FavoriteAccount;
  dependencies: FavoriteRequestDependencies;
  /** 用于错误文案的动作名，例如「创建收藏夹」 */
  action: string;
  url: string;
  contentType?: string;
  body: (csrf: string) => BodyInit;
};

async function runFavoriteFolderMutation({
  account,
  dependencies,
  action,
  url,
  contentType,
  body,
}: FavoriteFolderMutationRequest) {
  function assertCurrent() {
    if (!dependencies.isCurrentAccount(account)) {
      throw new BilibiliSessionChangedError();
    }
  }
  assertCurrent();
  const cookie = await dependencies.readCookie();
  assertCurrent();
  if (!cookie || !hasBilibiliLoginCookie(cookie)) {
    throw new FavoriteLoginRequiredError("请先登录 B站");
  }
  if (getBilibiliUserId(cookie) !== account.mid) {
    throw new BilibiliSessionChangedError();
  }
  const csrf = getBilibiliCsrf(cookie);
  if (!csrf) {
    throw new FavoriteLoginRequiredError("登录凭据缺少 CSRF，请重新登录 B站");
  }
  const headers: Record<string, string> = {
    accept: "application/json",
    "user-agent": UA,
    origin: "https://www.bilibili.com",
    referer: "https://space.bilibili.com",
  };
  if (contentType) {
    headers["content-type"] = contentType;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FAVORITE_FOLDER_MUTATION_TIMEOUT);
  let receivedResult = false;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: createBilibiliRequestHeaders(url, headers, cookie),
      credentials: "omit",
      body: body(csrf),
      signal: controller.signal,
    });
    assertCurrent();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const parsed = FavoriteFolderMutationResponseSchema.safeParse(await response.json());
    assertCurrent();
    if (!parsed.success) {
      throw new Error("响应格式异常");
    }
    const { code, message, data } = parsed.data;
    receivedResult = true;
    if (code === -101 || code === -111) {
      throw new FavoriteLoginRequiredError("登录凭据失效，请重新登录 B站");
    }
    if (code !== 0) {
      throw new Error(`${action}失败（${code}）：${message || "请稍后重试"}`);
    }
    return data;
  } catch (error) {
    assertCurrent();
    if (!receivedResult) {
      throw new FavoriteFolderResultUnknownError(
        controller.signal.aborted
          ? `${action}超时，请稍后刷新收藏夹确认结果`
          : `无法确认${action}结果，请稍后刷新收藏夹确认`,
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function createBilibiliFavoriteFolder(
  { account, title, privacy }: CreateFavoriteFolderInput,
  dependencies: FavoriteRequestDependencies,
) {
  const data = await runFavoriteFolderMutation({
    account,
    dependencies,
    action: "创建收藏夹",
    url: FAVORITE_FOLDER_ADD_URL,
    contentType: "application/x-www-form-urlencoded",
    body: (csrf) => new URLSearchParams({ title, privacy: String(privacy), csrf }).toString(),
  });
  const folder = FavoriteFolderSchema.safeParse(data);
  if (!folder.success) {
    throw new Error("创建收藏夹结果异常，请刷新收藏夹确认");
  }
  return folder.data;
}

export async function deleteBilibiliFavoriteFolder(
  { account, folderId }: DeleteFavoriteFolderInput,
  dependencies: FavoriteRequestDependencies,
) {
  if (!Number.isSafeInteger(folderId) || folderId <= 0) {
    throw new Error("收藏夹 ID 无效，请刷新后重试");
  }
  await runFavoriteFolderMutation({
    account,
    dependencies,
    action: "删除收藏夹",
    url: FAVORITE_FOLDER_DEL_URL,
    // 与网页端一致使用 multipart，body 由 fetch 自动补上 boundary
    body: (csrf) => {
      const form = new FormData();
      form.append("media_ids", String(folderId));
      form.append("platform", "web");
      form.append("csrf", csrf);
      return form;
    },
  });
}
