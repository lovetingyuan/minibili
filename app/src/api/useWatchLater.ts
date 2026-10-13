import { useSyncExternalStore } from "react";
import useSWR, { unstable_serialize, useSWRConfig } from "swr";

import { favoriteMutationKey } from "../features/bilibili-favorites/mutations";
import { watchLaterMutations } from "../features/bilibili-watch-later/mutations";
import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import { BilibiliAuthExpiredError } from "../features/bilibili-session/auth-expiration";
import { bilibiliSession } from "../features/bilibili-session/session";
import { useBilibiliSessionState } from "../features/bilibili-session/useBilibiliSession";
import {
  clearWatchLaterAids,
  markWatchLaterAdded,
  markWatchLaterRemoved,
} from "../store/watch-later";
import fetcher from "./fetcher";
import { getBilibiliLoginCookie } from "./get-cookie";
import {
  clearWatchLater,
  fetchBilibiliWatchLater,
  getWatchLaterKey,
  getWatchLaterListItems,
  modifyWatchLater,
  WatchLaterLoginRequiredError,
  WatchLaterResultUnknownError,
} from "./watch-later";
import type {
  WatchLaterAccount,
  WatchLaterChange,
  WatchLaterClearMode,
  WatchLaterKey,
  WatchLaterResponse,
} from "./watch-later.types";

const watchLaterOptions = {
  keepPreviousData: false,
  shouldRetryOnError: (error: Error) =>
    !(
      error instanceof BilibiliAuthExpiredError ||
      error instanceof BilibiliSessionChangedError ||
      error instanceof WatchLaterLoginRequiredError
    ),
  errorRetryCount: 2,
};

function useWatchLaterAccount(enabled: boolean) {
  const { account } = useBilibiliSessionState();
  if (!enabled || !account || !bilibiliSession.isCurrentAccount(account)) {
    return null;
  }
  return account;
}

export function useBilibiliWatchLater(enabled = true) {
  const account = useWatchLaterAccount(enabled);
  const response = useSWR<WatchLaterResponse, Error, WatchLaterKey | null>(
    account ? getWatchLaterKey(account) : null,
    ([, mid, generation]) =>
      fetchBilibiliWatchLater({ mid, generation }, fetcher, () =>
        bilibiliSession.isCurrentAccount({ mid, generation }),
      ),
    watchLaterOptions,
  );
  const data = account ? response.data : undefined;
  return {
    ...response,
    data,
    items: getWatchLaterListItems(data),
  };
}

export function useModifyWatchLater() {
  const { mutate } = useSWRConfig();
  const pending = useSyncExternalStore(
    watchLaterMutations.subscribe,
    watchLaterMutations.getSnapshot,
  );
  const account = useWatchLaterAccount(true);

  async function toggle(current: WatchLaterAccount, aid: string, added: boolean) {
    const key = getWatchLaterKey(current);
    const change: WatchLaterChange = { aid, added };
    return watchLaterMutations.run(current, aid, async () => {
      try {
        await modifyWatchLater(current, change, {
          readCookie: getBilibiliLoginCookie,
          isCurrentAccount: bilibiliSession.isCurrentAccount,
        });
      } catch (error) {
        // 结果未知：重新拉取列表，让界面以服务端为准。
        if (error instanceof WatchLaterResultUnknownError) {
          void mutate(key).catch(() => {});
        }
        throw error;
      }
      if (added) {
        markWatchLaterAdded(aid);
      } else {
        markWatchLaterRemoved(aid);
        // POST 已确认成功：立即从列表缓存移除，稍后由重新挂载的列表同步服务端数据。
        void mutate<WatchLaterResponse>(
          key,
          (cached) =>
            cached && {
              count: Math.max(0, cached.count - 1),
              list: cached.list.filter((item) => String(item.aid) !== aid),
            },
          { revalidate: false },
        ).catch(() => {});
      }
      return added;
    });
  }

  return {
    toggle,
    isPending: (aid: string) =>
      Boolean(
        account &&
        (pending.has(favoriteMutationKey(account, aid)) ||
          pending.has(favoriteMutationKey(account, "clear"))),
      ),
  };
}

export function useClearWatchLater() {
  const { mutate, cache } = useSWRConfig();
  const pending = useSyncExternalStore(
    watchLaterMutations.subscribe,
    watchLaterMutations.getSnapshot,
  );
  const account = useWatchLaterAccount(true);

  async function clear(current: WatchLaterAccount, mode: WatchLaterClearMode) {
    const key = getWatchLaterKey(current);

    async function refresh(clearedAll = false) {
      if (!bilibiliSession.isCurrentAccount(current)) {
        throw new BilibiliSessionChangedError();
      }
      // 显式 mutation 使清除前的 GET 失效，再等待一次服务端刷新。
      await mutate<WatchLaterResponse>(
        key,
        (cached) => (clearedAll ? { count: 0, list: [] } : cached),
        { revalidate: false },
      );
      const data = await mutate<WatchLaterResponse>(key);
      const state: unknown = cache.get(unstable_serialize(key));
      // SWR revalidate 失败仍可能返回旧数据，需要同时检查缓存中的错误。
      return (
        data !== undefined &&
        !(state && typeof state === "object" && "error" in state && state.error)
      );
    }

    return watchLaterMutations.runClear(current, async () => {
      try {
        await clearWatchLater(current, mode, {
          readCookie: getBilibiliLoginCookie,
          isCurrentAccount: bilibiliSession.isCurrentAccount,
        });
      } catch (error) {
        if (error instanceof WatchLaterResultUnknownError) {
          await refresh().catch(() => {});
        }
        throw error;
      }
      if (!bilibiliSession.isCurrentAccount(current)) {
        throw new BilibiliSessionChangedError();
      }
      if (mode === "all") {
        clearWatchLaterAids();
      }
      return refresh(mode === "all").catch(() => false);
    });
  }

  return {
    clear,
    isPending: Boolean(
      account && [...pending].some((key) => key.startsWith(favoriteMutationKey(account, ""))),
    ),
  };
}
