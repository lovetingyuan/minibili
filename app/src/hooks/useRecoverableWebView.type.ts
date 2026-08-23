import type React from "react";
import type WebView from "react-native-webview";

export const RECOVERABLE_WEBVIEW_HEALTH_ACTION = "minibili:webview-health";

export type RecoverableWebViewRecoveryReason =
  | "manual"
  | "app-active-health-timeout"
  | "app-active-blank-page"
  | "render-process-gone"
  | "content-process-terminated";

export type RecoverableWebViewHealthPayload = {
  checkId: string;
  href: string;
  readyState: string;
  bodyChildCount: number;
  bodyTextLength: number;
  timestamp: number;
};

export type RecoverableWebViewHealthMessage = {
  action: typeof RECOVERABLE_WEBVIEW_HEALTH_ACTION;
  payload: RecoverableWebViewHealthPayload;
};

export type UseRecoverableWebViewOptions = {
  recoverOnAppActive?: boolean;
  minBackgroundMs?: number;
  healthTimeoutMs?: number;
  minRecoveryIntervalMs?: number;
  onRemount?: (reason: RecoverableWebViewRecoveryReason) => void;
};

export type UseRecoverableWebViewResult = {
  webViewRef: React.RefObject<WebView | null>;
  webViewKey: number;
  remountWebView: (reason?: RecoverableWebViewRecoveryReason) => void;
  handleWebViewMessage: (data: string) => boolean;
  handleRenderProcessGone: () => void;
  handleContentProcessDidTerminate: () => void;
};
