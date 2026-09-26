import useSWR, { useSWRConfig } from "swr";

import { bilibiliSession } from "../features/bilibili-session/session";
import { useBilibiliSessionState } from "../features/bilibili-session/useBilibiliSession";
import { getStoreMethods, useStore } from "../store";
import request from "./fetcher";
import { fetchFollowingDynamicsNavUpdates } from "./following-dynamics";
import type {
  FollowingDynamicsAccount,
  FollowingDynamicsNavBatch,
} from "./following-dynamics.types";

const FOLLOWING_DYNAMICS_NAV_KEY = "bilibili-following-dynamics-nav";
const FOLLOWING_DYNAMICS_NAV_INTERVAL = 10 * 60 * 1000;

type FollowingDynamicsNavKey = readonly [typeof FOLLOWING_DYNAMICS_NAV_KEY, string, number];

/** 本地存储恢复且会话就绪后，才把当前登录账号交给轮询与手动刷新共用 */
function useFollowingDynamicsNavAccount() {
  const session = useBilibiliSessionState();
  const { initialed } = useStore();
  if (!initialed || session.control.phase !== "ready") {
    return null;
  }
  const account = session.account ?? null;
  if (!account || !bilibiliSession.isCurrentAccount(account)) {
    return null;
  }
  return account;
}

/** nav 轮询的 SWR key：手动刷新与「动态更新轮询」触发复用同一份构造逻辑 */
export function getFollowingDynamicsNavKey(
  account: FollowingDynamicsAccount | null,
): FollowingDynamicsNavKey | null {
  return account ? [FOLLOWING_DYNAMICS_NAV_KEY, account.mid, account.generation] : null;
}

/**
 * 轮询 feed/nav 拿最近有更新的 UP 主，未读状态由 FollowingDynamicsUnreadManager 合并进 store。
 * 等本地存储恢复完成后才启动；key 不绑定已读状态，避免状态写入触发重复请求。
 */
export function useFollowingDynamicsNavUpdates() {
  const account = useFollowingDynamicsNavAccount();
  const key = getFollowingDynamicsNavKey(account);

  return useSWR<FollowingDynamicsNavBatch, Error>(
    key,
    () => {
      if (!account) {
        throw new Error("关注动态未读轮询缺少当前账号");
      }
      // 基线不进 key（状态写入不该额外触发请求），这里按调用时的最新值决定翻页深度
      const readBaseline =
        getStoreMethods().get$followingDynamicsUpdateMap()[account.mid]?.baseline ?? "";
      return fetchFollowingDynamicsNavUpdates(
        request,
        () => bilibiliSession.isCurrentAccount(account),
        { readBaseline },
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

/**
 * 关注页用户主动下拉、「动态」更新轮询发现新动态时，重新查询 feed/nav，
 * 让小红点与「关注」tab 角标拿到最新的未读数据。
 * 复用轮询的同一个 SWR key，数据回来后仍由 FollowingDynamicsUnreadManager 合并进 store；
 * 这里只是命令式地触发一次重新校验，不额外订阅轮询，所以挂载时不会多发请求。
 */
export function useFollowingDynamicsNavRefresh() {
  const { mutate } = useSWRConfig();
  const account = useFollowingDynamicsNavAccount();
  const key = getFollowingDynamicsNavKey(account);

  return async function refreshFollowingDynamicsNav() {
    if (!key || !bilibiliSession.isCurrentAccount({ mid: key[1], generation: key[2] })) {
      return;
    }
    // 失败交给数据层的 error 状态反馈，下拉刷新只负责收起刷新图标
    await mutate(key).catch(() => {});
  };
}
