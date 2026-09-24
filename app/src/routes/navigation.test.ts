import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ready: false,
  navigate: vi.fn(),
}));

vi.mock("@react-navigation/native", () => ({
  createNavigationContainerRef: () => ({
    isReady: () => mocks.ready,
    navigate: mocks.navigate,
  }),
}));

import { flushPendingBilibiliLogin, openBilibiliLogin } from "./navigation";

beforeEach(() => {
  mocks.ready = false;
  vi.clearAllMocks();
});

test("导航就绪前保留登录跳转并在就绪后执行一次", () => {
  openBilibiliLogin();
  openBilibiliLogin();
  expect(mocks.navigate).not.toHaveBeenCalled();

  mocks.ready = true;
  flushPendingBilibiliLogin();
  flushPendingBilibiliLogin();

  expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith("BilibiliLogin");
});
