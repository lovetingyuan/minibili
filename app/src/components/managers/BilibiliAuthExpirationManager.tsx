import React from "react";

import { bilibiliAuthExpiration } from "@/features/bilibili-session/auth-expiration";
import { BilibiliSessionChangedError } from "@/features/bilibili-session/controller";
import { isLoginRequiredError } from "@/features/bilibili-session/login-required";
import { bilibiliSession } from "@/features/bilibili-session/session";
import {
  useBilibiliSessionActions,
  useBilibiliSessionState,
} from "@/features/bilibili-session/useBilibiliSession";
import { showToast } from "@/utils";

/**
 * 登录态失效（-101/-111）时静默清理本地登录态。
 * 提示与登录引导交给当前页面：数据加载失败显示需登录 UI，操作失败弹窗引导。
 * 已有登录状态的校验失败统一提示一次，避免多个页面重复提示。
 */
export default function BilibiliAuthExpirationManager() {
  const snapshot = React.useSyncExternalStore(
    bilibiliAuthExpiration.subscribe,
    bilibiliAuthExpiration.getSnapshot,
  );
  const handledVersion = React.useRef(0);
  const { logout } = useBilibiliSessionActions();
  const { account, control, error } = useBilibiliSessionState();
  const notifiedGenerationRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!error) {
      notifiedGenerationRef.current = null;
      return;
    }
    if (
      account === undefined ||
      control.phase !== "ready" ||
      (account && !bilibiliSession.isCurrentAccount(account)) ||
      error instanceof BilibiliSessionChangedError ||
      isLoginRequiredError(error) ||
      notifiedGenerationRef.current === control.generation
    ) {
      return;
    }
    notifiedGenerationRef.current = control.generation;
    showToast("登录状态检查失败，请稍后重试", true);
  }, [account, control, error]);

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
