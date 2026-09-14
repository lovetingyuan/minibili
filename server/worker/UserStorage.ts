import { DurableObject } from "cloudflare:workers";
import type { SyncOperations } from "../../shared/user-data";
import type { ServerBindings } from "./types";
import { syncUserData } from "./user-data-store";

// 每个已验证的 B站 UID 对应一个 DO；认证只在 Worker 边界处理。
export class UserStorage extends DurableObject<ServerBindings> {
  async syncData(operations: SyncOperations) {
    return syncUserData(this.ctx.storage, operations);
  }
}
