import type { BilibiliAccount } from "../features/bilibili-session/types";
import type { UpInfo } from "../types";

export type RelationAccount = Pick<BilibiliAccount, "mid" | "generation">;
export type RelationAction = 1 | 2 | 5;
export type FollowRelationChange = { up: UpInfo; act: 1 | 2 };
export type BlockRelationChange = { up: Pick<UpInfo, "mid" | "name">; act: 5 };
export type RelationChange = FollowRelationChange | BlockRelationChange;
export type BlockRelationKey = readonly ["bilibili-block", string, number];
export type RelationRequestDependencies = {
  readCookie: () => Promise<string | null>;
  isCurrentAccount: (account: RelationAccount) => boolean;
};
