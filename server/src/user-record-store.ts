import type { AuthFailureReason, SyncOperations, SyncToServerKey } from "./types";
import { SYNC_TO_SERVER_KEYS } from "./types";

export const OTP_EXPIRY_MS = 5 * 60 * 1000;
export const OTP_LENGTH = 6;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
export const OTP_RETRY_LIMIT = 5;
export const TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

const AUTH_TOKEN_KEY = "auth_token";
const AUTH_TOKEN_EXPIRES_AT_KEY = "auth_token_expires_at";
const AUTH_OTP_KEY = "auth_otp";
const AUTH_OTP_ATTEMPTS_KEY = "auth_otp_attempts";
const AUTH_OTP_EXPIRES_AT_KEY = "auth_otp_expires_at";
const AUTH_OTP_SENT_AT_KEY = "auth_otp_sent_at";

const OTP_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const AUTH_STATE_KEYS = [
  AUTH_TOKEN_KEY,
  AUTH_TOKEN_EXPIRES_AT_KEY,
  AUTH_OTP_KEY,
  AUTH_OTP_ATTEMPTS_KEY,
  AUTH_OTP_EXPIRES_AT_KEY,
  AUTH_OTP_SENT_AT_KEY,
] as const;

const syncToServerKeySet = new Set<string>(SYNC_TO_SERVER_KEYS);

export interface StorageAdapter {
  delete(keys: string | string[]): Promise<void>;
  get<T>(key: string): Promise<T | undefined>;
  getMany<T>(keys: string[]): Promise<Map<string, T>>;
  put(key: string, value: unknown): Promise<void>;
  putMany(entries: Record<string, unknown>): Promise<void>;
}

export interface CanSendOtpResult {
  canSend: boolean;
  waitSeconds: number;
}

export interface IssuedToken {
  expiresAt: number;
  token: string;
}

export interface OtpVerificationResult {
  reason?: "exhausted" | "expired" | "invalid";
  valid: boolean;
}

export interface TokenVerificationResult {
  reason?: AuthFailureReason;
  valid: boolean;
}

export class DurableObjectStorageAdapter implements StorageAdapter {
  constructor(private readonly storage: DurableObjectStorage) {}

  async delete(keys: string | string[]) {
    if (Array.isArray(keys)) {
      await this.storage.delete(keys);
      return;
    }

    await this.storage.delete(keys);
  }

  async get<T>(key: string) {
    return this.storage.get<T>(key);
  }

  async getMany<T>(keys: string[]) {
    return this.storage.get<T>(keys);
  }

  async put(key: string, value: unknown) {
    await this.storage.put(key, value);
  }

  async putMany(entries: Record<string, unknown>) {
    await this.storage.put(entries);
  }
}

export class MemoryStorageAdapter implements StorageAdapter {
  private readonly data = new Map<string, unknown>();

  async delete(keys: string | string[]) {
    if (Array.isArray(keys)) {
      keys.forEach((key) => {
        this.data.delete(key);
      });
      return;
    }
    this.data.delete(keys);
  }

  async get<T>(key: string) {
    return this.data.get(key) as T | undefined;
  }

  async getMany<T>(keys: string[]) {
    const result = new Map<string, T>();
    keys.forEach((key) => {
      if (this.data.has(key)) {
        result.set(key, this.data.get(key) as T);
      }
    });
    return result;
  }

  async put(key: string, value: unknown) {
    this.data.set(key, value);
  }

  async putMany(entries: Record<string, unknown>) {
    Object.entries(entries).forEach(([key, value]) => {
      this.data.set(key, value);
    });
  }
}

// 验证码只使用大写字母和数字，和客户端输入规则保持一致。
export function createOtpCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(OTP_LENGTH));
  return Array.from(bytes, (byte) => OTP_CHARACTERS[byte % OTP_CHARACTERS.length]).join("");
}

function assertSyncKeys(keys: string[]): asserts keys is SyncToServerKey[] {
  const invalidKeys = keys.filter((key) => !syncToServerKeySet.has(key));
  if (invalidKeys.length > 0) {
    throw new Error(`Unsupported sync keys: ${invalidKeys.join(", ")}`);
  }
}

export class UserRecordStore {
  constructor(private readonly storage: StorageAdapter) {}

  // 基于最后发送时间做冷却控制，避免重复发送验证码。
  async canSendOtp(): Promise<CanSendOtpResult> {
    const lastSentAt = await this.storage.get<number>(AUTH_OTP_SENT_AT_KEY);
    if (!lastSentAt) {
      return { canSend: true, waitSeconds: 0 };
    }

    const elapsed = Date.now() - lastSentAt;
    if (elapsed >= OTP_RESEND_COOLDOWN_MS) {
      return { canSend: true, waitSeconds: 0 };
    }

    return {
      canSend: false,
      waitSeconds: Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000),
    };
  }

  async clearAuthState() {
    await this.storage.delete([...AUTH_STATE_KEYS]);
  }

  async clearOtpState() {
    await this.storage.delete([
      AUTH_OTP_ATTEMPTS_KEY,
      AUTH_OTP_EXPIRES_AT_KEY,
      AUTH_OTP_KEY,
      AUTH_OTP_SENT_AT_KEY,
    ]);
  }

  // token 与过期时间一起写入，后续状态检查和轮换都依赖这两个字段。
  async issueToken(): Promise<IssuedToken> {
    const expiresAt = Date.now() + TOKEN_EXPIRY_MS;
    const token = crypto.randomUUID();

    await this.storage.putMany({
      [AUTH_TOKEN_EXPIRES_AT_KEY]: expiresAt,
      [AUTH_TOKEN_KEY]: token,
    });

    return { expiresAt, token };
  }

  async rotateToken(): Promise<IssuedToken> {
    return this.issueToken();
  }

  // 每次发送新验证码都会重置过期时间和错误次数。
  async saveOtp(otp: string) {
    const now = Date.now();
    await this.storage.putMany({
      [AUTH_OTP_ATTEMPTS_KEY]: 0,
      [AUTH_OTP_EXPIRES_AT_KEY]: now + OTP_EXPIRY_MS,
      [AUTH_OTP_KEY]: otp,
      [AUTH_OTP_SENT_AT_KEY]: now,
    });
  }

  async syncData(operations: SyncOperations) {
    // 删除和写入先执行，读取最后进行，这样客户端可以在一次请求里拿到变更后的结果。
    if (operations.delete && operations.delete.length > 0) {
      assertSyncKeys(operations.delete);
      await this.storage.delete(operations.delete);
    }

    if (operations.set) {
      const keys = Object.keys(operations.set);
      assertSyncKeys(keys);
      await this.storage.putMany(operations.set);
    }

    const result: Partial<Record<SyncToServerKey, unknown>> = {};
    if (!operations.get || operations.get.length === 0) {
      return result;
    }

    assertSyncKeys(operations.get);
    const storedValues = await this.storage.getMany<unknown>(operations.get);
    storedValues.forEach((value, key) => {
      result[key as SyncToServerKey] = value;
    });
    return result;
  }

  async verifyOtp(otp: string): Promise<OtpVerificationResult> {
    const [storedOtp, expiresAt, attempts] = await Promise.all([
      this.storage.get<string>(AUTH_OTP_KEY),
      this.storage.get<number>(AUTH_OTP_EXPIRES_AT_KEY),
      this.storage.get<number>(AUTH_OTP_ATTEMPTS_KEY),
    ]);

    if (!storedOtp || !expiresAt) {
      return { reason: "invalid", valid: false };
    }

    if (Date.now() > expiresAt) {
      await this.clearOtpState();
      return { reason: "expired", valid: false };
    }

    if (storedOtp === otp) {
      // 验证成功后立即销毁验证码，避免同一验证码被重复使用。
      await this.clearOtpState();
      return { valid: true };
    }

    const nextAttempts = (attempts ?? 0) + 1;
    if (nextAttempts >= OTP_RETRY_LIMIT) {
      // 超过重试上限后清理验证码，强制重新发码。
      await this.clearOtpState();
      return { reason: "exhausted", valid: false };
    }

    await this.storage.put(AUTH_OTP_ATTEMPTS_KEY, nextAttempts);
    return { reason: "invalid", valid: false };
  }

  async verifyToken(token: string): Promise<TokenVerificationResult> {
    const [storedToken, expiresAt] = await Promise.all([
      this.storage.get<string>(AUTH_TOKEN_KEY),
      this.storage.get<number>(AUTH_TOKEN_EXPIRES_AT_KEY),
    ]);

    if (!storedToken || storedToken !== token) {
      return { reason: "invalid", valid: false };
    }

    if (!expiresAt || Date.now() > expiresAt) {
      // 过期 token 不在这里清理，交给上层接口决定是否顺便回收认证状态。
      return { reason: "expired", valid: false };
    }

    return { valid: true };
  }
}
