import { useSyncExternalStore } from "react";
import useSWR from "swr";

import { BilibiliSessionChangedError } from "./controller";
import { bilibiliSession } from "./session";
import type { BilibiliAccount } from "./types";

const SESSION_KEY = "bilibili-session";

export function useBilibiliSession() {
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

  async function logout() {
    await mutate(
      async () => {
        await bilibiliSession.logout();
        return null;
      },
      { revalidate: false },
    );
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
