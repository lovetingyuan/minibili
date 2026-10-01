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

/** 一次 feed/nav 拉取（可能翻多页）的结果 */
export type FollowingDynamicsNavBatch = {
  /** 每个 UP 在本批数据里的最新可见动态 id_str */
  latestByMid: Record<string, string>;
  /** 是否已翻到 has_more=false（false 表示触到页数上限，还剩更旧的没拉） */
  complete: boolean;
  /** 后台累计批次保留每个最新 id 首次被观察到的请求时间。 */
  observedAtByMid?: Record<string, number>;
};

/**
 * 单个 UP 的动态已读状态。
 * latestId 大于 readId 时表示有未读；unread 是用户在关注列表长按手动标记的未读，
 * 没有该 UP 的动态数据时也能单独撑起一个小红点。
 */
export type FollowingDynamicsUpReadState = {
  latestId: string;
  readId: string;
  unread?: boolean;
  /** 最近一次打开该 UP 动态页的时间。 */
  readAt?: number;
};

/** 当前 B站账号下，每个 UP 的动态已读状态 */
export type FollowingDynamicsReadState = Record<string, FollowingDynamicsUpReadState>;

export type FollowingDynamicsReadMergeOptions = {
  state: FollowingDynamicsReadState | undefined;
  batch: FollowingDynamicsNavBatch;
  followedMids?: ReadonlySet<string>;
  /** 上次查看动态列表的最新动态 id，空字符串表示尚未查看。 */
  readBaseline?: string;
  /** 本轮请求开始时间，用于保护后续的已读操作。 */
  observedAt?: number;
};
