import type { BilibiliAccount } from "../features/bilibili-session/types";
import type { DynamicListResponse } from "./dynamic-items.schema";
import type { DynamicItem } from "./dynamic-items.type";

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
