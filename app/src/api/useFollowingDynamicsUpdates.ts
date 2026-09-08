import useSWR from "swr";

import { bilibiliSession } from "../features/bilibili-session/session";
import { useBilibiliSessionState } from "../features/bilibili-session/useBilibiliSession";
import { useStore } from "../store";
import request from "./fetcher";
import { fetchFollowingDynamicsUpdateCount } from "./following-dynamics";
import type { FollowingDynamicsUpdateCount } from "./following-dynamics-update.schema";

const FOLLOWING_DYNAMICS_UPDATES_KEY = "bilibili-following-dynamics-updates";
const FOLLOWING_DYNAMICS_UPDATES_INTERVAL = 30 * 60 * 1000;

export function useFollowingDynamicsUpdates() {
  const session = useBilibiliSessionState();
  const account =
    session.account && bilibiliSession.isCurrentAccount(session.account) ? session.account : null;
  const { $followingDynamicsUpdateMap } = useStore();
  const baseline = account ? ($followingDynamicsUpdateMap[account.mid]?.baseline ?? "") : "";
  const key = account
    ? baseline
      ? ([FOLLOWING_DYNAMICS_UPDATES_KEY, account.mid, account.generation, baseline] as const)
      : null
    : null;

  return useSWR<FollowingDynamicsUpdateCount, Error>(
    key,
    () => {
      if (!account || !baseline) {
        throw new Error("动态更新轮询缺少当前账号或动态基线");
      }
      return fetchFollowingDynamicsUpdateCount(
        baseline,
        request,
        () => bilibiliSession.isCurrentAccount(account),
      );
    },
    {
      refreshInterval: FOLLOWING_DYNAMICS_UPDATES_INTERVAL,
      revalidateOnMount: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    },
  );
}
