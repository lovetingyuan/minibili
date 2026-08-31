import type { UserDataAccount } from "../features/user-data/types";

export type UserDataRequestDependencies = {
  readCookie: () => Promise<string | null>;
  isCurrentAccount: (account: UserDataAccount) => boolean;
  request: (url: string, options: RequestInit) => Promise<Pick<Response, "status" | "ok" | "json">>;
};
