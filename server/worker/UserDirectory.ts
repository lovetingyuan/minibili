import { DurableObject } from "cloudflare:workers";

import type { ServerBindings } from "./types";
import type { RecordUserActivityInput, UserActivity } from "./users/types";

const CREATE_USERS_TABLE = `
  CREATE TABLE IF NOT EXISTS users (
    uid TEXT PRIMARY KEY,
    nickname TEXT NOT NULL,
    first_login_at INTEGER NOT NULL,
    last_used_at INTEGER NOT NULL
  )
`;

const CREATE_LAST_USED_INDEX = `
  CREATE INDEX IF NOT EXISTS users_last_used_idx
  ON users(last_used_at DESC, uid ASC)
`;

export class UserDirectory extends DurableObject<ServerBindings> {
  constructor(ctx: DurableObjectState, env: ServerBindings) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(CREATE_USERS_TABLE);
      this.ctx.storage.sql.exec(CREATE_LAST_USED_INDEX);
    });
  }

  recordActivity(input: RecordUserActivityInput): void {
    if (
      !/^[1-9]\d*$/.test(input.uid) ||
      !input.nickname.trim() ||
      input.nickname.length > 128 ||
      !Number.isSafeInteger(input.usedAt) ||
      input.usedAt <= 0
    ) {
      throw new Error("Invalid user activity");
    }

    this.ctx.storage.sql.exec(
      `
        INSERT INTO users (uid, nickname, first_login_at, last_used_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(uid) DO UPDATE SET
          nickname = CASE
            WHEN excluded.last_used_at >= users.last_used_at THEN excluded.nickname
            ELSE users.nickname
          END,
          last_used_at = MAX(users.last_used_at, excluded.last_used_at)
      `,
      input.uid,
      input.nickname,
      input.usedAt,
      input.usedAt,
    );
  }

  listUsers(query: string): UserActivity[] {
    const normalizedQuery = query.trim();
    return this.ctx.storage.sql
      .exec<UserActivity>(
        `
          SELECT
            uid,
            nickname,
            first_login_at AS firstLoginAt,
            last_used_at AS lastUsedAt
          FROM users
          WHERE
            ? = ''
            OR instr(uid, ?) > 0
            OR instr(lower(nickname), lower(?)) > 0
          ORDER BY last_used_at DESC, uid ASC
        `,
        normalizedQuery,
        normalizedQuery,
        normalizedQuery,
      )
      .toArray();
  }
}
