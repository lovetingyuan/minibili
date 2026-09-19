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
  FollowingDynamicsPage,
  FollowingDynamicsReadState,
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
  if (offset) {
    params.set("offset", offset);
  }
  return `/x/polymer/web-dynamic/v1/feed/all?${params}`;
}

export function buildFollowingDynamicsUpdateUrl(updateBaseline = "") {
  const params = new URLSearchParams({
    type: "all",
  });
  if (updateBaseline) {
    params.set("update_baseline", updateBaseline);
  }
  return `/x/polymer/web-dynamic/v1/feed/all/update?${params}`;
}

export function buildFollowingDynamicsNavUrl(offset = "") {
  const params = new URLSearchParams();
  if (offset) {
    params.set("offset", offset);
  }
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
    if (!isCurrentAccount()) {
      throw new BilibiliSessionChangedError();
    }
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
    if (!isCurrentAccount()) {
      throw new BilibiliSessionChangedError();
    }
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
  offset: string,
  request: FollowingDynamicsRequest,
  isCurrentAccount: () => boolean,
) {
  function assertCurrent() {
    if (!isCurrentAccount()) {
      throw new BilibiliSessionChangedError();
    }
  }

  assertCurrent();
  try {
    const data = await request(buildFollowingDynamicsNavUrl(offset));
    assertCurrent();
    return FollowingDynamicsNavResponseSchema.parse(data);
  } catch (error) {
    assertCurrent();
    throw error;
  }
}

/**
 * 按 offset 翻页拉取最近动态，直到 has_more=false 或触到页数上限。
 * 同一 UP 只保留最大的可见 id_str，避免旧记录或已隐藏动态触发红点。
 */
export async function fetchFollowingDynamicsNavUpdates(
  request: FollowingDynamicsRequest,
  isCurrentAccount: () => boolean,
): Promise<FollowingDynamicsNavBatch> {
  const latestByMid: Record<string, string> = {};
  let offset = "";
  let complete = false;

  for (let page = 0; page < FOLLOWING_DYNAMICS_NAV_MAX_PAGES; page += 1) {
    const data = await fetchFollowingDynamicsNavPage(offset, request, isCurrentAccount);
    for (const rawItem of data.items) {
      if (rawItem.visible === false) {
        continue;
      }
      const mid = String(rawItem.author.mid);
      const idStr = String(rawItem.id_str);
      const existing = latestByMid[mid];
      if (mid && (!existing || isNewerFollowingDynamicId(idStr, existing))) {
        latestByMid[mid] = idStr;
      }
    }

    const lastItem = data.items.at(-1);
    const nextOffset = data.offset || (lastItem ? String(lastItem.id_str) : "");
    if (!data.has_more || !data.items.length || !nextOffset || nextOffset === offset) {
      complete = true;
      break;
    }
    offset = nextOffset;
  }

  return { latestByMid, complete };
}

/** 动态 id_str 是超出 Number 安全范围的十进制字符串，只能按「长度 + 字典序」比较 */
export function isNewerFollowingDynamicId(id: string, than: string) {
  if (!than) {
    return true;
  }
  if (id.length !== than.length) {
    return id.length > than.length;
  }
  return id > than;
}

/**
 * 把一次 feed/nav 拉取结果合并进当前账号的已读状态。
 * - 首次见到某个 UP 时 latestId/readId 同时初始化，不把历史动态算成未读；
 * - 后续只允许更大的 id 推进 latestId，旧响应不能覆盖已读操作；
 * - 暂时不在接口结果里的 UP 保持原状态，取消关注后才清理。
 */
export function mergeFollowingDynamicsReadState(options: {
  state: FollowingDynamicsReadState | undefined;
  batch: FollowingDynamicsNavBatch;
  followedMids?: ReadonlySet<string>;
}): FollowingDynamicsReadState {
  const { state, batch } = options;
  const next: FollowingDynamicsReadState = { ...state };

  if (options.followedMids) {
    for (const mid of Object.keys(next)) {
      if (!options.followedMids.has(mid)) {
        delete next[mid];
      }
    }
  }

  for (const [mid, idStr] of Object.entries(batch.latestByMid)) {
    if (!mid || (options.followedMids && !options.followedMids.has(mid))) {
      continue;
    }
    const existing = next[mid];
    if (!existing) {
      next[mid] = { latestId: idStr, readId: idStr };
      continue;
    }
    if (isNewerFollowingDynamicId(idStr, existing.latestId)) {
      next[mid] = { ...existing, latestId: idStr };
    }
  }

  return next;
}

export function countFollowingDynamicsUnreadUps(
  state: FollowingDynamicsReadState | undefined,
  followedMids: ReadonlySet<string>,
) {
  if (!state) {
    return 0;
  }
  let count = 0;
  for (const mid of followedMids) {
    const item = state[mid];
    if (item && isNewerFollowingDynamicId(item.latestId, item.readId)) {
      count += 1;
    }
  }
  return count;
}

/** 把某个 UP 当前最新的动态标记为已读；没有未读时保持原引用 */
export function markFollowingDynamicsUpRead(
  state: FollowingDynamicsReadState | undefined,
  mid: string,
) {
  const item = state?.[mid];
  if (!state || !item || !isNewerFollowingDynamicId(item.latestId, item.readId)) {
    return state;
  }
  return {
    ...state,
    [mid]: { ...item, readId: item.latestId },
  };
}

export function isSameFollowingDynamicsReadState(
  current: FollowingDynamicsReadState | undefined,
  next: FollowingDynamicsReadState,
) {
  if (!current) {
    return false;
  }
  const currentMids = Object.keys(current);
  if (currentMids.length !== Object.keys(next).length) {
    return false;
  }
  return currentMids.every(
    (mid) =>
      current[mid]?.latestId === next[mid]?.latestId && current[mid]?.readId === next[mid]?.readId,
  );
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
      if (seen.has(item.id)) {
        continue;
      }
      seen.add(item.id);
      items.push(item);
    }
  }
  return items;
}
