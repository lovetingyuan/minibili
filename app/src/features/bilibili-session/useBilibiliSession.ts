import { useSyncExternalStore } from "react";
import useSWR, { useSWRConfig } from "swr";

import { BilibiliSessionChangedError } from "./controller";
import { bilibiliSession } from "./session";
import type { BilibiliAccount } from "./types";

const SESSION_KEY = "bilibili-session";

export function useBilibiliSessionActions() {
  const { mutate } = useSWRConfig();
  async function logout() {
    await mutate<BilibiliAccount | null>(
      SESSION_KEY,
      async () => {
        await bilibiliSession.logout();
        return null;
      },
      { revalidate: false },
    );
  }
  return { logout };
}

// 列表项只订阅会话；校验由全局管理器和登录入口负责，避免滚动时重复请求。
export function useBilibiliSessionState() {
  const control = useSyncExternalStore(bilibiliSession.subscribe, bilibiliSession.getSnapshot);
  const { data, error } = useSWR<BilibiliAccount | null, Error>(SESSION_KEY, null, {
    revalidateOnMount: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
  return { account: data, control, error };
}

export function useBilibiliSession() {
  const { logout } = useBilibiliSessionActions();
  const control = useSyncExternalStore(bilibiliSession.subscribe, bilibiliSession.getSnapshot);
  const { data, error, isValidating, mutate } = useSWR<BilibiliAccount | null, Error>(
    SESSION_KEY,
    bilibiliSession.check,
    {
      revalidateOnMount: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      isPaused: () => bilibiliSession.getSnapshot().phase !== "ready",
      shouldRetryOnError: (cause) => !(cause instanceof BilibiliSessionChangedError),
    },
  );

  async function login(cookie: string, signal: AbortSignal) {
    let accepted = false;
    await mutate(
      async (current) => {
        const account = await bilibiliSession.login(cookie, signal);
        accepted = account !== null;
        return account ?? current;
      },
      { revalidate: false },
    );
    return accepted;
  }

  return {
    account: data,
    isAuthenticated: Boolean(data),
    isChecking: isValidating,
    error,
    control,
    login,
    logout,
    revalidate: mutate,
  };
}
