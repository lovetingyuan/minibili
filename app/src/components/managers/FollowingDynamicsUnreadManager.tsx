import React from "react";

import { getPollResultTime } from "@/api/poll-result-time";
import {
  applyNavResult,
  getForegroundPollOwner,
  isForegroundAccountCurrent,
} from "@/features/background-updates/results";
import { saveNavResult } from "@/features/background-updates/storage";
import { useFollowingDynamicsNavUpdates } from "@/api/useFollowingDynamicsNavUpdates";
import { bilibiliSession } from "@/features/bilibili-session/session";
import { useBilibiliSessionState } from "@/features/bilibili-session/useBilibiliSession";
import { getStoreMethods, useStore } from "@/store";

/**
 * 轮询 feed/nav，把「最近有更新的 UP」合并进本地未读表。
 * 小红点与「关注」tab 角标都读这份状态；「动态」tab 的未读数走 update 接口，
 * 由 FollowingDynamicsUpdatesManager 在发现新动态后触发这里的 nav 重新查询对齐两边。
 */
function FollowingDynamicsUnreadManager() {
  const { data } = useFollowingDynamicsNavUpdates();
  const session = useBilibiliSessionState();
  const { initialed, followingsGeneration } = useStore();
  const account =
    initialed &&
    session.control.phase === "ready" &&
    session.account &&
    bilibiliSession.isCurrentAccount(session.account)
      ? session.account
      : null;

  React.useEffect(() => {
    const methods = getStoreMethods();
    if (!account) {
      methods.setFollowingDynamicsNavReadyAccount(null);
      return;
    }
    if (!data || !bilibiliSession.isCurrentAccount(account)) {
      return;
    }
    if (!isForegroundAccountCurrent(account)) {
      return;
    }
    void saveNavResult(getForegroundPollOwner(account), data, getPollResultTime(data))
      .then((result) => {
        if (result) {
          applyNavResult(account, result.data, result.at);
        }
      })
      .catch(() => applyNavResult(account, data, getPollResultTime(data)));
  }, [account, data, followingsGeneration]);

  return null;
}

export default FollowingDynamicsUnreadManager;
