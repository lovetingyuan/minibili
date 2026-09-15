import React from "react";

import { syncWatchProgress } from "@/api/watch-progress";
import { useBilibiliSession } from "@/features/bilibili-session/useBilibiliSession";
import { useStore } from "@/store";
import { clearWatchProgress } from "@/store/watch-progress";

/**
 * 登录后把最近 100 条观看历史的进度（bvid → 比例）同步进 store，供各视频封面展示进度条；
 * 账号切换或退出登录时立即清空，避免把上个账号的进度画到别人的视频上。
 */
function WatchProgressManager() {
  const { initialed } = useStore();
  const { account, control } = useBilibiliSession();
  const enabled = Boolean(
    initialed && control.phase === "ready" && account && account.generation === control.generation,
  );
  const activeKey = enabled && account ? `${account.mid}:${account.generation}` : null;
  const syncedKeyRef = React.useRef<string | null | undefined>(undefined);

  React.useEffect(() => {
    if (syncedKeyRef.current === activeKey) {
      return;
    }
    syncedKeyRef.current = activeKey;
    clearWatchProgress();
    if (!activeKey || !account) {
      return;
    }
    void syncWatchProgress(account);
  }, [account, activeKey]);

  return null;
}

export default WatchProgressManager;
