import type { UserDataAccount } from "../features/user-data/types";
import type { SyncResult, UserOpenResult } from "../../../shared/user-data";

export type UserApiResult = SyncResult | UserOpenResult;

export type UserDataRequestDependencies = {
  appVersion: string | null;
  readCookie: () => Promise<string | null>;
  isCurrentAccount: (account: UserDataAccount) => boolean;
  request: (url: string, options: RequestInit) => Promise<Pick<Response, "status" | "ok" | "json">>;
};
