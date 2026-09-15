import { useIsFocused } from "@react-navigation/native";
import React from "react";

import { refreshRecentWatchProgress } from "@/api/watch-progress";
import { bilibiliSession } from "@/features/bilibili-session/session";
import { useBilibiliSessionState } from "@/features/bilibili-session/useBilibiliSession";

/** 播放页离开（返回或被新页面覆盖）时刷新最新几条观看进度 */
export function useWatchProgressRefresh() {
  const isFocused = useIsFocused();
  const session = useBilibiliSessionState();
  const account =
    session.account && bilibiliSession.isCurrentAccount(session.account) ? session.account : null;

  React.useEffect(() => {
    if (isFocused || !account) {
      return;
    }
    void refreshRecentWatchProgress(account);
  }, [account, isFocused]);
}
