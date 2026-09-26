import useSWR from "swr";

import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import { BilibiliAuthExpiredError } from "../features/bilibili-session/auth-expiration";
import { bilibiliSession } from "../features/bilibili-session/session";
import { useBilibiliSessionState } from "../features/bilibili-session/useBilibiliSession";
import { fetchBilibiliBlacklist, getBlacklistKey } from "./blacklist";
import type { Blacklist } from "./blacklist.types";

const EMPTY_BLACKLIST: Blacklist = new Map();

// 只有全局管理器负责同步；名称组件仅订阅缓存，滚动列表不触发请求。
export function useBilibiliBlacklist(sync = false) {
  const { account, control, error: sessionError } = useBilibiliSessionState();
  const currentAccount = account && bilibiliSession.isCurrentAccount(account) ? account : null;
  const key = currentAccount
    ? getBlacklistKey(currentAccount.mid, currentAccount.generation)
    : null;
  const response = useSWR<Blacklist, Error>(
    key,
    sync
      ? () =>
          fetchBilibiliBlacklist(undefined, () =>
            Boolean(currentAccount && bilibiliSession.isCurrentAccount(currentAccount)),
          )
      : null,
    {
      revalidateOnMount: sync,
      revalidateOnFocus: sync,
      revalidateOnReconnect: sync,
      keepPreviousData: false,
      shouldRetryOnError: (error) =>
        !(
          error instanceof BilibiliSessionChangedError || error instanceof BilibiliAuthExpiredError
        ),
    },
  );

  return {
    ...response,
    blacklist: currentAccount ? (response.data ?? EMPTY_BLACKLIST) : EMPTY_BLACKLIST,
    account: currentAccount,
    isPreparing: control.phase !== "ready" || (account === undefined && !sessionError),
  };
}
