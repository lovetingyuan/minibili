import type { Context, Hono } from "hono";
import type { JsonValue, SyncOperations } from "../../shared/user-data";
import type {
  ConsumeFeedbackQuotaInput,
  FeedbackQuotaResult,
  RecordUserActivityInput,
  UserActivity,
} from "./users/types";

// 仅依赖实际使用的 RPC，生产绑定仍由 Wrangler 生成完整类型。
export interface UserStorageStub {
  syncData(operations: SyncOperations): Promise<Record<string, JsonValue>>;
}

export interface UserDirectoryStub {
  recordActivity(input: RecordUserActivityInput): Promise<void>;
  listUsers(query: string): Promise<UserActivity[]>;
  consumeFeedbackQuota(input: ConsumeFeedbackQuotaInput): Promise<FeedbackQuotaResult>;
}

export interface ServerBindings {
  /** 见 bili-proxy 子项目；普通变量写在 wrangler.jsonc 的 vars 里。 */
  BILIBILI_PROXY_URL: string;
  /** 与 Vercel 侧 BILI_PROXY_TOKEN 一致，用 `wrangler secret put` 注入。 */
  BILIBILI_PROXY_TOKEN: string;
  /** `/users` 管理页密码，用 `wrangler secret put` 注入。 */
  MINIBILI_MANAGEMENT_PASSWD: string;
  /** Resend 发信密钥，用 `wrangler secret put RESEND_API_KEY` 注入。 */
  RESEND_API_KEY: string;
  /** 见 wrangler.jsonc 的 ratelimits；按 Cloudflare 节点本地计数。 */
  RATE_LIMIT_ADMIN: RateLimit;
  RATE_LIMIT_SHARE: RateLimit;
  RATE_LIMIT_SYNC: RateLimit;
  USER_DIRECTORY: { getByName(name: string): UserDirectoryStub };
  USER_STORAGE: { getByName(name: string): UserStorageStub };
}

export type AppType = Hono<{ Bindings: ServerBindings }>;
export type AppContext = Context<{ Bindings: ServerBindings }>;
