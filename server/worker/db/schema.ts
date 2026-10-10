import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { SyncedUserSettings } from "../../../shared/user-data";

export const users = sqliteTable(
  "users",
  {
    uid: text("uid").primaryKey(),
    nickname: text("nickname").notNull(),
    firstLoginAt: integer("first_login_at").notNull(),
    lastOpenedAt: integer("last_opened_at").notNull(),
    appVersion: text("app_version"),
  },
  (table) => [index("users_last_opened_idx").on(sql`${table.lastOpenedAt} DESC`, table.uid)],
);

export const userData = sqliteTable("user_data", {
  uid: text("uid")
    .primaryKey()
    .references(() => users.uid, { onDelete: "cascade" }),
  blackTags: text("black_tags", { mode: "json" })
    .$type<SyncedUserSettings["blackTags"]>()
    .notNull()
    .default({}),
  videoCatesList: text("video_cates_list", { mode: "json" })
    .$type<SyncedUserSettings["videoCatesList"]>()
    .notNull()
    .default([]),
  updatedAt: integer("updated_at").notNull(),
});
