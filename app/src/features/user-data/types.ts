import type { z } from "zod";
import type { SyncOperations, SyncResult } from "../../../../shared/user-data";
import type { BilibiliAccount } from "../bilibili-session/types";
import type { UserSettingsSchema } from "./settings.schema";

export type UserSettings = z.infer<typeof UserSettingsSchema>;
export type SettingKey = keyof UserSettings;
export type UserDataAccount = Pick<BilibiliAccount, "mid" | "generation">;
export type UserDataSnapshot = {
  scope: string;
  generation: number | null;
  values: UserSettings;
  ready: boolean;
  syncing: boolean;
  authRequired: boolean;
  pendingCount: number;
  revision: number;
  error: Error | null;
};
export type UserDataDependencies = {
  read: (key: string) => Promise<string | null>;
  write: (key: string, value: string) => Promise<void>;
  isCurrentAccount: (account: UserDataAccount) => boolean;
  sync: (
    account: UserDataAccount,
    operations: SyncOperations,
    signal: AbortSignal,
  ) => Promise<SyncResult>;
};
