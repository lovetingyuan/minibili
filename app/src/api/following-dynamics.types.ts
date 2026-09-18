import type { BilibiliAccount } from "../features/bilibili-session/types";
import type { DynamicListResponse } from "./dynamic-items.schema";
import type { DynamicItem } from "./dynamic-items.type";
import type { FollowingDynamicsUpdateCount } from "./following-dynamics-update.schema";

export type FollowingDynamicsAccount = Pick<BilibiliAccount, "mid" | "generation">;
export type FollowingDynamicsPage = DynamicListResponse;
export type FollowingDynamicsRequest = (url: string) => Promise<unknown>;
export type FollowingDynamicsKey = readonly [
  "bilibili-following-dynamics",
  string,
  number,
  number,
  string,
];
export type FollowingDynamicsKeyLoader = (
  index: number,
  previous: FollowingDynamicsPage | null,
) => FollowingDynamicsKey | null;
export type FollowingDynamicsListItem = DynamicItem;
export type FollowingDynamicsUpdatePage = FollowingDynamicsUpdateCount;

/** feed/nav 里一条“有新动态”的记录，已把 mid/id_str 统一成字符串 */
export type FollowingDynamicsNavItemRef = {
  mid: string;
  idStr: string;
};

/** 一次 feed/nav 拉取（可能翻多页）的结果 */
export type FollowingDynamicsNavBatch = {
  items: FollowingDynamicsNavItemRef[];
  /** 本批最新动态 id，没有新增时为 null */
  newestId: string | null;
  /** 本批最旧动态 id，没有新增时为 null */
  oldestId: string | null;
  /** 是否已翻到 has_more=false（false 表示触到页数上限，还剩更旧的没拉） */
  complete: boolean;
};

/** 「关注」列表 UP 未读小红点的本地状态 */
export type FollowingDynamicsNavState = {
  /** feed/nav 的 update_baseline：已经消费到的最新动态 id */
  baseline: string;
  /** UP mid -> 该 UP 最新未读动态 id_str */
  unread: Record<string, string>;
};
