import { describe, expect, test } from "vitest";

import {
  RECOVERABLE_WEBVIEW_HEALTH_ACTION,
  parseRecoverableWebViewHealthMessage,
  shouldRemountRecoverableWebView,
} from "./useRecoverableWebView.helpers";

describe("recoverable webview helpers", () => {
  test("parses a valid health message", () => {
    const message = parseRecoverableWebViewHealthMessage(
      JSON.stringify({
        action: RECOVERABLE_WEBVIEW_HEALTH_ACTION,
        payload: {
          checkId: "check-1",
          href: "https://m.bilibili.com/space/1",
          readyState: "complete",
          bodyChildCount: 3,
          bodyTextLength: 120,
          timestamp: 123,
        },
      }),
    );

    expect(message?.payload.checkId).toBe("check-1");
    expect(message?.payload.bodyChildCount).toBe(3);
  });

  test("ignores invalid health messages", () => {
    expect(parseRecoverableWebViewHealthMessage("not-json")).toBeNull();
    expect(
      parseRecoverableWebViewHealthMessage(
        JSON.stringify({
          action: "business-message",
          payload: {
            checkId: "check-1",
          },
        }),
      ),
    ).toBeNull();
    expect(
      parseRecoverableWebViewHealthMessage(
        JSON.stringify({
          action: RECOVERABLE_WEBVIEW_HEALTH_ACTION,
          payload: {
            checkId: "check-1",
            readyState: "complete",
          },
        }),
      ),
    ).toBeNull();
  });

  test("remounts when a loaded document has no body children", () => {
    expect(
      shouldRemountRecoverableWebView({
        checkId: "check-1",
        href: "about:blank",
        readyState: "complete",
        bodyChildCount: 0,
        bodyTextLength: 0,
        timestamp: 123,
      }),
    ).toBe(true);
  });

  test("does not remount normal or still-loading documents", () => {
    expect(
      shouldRemountRecoverableWebView({
        checkId: "check-1",
        href: "https://m.bilibili.com/space/1",
        readyState: "complete",
        bodyChildCount: 1,
        bodyTextLength: 10,
        timestamp: 123,
      }),
    ).toBe(false);

    expect(
      shouldRemountRecoverableWebView({
        checkId: "check-2",
        href: "https://m.bilibili.com/space/1",
        readyState: "loading",
        bodyChildCount: 0,
        bodyTextLength: 0,
        timestamp: 456,
      }),
    ).toBe(false);
  });
});
