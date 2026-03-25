import { DurableObject } from "cloudflare:workers";

import type { ServerBindings, SyncOperations } from "./types";
import { DurableObjectStorageAdapter, UserRecordStore } from "./user-record-store";

// Durable Object 作为每个邮箱的状态容器，对外只暴露 UserRecordStore 的领域方法。
export class UserStorage extends DurableObject<ServerBindings> {
  private readonly store: UserRecordStore;

  constructor(ctx: DurableObjectState, env: ServerBindings) {
    super(ctx, env);
    this.store = new UserRecordStore(new DurableObjectStorageAdapter(ctx.storage));
  }

  canSendOtp() {
    return this.store.canSendOtp();
  }

  clearAuthState() {
    return this.store.clearAuthState();
  }

  clearOtpState() {
    return this.store.clearOtpState();
  }

  issueToken() {
    return this.store.issueToken();
  }

  rotateToken() {
    return this.store.rotateToken();
  }

  saveOtp(otp: string) {
    return this.store.saveOtp(otp);
  }

  syncData(operations: SyncOperations) {
    return this.store.syncData(operations);
  }

  verifyOtp(otp: string) {
    return this.store.verifyOtp(otp);
  }

  verifyToken(token: string) {
    return this.store.verifyToken(token);
  }
}
