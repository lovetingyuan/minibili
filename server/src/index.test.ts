import { describe, expect, test, vi } from "vitest";

vi.mock("cloudflare:workers", () => {
  class TestDurableObject {
    protected readonly ctx: DurableObjectState;
    protected readonly env: unknown;

    constructor(ctx: DurableObjectState, env: unknown) {
      this.ctx = ctx;
      this.env = env;
    }
  }

  return {
    DurableObject: TestDurableObject,
  };
});

import { createApp } from "./index";
import type { ServerBindings, SyncOperations } from "./types";
import { MemoryStorageAdapter, UserRecordStore } from "./user-record-store";

type UserStorageLike = {
  canSendOtp: () => Promise<{ canSend: boolean; waitSeconds: number }>;
  clearAuthState: () => Promise<void>;
  clearOtpState: () => Promise<void>;
  issueToken: () => Promise<{ expiresAt: number; token: string }>;
  rotateToken: () => Promise<{ expiresAt: number; token: string }>;
  saveOtp: (otp: string) => Promise<void>;
  syncData: (operations: SyncOperations) => Promise<Partial<Record<string, unknown>>>;
  verifyOtp: (otp: string) => Promise<{ reason?: string; valid: boolean }>;
  verifyToken: (token: string) => Promise<{ reason?: "expired" | "invalid"; valid: boolean }>;
};

function createStorageNamespace() {
  const stores = new Map<string, UserStorageLike>();

  return {
    getStore(email: string) {
      if (!stores.has(email)) {
        const recordStore = new UserRecordStore(new MemoryStorageAdapter());
        stores.set(email, {
          canSendOtp: () => recordStore.canSendOtp(),
          clearAuthState: () => recordStore.clearAuthState(),
          clearOtpState: () => recordStore.clearOtpState(),
          issueToken: () => recordStore.issueToken(),
          rotateToken: () => recordStore.rotateToken(),
          saveOtp: (otp) => recordStore.saveOtp(otp),
          syncData: (operations) => recordStore.syncData(operations),
          verifyOtp: (otp) => recordStore.verifyOtp(otp),
          verifyToken: (token) => recordStore.verifyToken(token),
        });
      }

      return stores.get(email)!;
    },
    idFromName(name: string) {
      return name;
    },
    get(id: string) {
      return this.getStore(id);
    },
  };
}

function createEnv() {
  return {
    ASSETS: {
      fetch: () => Promise.resolve(new Response("ok")),
    },
    RESEND_API_KEY: "test-key",
    RESEND_FROM_EMAIL: "minibili@tingyuan.in",
    USER_STORAGE: createStorageNamespace(),
  };
}

describe("server routes", () => {
  test("health returns service status payload", async () => {
    const app = createApp();
    const response = await app.fetch(
      new Request("https://example.com/health"),
      createEnv() as ServerBindings,
    );

    const payload = (await response.json()) as {
      service: string;
      status: string;
      timestamp: string;
    };

    expect(response.status).toBe(200);
    expect(payload.service).toBe("minibili-server");
    expect(payload.status).toBe("ok");
    expect(Number.isNaN(Date.parse(payload.timestamp))).toBe(false);
  });

  test("static asset requests fall back to assets binding", async () => {
    const app = createApp();
    const assetFetch = vi.fn(() => Promise.resolve(new Response("asset-content")));
    const env = {
      ...createEnv(),
      ASSETS: {
        fetch: assetFetch,
      },
    };

    const response = await app.fetch(
      new Request("https://example.com/styles.css"),
      env as ServerBindings,
    );

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe("asset-content");
    expect(assetFetch).toHaveBeenCalledTimes(1);
  });

  test("unknown api routes still return 404 instead of hitting assets", async () => {
    const app = createApp();
    const assetFetch = vi.fn(() => Promise.resolve(new Response("asset-content")));
    const env = {
      ...createEnv(),
      ASSETS: {
        fetch: assetFetch,
      },
    };

    const response = await app.fetch(
      new Request("https://example.com/api/unknown"),
      env as ServerBindings,
    );

    expect(response.status).toBe(404);
    expect(assetFetch).not.toHaveBeenCalled();
  });

  test("sync rejects missing authorization", async () => {
    const app = createApp();
    const response = await app.fetch(
      new Request("https://example.com/api/users/user%40example.com/sync", {
        body: JSON.stringify({ get: ["$followedUps"] }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
      createEnv() as ServerBindings,
    );

    expect(response.status).toBe(401);
  });

  test("sync rejects unsupported keys", async () => {
    const app = createApp();
    const env = createEnv();
    const email = "user@example.com";
    const issuedToken = await env.USER_STORAGE.getStore(email).issueToken();

    const response = await app.fetch(
      new Request(`https://example.com/api/users/${encodeURIComponent(email)}/sync`, {
        body: JSON.stringify({ get: ["$unknown"] }),
        headers: {
          Authorization: `Bearer ${issuedToken.token}`,
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
      env as ServerBindings,
    );

    expect(response.status).toBe(400);
  });

  test("status clears auth state when token is expired", async () => {
    const app = createApp();
    const env = createEnv();
    const email = "user@example.com";

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-23T00:00:00.000Z"));
    const issuedToken = await env.USER_STORAGE.getStore(email).issueToken();
    vi.advanceTimersByTime(30 * 24 * 60 * 60 * 1000 + 1);

    const response = await app.fetch(
      new Request("https://example.com/api/auth/status", {
        body: JSON.stringify({ email, token: issuedToken.token }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
      env as ServerBindings,
    );

    expect(response.status).toBe(200);
    await expect(env.USER_STORAGE.getStore(email).verifyToken(issuedToken.token)).resolves.toEqual({
      reason: "invalid",
      valid: false,
    });
    vi.useRealTimers();
  });

  test("status rotates token and preserves synced data", async () => {
    const app = createApp();
    const env = createEnv();
    const email = "user@example.com";
    const issuedToken = await env.USER_STORAGE.getStore(email).issueToken();

    await env.USER_STORAGE.getStore(email).syncData({
      set: {
        $followedUps: [{ face: "", mid: "1", name: "up-1" }],
      },
    });

    const response = await app.fetch(
      new Request("https://example.com/api/auth/status", {
        body: JSON.stringify({ email, token: issuedToken.token }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
      env as ServerBindings,
    );

    const payload = (await response.json()) as {
      expiresAt: number;
      success: true;
      token: string;
      valid: true;
    };

    expect(response.status).toBe(200);
    expect(payload.valid).toBe(true);
    expect(payload.token).not.toBe(issuedToken.token);
    await expect(env.USER_STORAGE.getStore(email).verifyToken(issuedToken.token)).resolves.toEqual({
      reason: "invalid",
      valid: false,
    });
    await expect(env.USER_STORAGE.getStore(email).verifyToken(payload.token)).resolves.toEqual({
      valid: true,
    });
    await expect(
      env.USER_STORAGE.getStore(email).syncData({
        get: ["$followedUps"],
      }),
    ).resolves.toEqual({
      $followedUps: [{ face: "", mid: "1", name: "up-1" }],
    });
  });

  test("logout clears auth state", async () => {
    const app = createApp();
    const env = createEnv();
    const email = "user@example.com";
    const issuedToken = await env.USER_STORAGE.getStore(email).issueToken();

    const response = await app.fetch(
      new Request("https://example.com/api/auth/logout", {
        body: JSON.stringify({ email, token: issuedToken.token }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
      env as ServerBindings,
    );

    expect(response.status).toBe(200);
    await expect(env.USER_STORAGE.getStore(email).verifyToken(issuedToken.token)).resolves.toEqual({
      reason: "invalid",
      valid: false,
    });
  });

  test("logout preserves synced data", async () => {
    const app = createApp();
    const env = createEnv();
    const email = "user@example.com";
    const issuedToken = await env.USER_STORAGE.getStore(email).issueToken();

    await env.USER_STORAGE.getStore(email).syncData({
      set: {
        $blackUps: {
          _1: "blocked",
        },
      },
    });

    const response = await app.fetch(
      new Request("https://example.com/api/auth/logout", {
        body: JSON.stringify({ email, token: issuedToken.token }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
      env as ServerBindings,
    );

    expect(response.status).toBe(200);
    await expect(env.USER_STORAGE.getStore(email).verifyToken(issuedToken.token)).resolves.toEqual({
      reason: "invalid",
      valid: false,
    });
    await expect(
      env.USER_STORAGE.getStore(email).syncData({
        get: ["$blackUps"],
      }),
    ).resolves.toEqual({
      $blackUps: {
        _1: "blocked",
      },
    });
  });
});
