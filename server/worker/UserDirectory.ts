import { DurableObject } from "cloudflare:workers";

import type { ServerBindings } from "./types";
import type {
  ConsumeFeedbackQuotaInput,
  FeedbackQuotaResult,
  RecordUserActivityInput,
  UserActivity,
} from "./users/types";

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

const CREATE_FEEDBACK_RATE_LIMITS_TABLE = `
  CREATE TABLE IF NOT EXISTS feedback_rate_limits (
    scope TEXT NOT NULL,
    actor_key TEXT NOT NULL,
    window_start INTEGER NOT NULL,
    request_count INTEGER NOT NULL,
    PRIMARY KEY (scope, actor_key)
  )
`;

const FEEDBACK_RATE_LIMIT_WINDOW_MS = 60_000;
const FEEDBACK_GLOBAL_LIMIT = 30;
const FEEDBACK_IP_LIMIT = 3;

type FeedbackRateLimitRow = {
  requestCount: number;
  windowStart: number;
};

export class UserDirectory extends DurableObject<ServerBindings> {
  constructor(ctx: DurableObjectState, env: ServerBindings) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(CREATE_USERS_TABLE);
      this.ctx.storage.sql.exec(CREATE_LAST_USED_INDEX);
      this.ctx.storage.sql.exec(CREATE_FEEDBACK_RATE_LIMITS_TABLE);
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

  consumeFeedbackQuota(input: ConsumeFeedbackQuotaInput): FeedbackQuotaResult {
    if (
      !/^[a-f0-9]{64}$/.test(input.ipHash) ||
      !Number.isSafeInteger(input.usedAt) ||
      input.usedAt <= 0
    ) {
      throw new Error("Invalid feedback quota input");
    }

    const windowStart = Math.floor(input.usedAt / FEEDBACK_RATE_LIMIT_WINDOW_MS) *
      FEEDBACK_RATE_LIMIT_WINDOW_MS;
    this.ctx.storage.sql.exec(
      "DELETE FROM feedback_rate_limits WHERE window_start < ?",
      windowStart - FEEDBACK_RATE_LIMIT_WINDOW_MS,
    );

    const globalCount = this.getFeedbackRequestCount("global", "all", windowStart);
    if (globalCount >= FEEDBACK_GLOBAL_LIMIT) {
      return { allowed: false, scope: "global" };
    }

    const ipCount = this.getFeedbackRequestCount("ip", input.ipHash, windowStart);
    if (ipCount >= FEEDBACK_IP_LIMIT) {
      return { allowed: false, scope: "ip" };
    }

    this.incrementFeedbackRequestCount("global", "all", windowStart);
    this.incrementFeedbackRequestCount("ip", input.ipHash, windowStart);
    return { allowed: true };
  }

  private getFeedbackRequestCount(scope: string, actorKey: string, windowStart: number) {
    const row = this.ctx.storage.sql
      .exec<FeedbackRateLimitRow>(
        `
          SELECT
            window_start AS windowStart,
            request_count AS requestCount
          FROM feedback_rate_limits
          WHERE scope = ? AND actor_key = ?
        `,
        scope,
        actorKey,
      )
      .toArray()[0];
    return row?.windowStart === windowStart ? row.requestCount : 0;
  }

  private incrementFeedbackRequestCount(scope: string, actorKey: string, windowStart: number) {
    this.ctx.storage.sql.exec(
      `
        INSERT INTO feedback_rate_limits (scope, actor_key, window_start, request_count)
        VALUES (?, ?, ?, 1)
        ON CONFLICT(scope, actor_key) DO UPDATE SET
          window_start = excluded.window_start,
          request_count = CASE
            WHEN feedback_rate_limits.window_start = excluded.window_start
              THEN feedback_rate_limits.request_count + 1
            ELSE 1
          END
      `,
      scope,
      actorKey,
      windowStart,
    );
  }
}
