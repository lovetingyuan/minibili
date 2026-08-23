import {
  RECOVERABLE_WEBVIEW_HEALTH_ACTION,
  type RecoverableWebViewHealthMessage,
  type RecoverableWebViewHealthPayload,
} from "./useRecoverableWebView.type";

export { RECOVERABLE_WEBVIEW_HEALTH_ACTION };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isRecoverableWebViewHealthPayload(
  value: unknown,
): value is RecoverableWebViewHealthPayload {
  return (
    isRecord(value) &&
    typeof value.checkId === "string" &&
    typeof value.href === "string" &&
    typeof value.readyState === "string" &&
    isFiniteNumber(value.bodyChildCount) &&
    isFiniteNumber(value.bodyTextLength) &&
    isFiniteNumber(value.timestamp)
  );
}

export function parseRecoverableWebViewHealthMessage(
  data: string,
): RecoverableWebViewHealthMessage | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch {
    return null;
  }

  if (
    !isRecord(parsed) ||
    parsed.action !== RECOVERABLE_WEBVIEW_HEALTH_ACTION ||
    !isRecoverableWebViewHealthPayload(parsed.payload)
  ) {
    return null;
  }

  return {
    action: RECOVERABLE_WEBVIEW_HEALTH_ACTION,
    payload: parsed.payload,
  };
}

export function shouldRemountRecoverableWebView(payload: RecoverableWebViewHealthPayload) {
  return payload.readyState !== "loading" && payload.bodyChildCount === 0;
}

export function createRecoverableWebViewHealthCheckScript(checkId: string) {
  return `
;(function() {
  var action = ${JSON.stringify(RECOVERABLE_WEBVIEW_HEALTH_ACTION)};
  var checkId = ${JSON.stringify(checkId)};
  function postHealth(payload) {
    if (
      !window.ReactNativeWebView ||
      typeof window.ReactNativeWebView.postMessage !== 'function'
    ) {
      return;
    }
    window.ReactNativeWebView.postMessage(JSON.stringify({
      action: action,
      payload: payload,
    }));
  }
  try {
    var body = document.body;
    var bodyText = body && typeof body.innerText === 'string' ? body.innerText.trim() : '';
    postHealth({
      checkId: checkId,
      href: window.location.href,
      readyState: document.readyState,
      bodyChildCount: body ? body.children.length : 0,
      bodyTextLength: bodyText.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    postHealth({
      checkId: checkId,
      href: '',
      readyState: 'error',
      bodyChildCount: 0,
      bodyTextLength: 0,
      timestamp: Date.now(),
    });
  }
})();
true;
`;
}
