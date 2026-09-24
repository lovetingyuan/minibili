import React from "react";

import { bilibiliAuthExpiration } from "@/features/bilibili-session/auth-expiration";
import { useBilibiliSessionActions } from "@/features/bilibili-session/useBilibiliSession";

/**
 * 登录态失效（-101/-111）时静默清理本地登录态。
 * 提示与登录引导交给当前页面：数据加载失败显示需登录 UI，操作失败弹窗引导。
 */
export default function BilibiliAuthExpirationManager() {
  const snapshot = React.useSyncExternalStore(
    bilibiliAuthExpiration.subscribe,
    bilibiliAuthExpiration.getSnapshot,
  );
  const handledVersion = React.useRef(0);
  const { logout } = useBilibiliSessionActions();

  React.useEffect(() => {
    if (!snapshot.error || snapshot.version <= handledVersion.current) {
      return;
    }
    handledVersion.current = snapshot.version;
    // 清理失败时不做提示：页面已经在引导用户重新登录，下次登录/退出会继续清理
    void logout().catch(() => {});
  }, [logout, snapshot]);

  return null;
}
