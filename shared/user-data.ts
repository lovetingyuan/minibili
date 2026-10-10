import type { z } from "zod";
import type {
  UserDataRequestSchema,
  UserDataResponseSchema,
  UserOpenResponseSchema,
  UserSettingsSchema,
} from "./user-data.schema";

export type SyncedUserSettings = z.infer<typeof UserSettingsSchema>;
export type UserSettingsPatch = Partial<SyncedUserSettings>;
export type UserDataRequest = z.infer<typeof UserDataRequestSchema>;
export type SyncResult = z.infer<typeof UserDataResponseSchema>;
export type UserOpenResult = z.infer<typeof UserOpenResponseSchema>;
