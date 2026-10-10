import { asc, desc, lte, or, sql } from "drizzle-orm";
import type { RecordUserOpenInput, UserActivity } from "../users/types";
import type { AppDatabase } from "./types";
import { userData, users } from "./schema";

export function insertUser(db: AppDatabase, input: RecordUserOpenInput) {
  return db.insert(users).values({
    uid: input.uid,
    nickname: input.nickname,
    appVersion: input.appVersion,
    firstLoginAt: input.openedAt,
    lastOpenedAt: input.openedAt,
  });
}

export async function recordUserOpen(db: AppDatabase, input: RecordUserOpenInput) {
  await db.batch([
    insertUser(db, input).onConflictDoUpdate({
      target: users.uid,
      set: {
        nickname: input.nickname,
        appVersion: input.appVersion,
        lastOpenedAt: input.openedAt,
      },
      setWhere: lte(users.lastOpenedAt, input.openedAt),
    }),
    db.insert(userData).values({ uid: input.uid, updatedAt: input.openedAt }).onConflictDoNothing(),
  ]);
}

export async function listUsers(db: AppDatabase, query: string): Promise<UserActivity[]> {
  const search = query.trim();
  return db
    .select()
    .from(users)
    .where(
      search
        ? or(
            sql`instr(${users.uid}, ${search}) > 0`,
            sql`instr(lower(${users.nickname}), lower(${search})) > 0`,
          )
        : undefined,
    )
    .orderBy(desc(users.lastOpenedAt), asc(users.uid));
}
