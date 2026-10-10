import { eq } from "drizzle-orm";
import type { SyncedUserSettings, UserSettingsPatch } from "../../../shared/user-data";
import type { RecordUserOpenInput } from "../users/types";
import type { AppDatabase } from "./types";
import { userData } from "./schema";
import { insertUser } from "./users";

export async function syncUserData(
  db: AppDatabase,
  input: RecordUserOpenInput,
  settings: UserSettingsPatch,
): Promise<SyncedUserSettings> {
  const initializeUser = insertUser(db, input).onConflictDoNothing();
  const initializeSettings = db
    .insert(userData)
    .values({ uid: input.uid, updatedAt: input.openedAt })
    .onConflictDoNothing();
  const selectSettings = db
    .select({ blackTags: userData.blackTags, videoCatesList: userData.videoCatesList })
    .from(userData)
    .where(eq(userData.uid, input.uid));

  // 每项设置单独更新，避免读取整行再写回时覆盖其它设备的修改。
  const update = {
    ...(settings.blackTags !== undefined ? { blackTags: settings.blackTags } : {}),
    ...(settings.videoCatesList !== undefined ? { videoCatesList: settings.videoCatesList } : {}),
  };
  let result: SyncedUserSettings[];
  if (Object.keys(update).length) {
    const batch = await db.batch([
      initializeUser,
      initializeSettings,
      db
        .update(userData)
        .set({ ...update, updatedAt: input.openedAt })
        .where(eq(userData.uid, input.uid)),
      selectSettings,
    ]);
    result = batch[3];
  } else {
    const batch = await db.batch([initializeUser, initializeSettings, selectSettings]);
    result = batch[2];
  }
  const row = result[0];
  if (!row) {
    throw new Error("User settings are missing after initialization");
  }
  return row;
}
