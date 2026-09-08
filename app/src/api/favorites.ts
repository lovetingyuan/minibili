import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import { FavoriteFoldersSchema, FavoriteResourcesSchema } from "./favorites.schema";
import type {
  FavoriteAccount,
  FavoriteFoldersKey,
  FavoriteListItem,
  FavoriteRequest,
  FavoriteResources,
  FavoriteResourcesKey,
} from "./favorites.types";

export const FAVORITE_PAGE_SIZE = 40;

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
