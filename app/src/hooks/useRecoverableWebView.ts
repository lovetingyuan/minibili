import React from "react";
import type WebView from "react-native-webview";

import { useAppStateChange } from "./useAppState";
import {
  createRecoverableWebViewHealthCheckScript,
  parseRecoverableWebViewHealthMessage,
  shouldRemountRecoverableWebView,
} from "./useRecoverableWebView.helpers";
import type {
  RecoverableWebViewRecoveryReason,
  UseRecoverableWebViewOptions,
  UseRecoverableWebViewResult,
} from "./useRecoverableWebView.type";

const DEFAULT_MIN_BACKGROUND_MS = 30000;
const DEFAULT_HEALTH_TIMEOUT_MS = 1500;
const DEFAULT_MIN_RECOVERY_INTERVAL_MS = 3000;

type PendingHealthCheck = {
  checkId: string;
  timeout: ReturnType<typeof setTimeout>;
};

function createHealthCheckId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useRecoverableWebView(
  options: UseRecoverableWebViewOptions = {},
): UseRecoverableWebViewResult {
  const {
    recoverOnAppActive = true,
    minBackgroundMs = DEFAULT_MIN_BACKGROUND_MS,
    healthTimeoutMs = DEFAULT_HEALTH_TIMEOUT_MS,
    minRecoveryIntervalMs = DEFAULT_MIN_RECOVERY_INTERVAL_MS,
    onRemount,
  } = options;
  const webViewRef = React.useRef<WebView | null>(null);
  const [webViewKey, setWebViewKey] = React.useState(0);
  const backgroundStartAtRef = React.useRef<number | null>(null);
  const pendingHealthCheckRef = React.useRef<PendingHealthCheck | null>(null);
  const lastRecoveryAtRef = React.useRef(0);

  function clearPendingHealthCheck() {
    if (!pendingHealthCheckRef.current) {
      return;
    }

    clearTimeout(pendingHealthCheckRef.current.timeout);
    pendingHealthCheckRef.current = null;
  }

  function remountWebView(reason: RecoverableWebViewRecoveryReason = "manual") {
    const now = Date.now();
    const shouldThrottle =
      reason !== "manual" && now - lastRecoveryAtRef.current < minRecoveryIntervalMs;
    if (shouldThrottle) {
      return;
    }

    lastRecoveryAtRef.current = now;
    clearPendingHealthCheck();
    setWebViewKey((key) => key + 1);
    onRemount?.(reason);
  }

  function startHealthCheck() {
    if (!webViewRef.current) {
      return;
    }

    clearPendingHealthCheck();
    const checkId = createHealthCheckId();
    const timeout = setTimeout(() => {
      if (pendingHealthCheckRef.current?.checkId !== checkId) {
        return;
      }

      pendingHealthCheckRef.current = null;
      remountWebView("app-active-health-timeout");
    }, healthTimeoutMs);

    pendingHealthCheckRef.current = {
      checkId,
      timeout,
    };

    try {
      webViewRef.current.injectJavaScript(createRecoverableWebViewHealthCheckScript(checkId));
    } catch {
      pendingHealthCheckRef.current = null;
      clearTimeout(timeout);
      remountWebView("app-active-health-timeout");
    }
  }

  function handleWebViewMessage(data: string) {
    const message = parseRecoverableWebViewHealthMessage(data);
    if (!message) {
      return false;
    }

    const pendingHealthCheck = pendingHealthCheckRef.current;
    if (pendingHealthCheck?.checkId === message.payload.checkId) {
      clearPendingHealthCheck();
      if (shouldRemountRecoverableWebView(message.payload)) {
        remountWebView("app-active-blank-page");
      }
    }

    return true;
  }

  function handleRenderProcessGone() {
    remountWebView("render-process-gone");
  }

  function handleContentProcessDidTerminate() {
    remountWebView("content-process-terminated");
  }

  useAppStateChange((nextAppState) => {
    if (!recoverOnAppActive) {
      return;
    }

    if (nextAppState === "active") {
      const backgroundStartAt = backgroundStartAtRef.current;
      backgroundStartAtRef.current = null;
      if (backgroundStartAt !== null && Date.now() - backgroundStartAt >= minBackgroundMs) {
        startHealthCheck();
      }
      return;
    }

    if (backgroundStartAtRef.current === null) {
      backgroundStartAtRef.current = Date.now();
    }
  });

  React.useEffect(() => {
    return () => {
      clearPendingHealthCheck();
    };
  }, []);

  return {
    webViewRef,
    webViewKey,
    remountWebView,
    handleWebViewMessage,
    handleRenderProcessGone,
    handleContentProcessDidTerminate,
  };
}
