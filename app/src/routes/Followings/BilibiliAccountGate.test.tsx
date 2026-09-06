import React from "react";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  focused: true,
  revalidate: vi.fn(),
  session: {
    account: null as null | undefined | { mid: string; generation: number },
    error: undefined as Error | undefined,
    isChecking: false,
    control: { phase: "ready", generation: 1 },
  },
}));

vi.mock("@react-navigation/native", () => ({ useIsFocused: () => mocks.focused }));
vi.mock("react-native", () => ({ ActivityIndicator: "ActivityIndicator", View: "View" }));
vi.mock("@/api/followings", () => ({ useBilibiliFollowings: vi.fn() }));
vi.mock("@/components/styled/rneui", () => ({ Button: "Button", Text: "Text" }));
vi.mock("@/features/bilibili-session/session", () => ({
  bilibiliSession: {
    isCurrentAccount: (account: { generation: number }) =>
      account.generation === mocks.session.control.generation,
  },
}));
vi.mock("@/features/bilibili-session/useBilibiliSession", () => ({
  useBilibiliSession: () => ({ ...mocks.session, revalidate: mocks.revalidate }),
}));
vi.mock("./BilibiliLoginWebView", () => ({ default: "BilibiliLoginWebView" }));

import BilibiliAccountGate from "./BilibiliAccountGate";

function Content() {
  return React.createElement("Content");
}

type ElementProps = { children?: ReactNode } & Record<string, unknown>;

function elements(node: ReactNode): ReactElement<ElementProps>[] {
  const result: ReactElement<ElementProps>[] = [];
  React.Children.forEach(node, (child) => {
    if (React.isValidElement<ElementProps>(child)) {
      result.push(child, ...elements(child.props.children));
    }
  });
  return result;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.focused = true;
  mocks.session.account = null;
  mocks.session.error = undefined;
  mocks.session.isChecking = false;
  mocks.session.control = { phase: "ready", generation: 1 };
});

test("shows the login web view only while a logged-out route is focused", () => {
  const focused = elements(BilibiliAccountGate({ Content }));
  expect(focused.some((element) => element.type === "BilibiliLoginWebView")).toBe(true);

  mocks.focused = false;
  const inactive = elements(BilibiliAccountGate({ Content }));
  expect(inactive.some((element) => element.type === "BilibiliLoginWebView")).toBe(false);
});

test("renders account content only for the current generation", () => {
  mocks.session.account = { mid: "123", generation: 1 };
  const current = elements(BilibiliAccountGate({ Content }));
  expect(current.some((element) => element.type === Content)).toBe(true);

  mocks.session.account = { mid: "123", generation: 2 };
  const stale = elements(BilibiliAccountGate({ Content }));
  expect(stale.some((element) => element.type === Content)).toBe(false);
  expect(stale.some((element) => element.type === "ActivityIndicator")).toBe(true);
});

test("offers a retry when the initial session check fails", () => {
  mocks.session.account = undefined;
  mocks.session.error = new Error("network");
  const retry = elements(BilibiliAccountGate({ Content })).find(
    (element): element is ReactElement<ElementProps & { onPress: () => void }> =>
      element.type === "Button",
  );

  expect(retry).toBeDefined();
  retry?.props.onPress();
  expect(mocks.revalidate).toHaveBeenCalledOnce();
});
