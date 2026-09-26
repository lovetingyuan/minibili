import { useSyncExternalStore } from "react";
import useSWR, { useSWRConfig } from "swr";

import { favoriteMutationKey } from "../features/bilibili-favorites/mutations";
import { watchLaterMutations } from "../features/bilibili-watch-later/mutations";
import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import { BilibiliAuthExpiredError } from "../features/bilibili-session/auth-expiration";
import { bilibiliSession } from "../features/bilibili-session/session";
import { useBilibiliSessionState } from "../features/bilibili-session/useBilibiliSession";
import { markWatchLaterAdded, markWatchLaterRemoved } from "../store/watch-later";
import fetcher from "./fetcher";
import { getBilibiliLoginCookie } from "./get-cookie";
import {
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
  WatchLaterKey,
  WatchLaterResponse,
} from "./watch-later.types";

const watchLaterOptions = {
  keepPreviousData: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
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
    isPending: (aid: string) => Boolean(account && pending.has(favoriteMutationKey(account, aid))),
  };
}
