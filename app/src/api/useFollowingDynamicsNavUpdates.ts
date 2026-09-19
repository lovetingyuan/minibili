import useSWR from "swr";

import { bilibiliSession } from "../features/bilibili-session/session";
import { useBilibiliSessionState } from "../features/bilibili-session/useBilibiliSession";
import { useStore } from "../store";
import request from "./fetcher";
import { fetchFollowingDynamicsNavUpdates } from "./following-dynamics";
import type { FollowingDynamicsNavBatch } from "./following-dynamics.types";

const FOLLOWING_DYNAMICS_NAV_KEY = "bilibili-following-dynamics-nav";
const FOLLOWING_DYNAMICS_NAV_INTERVAL = 10 * 60 * 1000;

/**
 * 轮询 feed/nav 拿最近有更新的 UP 主，未读状态由 FollowingDynamicsUnreadManager 合并进 store。
 * 等本地存储恢复完成后才启动；key 不绑定已读状态，避免状态写入触发重复请求。
 */
export function useFollowingDynamicsNavUpdates() {
  const session = useBilibiliSessionState();
  const { initialed } = useStore();
  const account =
    initialed &&
    session.control.phase === "ready" &&
    session.account &&
    bilibiliSession.isCurrentAccount(session.account)
      ? session.account
      : null;
  const key = account
    ? ([FOLLOWING_DYNAMICS_NAV_KEY, account.mid, account.generation] as const)
    : null;

  return useSWR<FollowingDynamicsNavBatch, Error>(
    key,
    () => {
      if (!account) {
        throw new Error("关注动态未读轮询缺少当前账号");
      }
      return fetchFollowingDynamicsNavUpdates(request, () =>
        bilibiliSession.isCurrentAccount(account),
      );
    },
    {
      refreshInterval: FOLLOWING_DYNAMICS_NAV_INTERVAL,
      revalidateOnMount: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    },
  );
}
