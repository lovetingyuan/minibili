import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { NetworkStateSnapshot } from "../../utils/network";

const mocks = vi.hoisted(() => ({
  netInfo: {} as unknown,
  cleanup: null as null | (() => void),
  setNetworkUsage: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
  const original = await importOriginal<typeof import("react")>();
  return {
    ...original,
    default: {
      ...original,
      useEffect: (effect: () => void | (() => void)) => {
        const cleanup = effect();
        mocks.cleanup = typeof cleanup === "function" ? cleanup : null;
      },
    },
  };
});
vi.mock("@react-native-community/netinfo", () => ({
  useNetInfo: () => mocks.netInfo,
}));
vi.mock("@/store", () => ({
  useStore: () => ({ setNetworkUsage: mocks.setNetworkUsage }),
}));
vi.mock("@/utils", async () => {
  const { resolveNetworkUsage } = await import("../../utils/network");
  return { resolveNetworkUsage, showToast: mocks.showToast };
});

import CheckNetState from "./CheckNetState";

function netState(overrides: Partial<NetworkStateSnapshot>): NetworkStateSnapshot {
  return {
    type: "wifi",
    isConnected: true,
    details: { isConnectionExpensive: false },
    ...overrides,
  };
}

/** 模拟 React 在依赖变化时先清理旧 effect 再执行新 effect */
function rerenderWith(state: NetworkStateSnapshot) {
  mocks.cleanup?.();
  mocks.netInfo = state;
  CheckNetState();
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  mocks.cleanup = null;
  mocks.netInfo = netState({});
});

afterEach(() => {
  vi.useRealTimers();
});

describe("全局网络状态", () => {
  test("WiFi 下同步状态并且不打扰用户", () => {
    CheckNetState();

    expect(mocks.setNetworkUsage).toHaveBeenCalledExactlyOnceWith("wifi");
    vi.advanceTimersByTime(3000);
    expect(mocks.showToast).not.toHaveBeenCalled();
  });

  test("流量下提示用户会消耗流量", () => {
    mocks.netInfo = netState({ type: "cellular", details: { isConnectionExpensive: true } });

    CheckNetState();

    expect(mocks.setNetworkUsage).toHaveBeenCalledExactlyOnceWith("metered");
    // 网络抖动 3 秒内恢复时不提示
    vi.advanceTimersByTime(2999);
    expect(mocks.showToast).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(mocks.showToast).toHaveBeenCalledExactlyOnceWith(
      "当前网络不是 WiFi，播放视频将消耗流量",
    );
  });

  test("断网时提示网络已断开", () => {
    mocks.netInfo = netState({ type: "none", isConnected: false, details: null });

    CheckNetState();
    vi.advanceTimersByTime(3000);

    expect(mocks.setNetworkUsage).toHaveBeenCalledExactlyOnceWith("offline");
    expect(mocks.showToast).toHaveBeenCalledExactlyOnceWith("当前网络已断开，请检查网络设置");
  });

  test("状态未知时既不写 store 也不提示", () => {
    mocks.netInfo = netState({ type: "unknown", isConnected: null, details: null });

    CheckNetState();
    vi.advanceTimersByTime(3000);

    expect(mocks.setNetworkUsage).not.toHaveBeenCalled();
    expect(mocks.showToast).not.toHaveBeenCalled();
  });

  test("切换到 WiFi 后取消待提示的流量警告", () => {
    mocks.netInfo = netState({ type: "cellular", details: { isConnectionExpensive: true } });
    CheckNetState();
    vi.advanceTimersByTime(1000);

    rerenderWith(netState({}));
    vi.advanceTimersByTime(5000);

    expect(mocks.showToast).not.toHaveBeenCalled();
    expect(mocks.setNetworkUsage).toHaveBeenLastCalledWith("wifi");
  });
});
