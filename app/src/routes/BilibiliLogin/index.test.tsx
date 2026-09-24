import React from "react";
import type { ReactElement, ReactNode } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  state: [] as unknown[],
  refs: [] as { current: unknown }[],
  stateIndex: 0,
  refIndex: 0,
  effects: [] as (() => void | (() => void))[],
  canGoBack: true,
  goBack: vi.fn(),
  navigate: vi.fn(),
  login: vi.fn<(cookie: string, signal: AbortSignal) => Promise<boolean>>(),
  mutate: vi.fn(),
  showToast: vi.fn(),
  getCookieHeader: vi.fn(async () => "SESSDATA=1; DedeUserID=2; bili_jct=3"),
}));

vi.mock("react", async (importOriginal) => {
  const original = await importOriginal<typeof import("react")>();
  const originalDefault = (original as unknown as { default?: object }).default;
  function useState(initial: unknown) {
    const index = mocks.stateIndex++;
    mocks.state[index] ??= initial;
    return [
      mocks.state[index],
      (value: unknown) => {
        mocks.state[index] =
          typeof value === "function"
            ? (value as (previous: unknown) => unknown)(mocks.state[index])
            : value;
      },
    ];
  }
  function useEffect(effect: () => void | (() => void)) {
    mocks.effects.push(effect);
  }
  function useRef(initial: unknown) {
    const index = mocks.refIndex++;
    mocks.refs[index] ??= { current: initial };
    return mocks.refs[index];
  }
  return {
    ...original,
    default: { ...originalDefault, useState, useEffect, useRef },
    useState,
    useEffect,
    useRef,
  };
});
vi.mock("react-native", () => ({ ActivityIndicator: "ActivityIndicator", View: "View" }));
vi.mock("react-native-webview", () => ({ WebView: "WebView" }));
vi.mock("@preeternal/react-native-cookie-manager", () => ({
  default: { getCookieHeader: mocks.getCookieHeader },
}));
vi.mock("@/api/bilibili-cookie.helpers", () => ({
  BILIBILI_API_COOKIE_URL: "https://api.bilibili.com/",
  hasBilibiliLoginCookie: () => true,
}));
vi.mock("@/components/styled/rneui", () => ({ Button: "Button", Text: "Text" }));
vi.mock("@/constants/theme", () => import("../../constants/theme"));
vi.mock("@/features/bilibili-session/controller", () => ({
  BilibiliSessionChangedError: class BilibiliSessionChangedError extends Error {},
}));
vi.mock("@/features/bilibili-session/useBilibiliSession", () => ({
  useBilibiliSession: () => ({ login: mocks.login }),
}));
vi.mock("@/hooks/useAppState", () => ({ useAppStateChange: () => "active" }));
vi.mock("@/hooks/useLatest", () => ({
  default: (value: unknown) => ({ current: value }),
}));
vi.mock("swr", () => ({ useSWRConfig: () => ({ mutate: mocks.mutate }) }));
vi.mock("@/utils", () => ({ showToast: mocks.showToast }));

import BilibiliLogin from "./index";

type ElementProps = { children?: ReactNode; onLoadEnd?: () => void };

const originalSetInterval = globalThis.setInterval;

function render() {
  mocks.stateIndex = 0;
  mocks.refIndex = 0;
  return BilibiliLogin({
    navigation: {
      canGoBack: () => mocks.canGoBack,
      goBack: mocks.goBack,
      navigate: mocks.navigate,
    },
  } as unknown as Parameters<typeof BilibiliLogin>[0]);
}

function elements(node: ReactNode): ReactElement<ElementProps>[] {
  const result: ReactElement<ElementProps>[] = [];
  React.Children.forEach(node, (child) => {
    if (React.isValidElement<ElementProps>(child)) {
      result.push(child, ...elements(child.props.children));
    }
  });
  return result;
}

function runEffects() {
  const pending = mocks.effects;
  mocks.effects = [];
  for (const effect of pending) {
    effect();
  }
}

/** 走完 WebView 首帧 + 抓 Cookie 的完整流程 */
function finishLogin() {
  const webView = elements(render()).find((element) => element.type === "WebView");
  webView?.props.onLoadEnd?.();
  render();
  runEffects();
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.state = [];
  mocks.refs = [];
  mocks.effects = [];
  mocks.canGoBack = true;
  mocks.login.mockResolvedValue(true);
  // 只捕获定时器，用例里靠首次 captureCookie 触发登录成功
  globalThis.setInterval = (() => 0) as unknown as typeof setInterval;
});

afterEach(() => {
  globalThis.setInterval = originalSetInterval;
});

test("登录成功后返回上一页并重新校验数据", async () => {
  finishLogin();

  await vi.waitFor(() => expect(mocks.goBack).toHaveBeenCalledOnce());
  expect(mocks.showToast).toHaveBeenCalledWith("登录成功");
  expect(mocks.mutate).toHaveBeenCalledWith(expect.any(Function), undefined, { revalidate: true });
  expect(mocks.navigate).not.toHaveBeenCalled();
});

test("没有上一页时回到主页面", async () => {
  mocks.canGoBack = false;
  finishLogin();

  await vi.waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith("MainTabs"));
  expect(mocks.goBack).not.toHaveBeenCalled();
});

test("Cookie 未通过校验时留在登录页", async () => {
  mocks.login.mockResolvedValue(false);
  finishLogin();
  await Promise.resolve();

  expect(mocks.goBack).not.toHaveBeenCalled();
  expect(mocks.showToast).not.toHaveBeenCalled();
  expect(mocks.mutate).not.toHaveBeenCalled();
});
