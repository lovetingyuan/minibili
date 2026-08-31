import type { Context, Hono } from "hono";
import type { JsonValue, SyncOperations } from "../../shared/user-data";

export interface AssetsBinding {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

// 仅依赖实际使用的 RPC，生产绑定仍由 Wrangler 生成完整类型。
export interface UserStorageStub {
  syncData(operations: SyncOperations): Promise<Record<string, JsonValue>>;
}

export interface ServerBindings {
  ASSETS: AssetsBinding;
  USER_STORAGE: { getByName(name: string): UserStorageStub };
}

export type AppType = Hono<{ Bindings: ServerBindings }>;
export type AppContext = Context<{ Bindings: ServerBindings }>;
