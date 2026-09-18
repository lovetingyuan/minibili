import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import { mapDynamicItem } from "./dynamic-items.mapper";
import { DynamicListResponseSchema } from "./dynamic-items.schema";
import { FollowingDynamicsNavResponseSchema } from "./following-dynamics-nav.schema";
import { FollowingDynamicsUpdateCountSchema } from "./following-dynamics-update.schema";
import type {
  FollowingDynamicsAccount,
  FollowingDynamicsKey,
  FollowingDynamicsListItem,
  FollowingDynamicsNavBatch,
  FollowingDynamicsNavState,
  FollowingDynamicsPage,
  FollowingDynamicsRequest,
  FollowingDynamicsUpdatePage,
} from "./following-dynamics.types";

const FOLLOWING_DYNAMIC_FEATURES = [
  "itemOpusStyle",
  "listOnlyfans",
  "opusBigCover",
  "onlyfansVote",
  "decorationCard",
  "onlyfansAssetsV2",
  "forwardListHidden",
  "ugcDelete",
  "onlyfansQaCard",
  "commentsNewVersion",
  "avatarAutoTheme",
  "sunflowerStyle",
  "cardsEnhance",
  "eva3CardOpus",
  "eva3CardVideo",
  "eva3CardComment",
  "eva3CardVote",
  "eva3CardUser",
].join(",");

const FOLLOWING_DYNAMIC_DEVICE = JSON.stringify({
  platform: "web",
  device: "pc",
  spmid: "333.1365",
});

/** feed/nav 一次拉取最多翻多少页，避免长时间未打开时把请求打爆 */
export const FOLLOWING_DYNAMICS_NAV_MAX_PAGES = 5;

export function buildFollowingDynamicsUrl(page = 1, offset = "") {
  const params = new URLSearchParams({
    timezone_offset: "-480",
    type: "all",
    platform: "web",
    page: String(page),
    features: FOLLOWING_DYNAMIC_FEATURES,
    "x-bili-device-req-json": FOLLOWING_DYNAMIC_DEVICE,
  });
  if (offset) params.set("offset", offset);
  return `/x/polymer/web-dynamic/v1/feed/all?${params}`;
}

export function buildFollowingDynamicsUpdateUrl(updateBaseline = "") {
  const params = new URLSearchParams({
    type: "all",
  });
  if (updateBaseline) params.set("update_baseline", updateBaseline);
  return `/x/polymer/web-dynamic/v1/feed/all/update?${params}`;
}

export function buildFollowingDynamicsNavUrl(updateBaseline = "", offset = "") {
  const params = new URLSearchParams();
  if (updateBaseline) params.set("update_baseline", updateBaseline);
  if (offset) params.set("offset", offset);
  const query = params.toString();
  return query
    ? `/x/polymer/web-dynamic/v1/feed/nav?${query}`
    : "/x/polymer/web-dynamic/v1/feed/nav";
}

export function getFollowingDynamicsKey(
  account: FollowingDynamicsAccount | null,
  index: number,
  previous: FollowingDynamicsPage | null,
): FollowingDynamicsKey | null {
  if (
    !account ||
    (index > 0 && (!previous || !previous.has_more || !previous.items.length || !previous.offset))
  ) {
    return null;
  }
  return [
    "bilibili-following-dynamics",
    account.mid,
    account.generation,
    index + 1,
    index === 0 ? "" : previous!.offset!,
  ];
}

export async function fetchFollowingDynamicsPage(
  page: number,
  offset: string,
  request: FollowingDynamicsRequest,
  isCurrentAccount: () => boolean,
) {
  function assertCurrent() {
    if (!isCurrentAccount()) throw new BilibiliSessionChangedError();
  }

  assertCurrent();
  try {
    const data = await request(buildFollowingDynamicsUrl(page, offset));
    assertCurrent();
    return DynamicListResponseSchema.parse(data);
  } catch (error) {
    assertCurrent();
    throw error;
  }
}

export async function fetchFollowingDynamicsUpdateCount(
  updateBaseline: string,
  request: FollowingDynamicsRequest,
  isCurrentAccount: () => boolean,
) {
  function assertCurrent() {
    if (!isCurrentAccount()) throw new BilibiliSessionChangedError();
  }

  assertCurrent();
  try {
    const data = await request(buildFollowingDynamicsUpdateUrl(updateBaseline));
    assertCurrent();
    return FollowingDynamicsUpdateCountSchema.parse(data);
  } catch (error) {
    assertCurrent();
    throw error;
  }
}

export async function fetchFollowingDynamicsNavPage(
  updateBaseline: string,
  offset: string,
  request: FollowingDynamicsRequest,
  isCurrentAccount: () => boolean,
) {
  function assertCurrent() {
    if (!isCurrentAccount()) throw new BilibiliSessionChangedError();
  }

  assertCurrent();
  try {
    const data = await request(buildFollowingDynamicsNavUrl(updateBaseline, offset));
    assertCurrent();
    return FollowingDynamicsNavResponseSchema.parse(data);
  } catch (error) {
    assertCurrent();
    throw error;
  }
}

/**
 * 按 offset 翻页拉取更新基线以上的动态，直到 has_more=false 或触到页数上限。
 * 同一 UP 可能出现在多条记录里，这里只保留原样顺序，去重由合并逻辑负责。
 */
export async function fetchFollowingDynamicsNavUpdates(
  updateBaseline: string,
  request: FollowingDynamicsRequest,
  isCurrentAccount: () => boolean,
): Promise<FollowingDynamicsNavBatch> {
  const items: FollowingDynamicsNavBatch["items"] = [];
  let newestId: string | null = null;
  let offset = "";
  let complete = false;

  for (let page = 0; page < FOLLOWING_DYNAMICS_NAV_MAX_PAGES; page += 1) {
    const data = await fetchFollowingDynamicsNavPage(
      updateBaseline,
      offset,
      request,
      isCurrentAccount,
    );
    if (page === 0) {
      newestId = data.update_baseline || (data.items[0] ? String(data.items[0].id_str) : null);
    }
    for (const rawItem of data.items) {
      items.push({ mid: String(rawItem.author.mid), idStr: String(rawItem.id_str) });
    }

    const lastItem = data.items.at(-1);
    const nextOffset = data.offset || (lastItem ? String(lastItem.id_str) : "");
    if (!data.has_more || !data.items.length || !nextOffset || nextOffset === offset) {
      complete = true;
      break;
    }
    offset = nextOffset;
  }

  return {
    items,
    newestId,
    oldestId: items.length ? items[items.length - 1].idStr : null,
    complete,
  };
}

/** 动态 id_str 是超出 Number 安全范围的十进制字符串，只能按「长度 + 字典序」比较 */
export function isNewerFollowingDynamicId(id: string, than: string) {
  if (!than) return true;
  if (id.length !== than.length) return id.length > than.length;
  return id > than;
}

/**
 * 把一次 feed/nav 拉取结果合并进本地未读状态。
 * - 首次（没有本地 baseline）只记录基线，不点亮红点，避免把历史动态算成未读：
 *   此时即使触到页数上限也用最新 id 作基线，把更旧的历史整批跳过；
 * - 翻页完整时基线推进到本批最新 id，触到页数上限时只推进到本批最旧 id，剩余下次继续；
 * - `readIds` 保存本次会话里用户已经读到的 id，用来丢弃「轮询在已读之后才落地」的响应。
 */
export function mergeFollowingDynamicsNavUnread(options: {
  state: FollowingDynamicsNavState | undefined;
  batch: FollowingDynamicsNavBatch;
  readIds?: Record<string, string>;
  followedMids?: ReadonlySet<string>;
}): FollowingDynamicsNavState {
  const { state, batch } = options;
  const readIds = options.readIds ?? {};

  if (!state?.baseline) {
    return { baseline: batch.newestId ?? batch.oldestId ?? "", unread: {} };
  }

  const baseline = batch.complete ? batch.newestId : batch.oldestId;
  const unread: Record<string, string> = { ...state.unread };
  for (const item of batch.items) {
    if (!item.mid) continue;
    const readId = readIds[item.mid];
    if (readId && !isNewerFollowingDynamicId(item.idStr, readId)) continue;
    const existing = unread[item.mid];
    if (existing && !isNewerFollowingDynamicId(item.idStr, existing)) continue;
    unread[item.mid] = item.idStr;
  }

  if (options.followedMids) {
    for (const mid of Object.keys(unread)) {
      if (!options.followedMids.has(mid)) {
        delete unread[mid];
      }
    }
  }

  return { baseline: baseline ?? state.baseline, unread };
}

export function countFollowingDynamicsUnreadUps(
  state: FollowingDynamicsNavState | undefined,
  followedMids: ReadonlySet<string>,
) {
  if (!state) return 0;
  let count = 0;
  for (const mid of followedMids) {
    if (state.unread[mid]) count += 1;
  }
  return count;
}

/** 判断合并结果是否与现有状态一致，一致时不必写回 store（避免每次轮询都重渲染关注列表） */
export function isSameFollowingDynamicsNavState(
  current: FollowingDynamicsNavState | undefined,
  next: FollowingDynamicsNavState,
) {
  if (!current || current.baseline !== next.baseline) {
    return false;
  }
  const currentMids = Object.keys(current.unread);
  if (currentMids.length !== Object.keys(next.unread).length) {
    return false;
  }
  return currentMids.every((mid) => current.unread[mid] === next.unread[mid]);
}

export function getFollowingDynamicsUpdateCount(data: FollowingDynamicsUpdatePage) {
  const count = Number(data.update_num ?? 0);
  return Number.isFinite(count) && count > 0 ? Math.min(count, 99) : 0;
}

export function getFollowingDynamicsLatestId(page: FollowingDynamicsPage | undefined) {
  if (page?.items[0]?.id_str != null) {
    return String(page.items[0].id_str);
  }
  return page?.update_baseline ?? null;
}

export function getFollowingDynamicsListItems(pages: FollowingDynamicsPage[]) {
  const seen = new Set<string>();
  const items: FollowingDynamicsListItem[] = [];
  for (const page of pages) {
    for (const rawItem of page.items) {
      const item = mapDynamicItem(rawItem);
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      items.push(item);
    }
  }
  return items;
}
