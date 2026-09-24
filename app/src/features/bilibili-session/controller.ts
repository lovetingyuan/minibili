import { getBilibiliUserId, hasBilibiliLoginCookie } from "../../api/bilibili-cookie.helpers";
import type { BilibiliAccount, BilibiliSessionControl, BilibiliSessionDependencies } from "./types";

export class BilibiliSessionChangedError extends Error {
  constructor() {
    super("登录状态已改变");
  }
}

export function createBilibiliSession(dependencies: BilibiliSessionDependencies) {
  let control: BilibiliSessionControl = { generation: 0, phase: "ready", error: null };
  const listeners = new Set<() => void>();
  let writeQueue: Promise<unknown> = Promise.resolve();
  let logoutPromise: Promise<void> | null = null;

  function publish(next: BilibiliSessionControl) {
    control = next;
    listeners.forEach((listener) => listener());
  }

  function assertCurrent(generation: number, signal?: AbortSignal) {
    if (control.phase !== "ready" || control.generation !== generation || signal?.aborted) {
      throw new BilibiliSessionChangedError();
    }
  }

  function enqueueWrite<T>(action: () => Promise<T>) {
    const result = writeQueue.then(action);
    writeQueue = result.catch(() => {});
    return result;
  }

  async function check(): Promise<BilibiliAccount | null> {
    const generation = control.generation;
    assertCurrent(generation);
    const cookie = await dependencies.readCookie();
    assertCurrent(generation);
    if (!cookie) {
      return null;
    }
    const mid = getBilibiliUserId(cookie);
    const profile =
      mid && hasBilibiliLoginCookie(cookie) ? await dependencies.validateCookie(cookie) : null;
    assertCurrent(generation);
    if (!profile) {
      await enqueueWrite(async () => {
        assertCurrent(generation);
        // 已确认失效：即使安全存储删除失败，也不能继续显示为已登录。
        await dependencies.clearCookie().catch(() => {});
      });
      assertCurrent(generation);
      publish({ ...control, generation: generation + 1 });
      dependencies.onStoredCredentialsExpired?.();
      return null;
    }
    return { mid: profile.mid.toString(), generation, profile };
  }

  async function login(cookie: string, signal: AbortSignal): Promise<BilibiliAccount | null> {
    const generation = control.generation;
    assertCurrent(generation, signal);
    const mid = getBilibiliUserId(cookie);
    if (!mid || !hasBilibiliLoginCookie(cookie)) {
      return null;
    }
    const profile = await dependencies.validateCookie(cookie, signal);
    assertCurrent(generation, signal);
    if (!profile) {
      return null;
    }
    return enqueueWrite(async () => {
      assertCurrent(generation, signal);
      await dependencies.saveCookie(cookie);
      // 写入开始后允许页面离开；退出操作会排队清理，不能被这次保存覆盖。
      assertCurrent(generation);
      publish({ ...control, generation: generation + 1 });
      dependencies.onLoginSuccess?.();
      return { mid: profile.mid.toString(), generation: control.generation, profile };
    });
  }

  async function prepareWebViewCookies(signal: AbortSignal) {
    const generation = control.generation;
    assertCurrent(generation, signal);
    return enqueueWrite(async () => {
      assertCurrent(generation, signal);
      const cookie = await dependencies.readCookie();
      assertCurrent(generation, signal);
      if (cookie?.trim()) {
        await dependencies.writeWebViewCookies(cookie);
        // 原生写入不可取消；退出清理必须等它完成，页面则不再接收旧会话结果。
        assertCurrent(generation, signal);
      }
    });
  }

  function logout() {
    if (logoutPromise) {
      return logoutPromise;
    }
    publish({ generation: control.generation + 1, phase: "logging-out", error: null });
    logoutPromise = enqueueWrite(async () => {
      await dependencies.clearNativeCookies();
      await dependencies.clearCookie();
    })
      .then(() => {
        publish({ ...control, phase: "ready", error: null });
      })
      .catch((cause: unknown) => {
        const error = cause instanceof Error ? cause : new Error("退出登录失败，请重试");
        publish({ ...control, phase: "logout-error", error });
        throw error;
      })
      .finally(() => {
        logoutPromise = null;
      });
    return logoutPromise;
  }

  return {
    check,
    login,
    logout,
    prepareWebViewCookies,
    getSnapshot: () => control,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    isCurrentAccount(account: Pick<BilibiliAccount, "mid" | "generation">) {
      return control.phase === "ready" && account.generation === control.generation;
    },
  };
}
