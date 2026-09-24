import type { AlertButton } from "react-native";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { WatchLaterAccount } from "../api/watch-later.types";

const mocks = vi.hoisted(() => ({
  account: { mid: "123", generation: 1 } as WatchLaterAccount | null | undefined,
  error: undefined as Error | undefined,
  phase: "ready" as "ready" | "logging-out",
  current: true,
  aids: {} as Record<string, true>,
  pending: [] as string[],
  toggle: vi.fn<(account: WatchLaterAccount, aid: string, added: boolean) => Promise<boolean>>(),
  alert: vi.fn<(title: string, message: string, buttons: AlertButton[]) => void>(),
  navigate: vi.fn(),
  showToast: vi.fn(),
  logout: vi.fn(async () => undefined),
}));

vi.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mocks.navigate }),
  createNavigationContainerRef: () => ({ isReady: () => true, navigate: mocks.navigate }),
}));
vi.mock("react-native", () => ({ Alert: { alert: mocks.alert } }));
vi.mock("../api/useWatchLater", () => ({
  useModifyWatchLater: () => ({
    isPending: (aid: string) => mocks.pending.includes(aid),
    toggle: mocks.toggle,
  }),
}));
vi.mock("../api/watch-later", async () => {
  const { LoginRequiredError } = await import("../features/bilibili-session/login-required");
  return {
    WatchLaterLoginRequiredError: class WatchLaterLoginRequiredError extends LoginRequiredError {},
  };
});
vi.mock("../features/bilibili-session/session", () => ({
  bilibiliSession: { isCurrentAccount: () => mocks.current },
}));
vi.mock("../features/bilibili-session/useBilibiliSession", () => ({
  useBilibiliSessionActions: () => ({ logout: mocks.logout }),
  useBilibiliSessionState: () => ({
    account: mocks.account,
    control: { phase: mocks.phase, generation: 1, error: null },
    error: mocks.error,
  }),
}));
vi.mock("../store/watch-later", () => ({ useWatchLaterAids: () => mocks.aids }));
vi.mock("../utils", () => ({ showToast: mocks.showToast }));

import { WatchLaterLoginRequiredError } from "../api/watch-later";
import { useWatchLaterActions } from "./useWatchLaterActions";

function pressButton(text: string) {
  const buttons = mocks.alert.mock.calls.at(-1)?.[2];
  const button = buttons?.find((candidate) => candidate.text === text);
  expect(button).toBeDefined();
  button?.onPress?.();
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.account = { mid: "123", generation: 1 };
  mocks.error = undefined;
  mocks.phase = "ready";
  mocks.current = true;
  mocks.aids = {};
  mocks.pending = [];
  mocks.toggle.mockResolvedValue(true);
});

describe("watch later toggle", () => {
  test("guides logged-out users to login without sending a request", async () => {
    mocks.account = null;
    await useWatchLaterActions().toggle({ aid: 42 });
    expect(mocks.alert).toHaveBeenCalledWith(
      "请先登录 B站",
      "请先登录 B站，登录后再试",
      expect.any(Array),
    );
    pressButton("去登录");
    expect(mocks.navigate).toHaveBeenCalledWith("BilibiliLogin");
    expect(mocks.toggle).not.toHaveBeenCalled();
  });

  test("waits while the session is still being confirmed", async () => {
    mocks.account = undefined;
    await useWatchLaterActions().toggle({ aid: 42 });
    expect(mocks.showToast).toHaveBeenCalledExactlyOnceWith("正在确认登录状态，请稍候重试");
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(mocks.toggle).not.toHaveBeenCalled();
  });

  test("adds a new video and reports the new state", async () => {
    await useWatchLaterActions().toggle({ aid: 42 });
    expect(mocks.toggle).toHaveBeenCalledExactlyOnceWith({ mid: "123", generation: 1 }, "42", true);
    expect(mocks.showToast).toHaveBeenCalledExactlyOnceWith("已添加到稍后再看");
  });

  test("removes a video that is already in the list", async () => {
    mocks.aids = { "42": true };
    mocks.toggle.mockResolvedValue(false);
    await useWatchLaterActions().toggle({ aid: 42 });
    expect(mocks.toggle).toHaveBeenCalledExactlyOnceWith(
      { mid: "123", generation: 1 },
      "42",
      false,
    );
    expect(mocks.showToast).toHaveBeenCalledExactlyOnceWith("已从稍后再看移除");
  });

  test("keeps one request per video while it is pending", async () => {
    mocks.pending = ["42"];
    await useWatchLaterActions().toggle({ aid: 42 });
    expect(mocks.toggle).not.toHaveBeenCalled();
    expect(mocks.showToast).toHaveBeenCalledExactlyOnceWith("稍后再看操作正在进行，请稍候");
  });

  test("ignores targets without a usable video id", async () => {
    const actions = useWatchLaterActions();
    await actions.toggle({});
    await actions.toggle({ aid: 0 });
    expect(mocks.toggle).not.toHaveBeenCalled();
    expect(mocks.showToast).toHaveBeenCalledTimes(2);
    expect(mocks.showToast).toHaveBeenLastCalledWith("视频信息尚未加载完成，请稍候重试");
  });

  test("reports request failures without claiming success", async () => {
    mocks.toggle.mockRejectedValueOnce(new Error("无法确认添加稍后再看结果，请刷新稍后再看后再操作"));
    await useWatchLaterActions().toggle({ aid: 42 });
    expect(mocks.showToast).toHaveBeenCalledExactlyOnceWith(
      "无法确认添加稍后再看结果，请刷新稍后再看后再操作",
    );
  });

  test("reports a changed session instead of a generic failure", async () => {
    mocks.toggle.mockImplementationOnce(async () => {
      mocks.current = false;
      throw new Error("登录状态已改变");
    });
    await useWatchLaterActions().toggle({ aid: 42 });
    expect(mocks.showToast).toHaveBeenCalledExactlyOnceWith("登录状态已改变，请重新操作");
  });

  test("only logs out expired credentials after explicit re-login confirmation", async () => {
    mocks.toggle.mockRejectedValueOnce(new WatchLaterLoginRequiredError("登录凭据失效，请重新登录 B站"));
    await useWatchLaterActions().toggle({ aid: 42 });
    expect(mocks.alert).toHaveBeenCalledExactlyOnceWith(
      "请先登录 B站",
      "登录凭据失效，请重新登录 B站",
      expect.any(Array),
    );
    expect(mocks.logout).not.toHaveBeenCalled();

    pressButton("取消");
    expect(mocks.logout).not.toHaveBeenCalled();

    pressButton("去登录");
    await vi.waitFor(() =>
      expect(mocks.navigate).toHaveBeenCalledWith("BilibiliLogin"),
    );
    expect(mocks.logout).toHaveBeenCalledOnce();
  });
});
