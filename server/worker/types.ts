import type { Context, Hono } from "hono";
import type { JsonValue, SyncOperations } from "../../shared/user-data";

// 仅依赖实际使用的 RPC，生产绑定仍由 Wrangler 生成完整类型。
export interface UserStorageStub {
  syncData(operations: SyncOperations): Promise<Record<string, JsonValue>>;
}

export interface ServerBindings {
  /** 见 bili-proxy 子项目；普通变量写在 wrangler.jsonc 的 vars 里。 */
  BILIBILI_PROXY_URL: string;
  /** 与 Vercel 侧 BILI_PROXY_TOKEN 一致，用 `wrangler secret put` 注入。 */
  BILIBILI_PROXY_TOKEN: string;
  USER_STORAGE: { getByName(name: string): UserStorageStub };
}

export type AppType = Hono<{ Bindings: ServerBindings }>;
export type AppContext = Context<{ Bindings: ServerBindings }>;
