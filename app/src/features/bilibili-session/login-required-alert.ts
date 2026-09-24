import { Alert } from "react-native";

import { openBilibiliLogin } from "../../routes/navigation";
import { showToast } from "../../utils";

import { isLoginRequiredError } from "./login-required";
import { bilibiliSession } from "./session";

const ALERT_TITLE = "请先登录 B站";
const DEFAULT_MESSAGE = "登录后即可继续操作";

type LoginRequiredAccount = { mid: string; generation: number };

type LoginRequiredAlertOptions = {
  /** 本地还留着失效登录态时先清理，再进登录页（账号已被新会话替换时直接进登录页） */
  session?: {
    account: LoginRequiredAccount | null | undefined;
    logout: () => Promise<unknown>;
  };
};

function goToLogin(session: LoginRequiredAlertOptions["session"]) {
  if (!session?.account || !bilibiliSession.isCurrentAccount(session.account)) {
    openBilibiliLogin();
    return;
  }
  void session
    .logout()
    .catch(() => {
      showToast("退出登录失败，请重试");
    })
    .finally(openBilibiliLogin);
}

/** 操作类请求需要登录时统一用这个弹窗引导，确认后直接进登录页 */
export function showLoginRequiredAlert(message?: string, options?: LoginRequiredAlertOptions) {
  Alert.alert(ALERT_TITLE, message?.trim() || DEFAULT_MESSAGE, [
    { text: "取消", style: "cancel" },
    { text: "去登录", onPress: () => goToLogin(options?.session) },
  ]);
}

/**
 * 命中「可以通过登录解决」的错误时弹窗引导登录。
 * 返回 true 表示已处理，调用方不要再走默认错误提示。
 */
export function handleLoginRequiredError(
  error: unknown,
  fallbackMessage?: string,
  options?: LoginRequiredAlertOptions,
) {
  if (!isLoginRequiredError(error)) {
    return false;
  }
  showLoginRequiredAlert(error instanceof Error ? error.message : fallbackMessage, options);
  return true;
}
