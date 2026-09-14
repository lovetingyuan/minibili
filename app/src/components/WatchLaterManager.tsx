import React from "react";

import { useBilibiliWatchLater } from "@/api/useWatchLater";
import { getWatchLaterListItems } from "@/api/watch-later";
import { useBilibiliSession } from "@/features/bilibili-session/useBilibiliSession";
import { useStore } from "@/store";
import { clearWatchLaterAids, replaceWatchLaterAids } from "@/store/watch-later";

/**
 * 把 B站稍后再看列表的 aid 集合同步进 store，供各处按钮判断是否已添加；
 * 列表本身不做持久化，退出登录或切换账号时立即失效。
 */
function WatchLaterManager() {
  const { initialed } = useStore();
  const { account, control } = useBilibiliSession();
  const enabled = Boolean(
    initialed && control.phase === "ready" && account && account.generation === control.generation,
  );
  const { data } = useBilibiliWatchLater(enabled);
  const activeKey = enabled && account ? `${account.mid}:${account.generation}` : null;
  // 初始哨兵值不能是 null：未登录时 activeKey 也是 null，否则不会清空上个账号的数据。
  const syncedKeyRef = React.useRef<string | null | undefined>(undefined);

  React.useEffect(() => {
    if (syncedKeyRef.current === activeKey) {
      return;
    }
    syncedKeyRef.current = activeKey;
    clearWatchLaterAids();
  }, [activeKey]);

  React.useEffect(() => {
    if (!enabled || !data) {
      return;
    }
    // 只在服务端数据变化时覆盖：本地乐观写入不应被尚未刷新的列表回滚。
    replaceWatchLaterAids(getWatchLaterListItems(data).map((item) => item.aid));
  }, [data, enabled]);

  return null;
}

export default WatchLaterManager;
