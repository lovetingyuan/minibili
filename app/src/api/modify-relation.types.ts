import type { BilibiliAccount } from "../features/bilibili-session/types";
import type { UpInfo } from "../types";

export type RelationAccount = Pick<BilibiliAccount, "mid" | "generation">;
export type RelationAction = 1 | 2;
export type RelationChange = { up: UpInfo; act: RelationAction };
export type RelationRequestDependencies = {
  readCookie: () => Promise<string | null>;
  isCurrentAccount: (account: RelationAccount) => boolean;
};
