import { describe, expect, test } from "vitest";

import { resolveNetworkUsage, type NetworkStateSnapshot, type NetworkUsage } from "./network";

function state(overrides: Partial<NetworkStateSnapshot>): NetworkStateSnapshot {
  return {
    type: "wifi",
    isConnected: true,
    details: { isConnectionExpensive: false },
    ...overrides,
  };
}

function usageOf(overrides: Partial<NetworkStateSnapshot>): NetworkUsage {
  return resolveNetworkUsage(state(overrides));
}

describe("resolveNetworkUsage", () => {
  test("把断开与未知状态单独归类，不当作流量", () => {
    expect(usageOf({ type: "none", isConnected: false, details: null })).toBe("offline");
    // 断网时即使连接类型还停在 wifi，也按断开处理
    expect(usageOf({ isConnected: false })).toBe("offline");
    expect(usageOf({ type: "unknown", isConnected: null, details: null })).toBe("unknown");
    expect(usageOf({ type: "unknown", isConnected: true, details: null })).toBe("unknown");
  });

  test("WiFi 与以太网按免费网络处理", () => {
    expect(usageOf({ type: "wifi" })).toBe("wifi");
    expect(usageOf({ type: "ethernet" })).toBe("wifi");
    // 系统没有给出计费标记时，也只有 WiFi/以太网敢认为免费
    expect(usageOf({ type: "wifi", details: null })).toBe("wifi");
    expect(usageOf({ type: "ethernet", details: null })).toBe("wifi");
  });

  test("计费热点按流量处理", () => {
    expect(usageOf({ details: { isConnectionExpensive: true } })).toBe("metered");
  });

  test("移动网络一律按流量处理", () => {
    expect(usageOf({ type: "cellular", details: { isConnectionExpensive: true } })).toBe("metered");
    expect(usageOf({ type: "cellular", details: null })).toBe("metered");
    expect(usageOf({ type: "cellular", details: { isConnectionExpensive: false } })).toBe(
      "metered",
    );
    expect(usageOf({ type: "wimax", details: null })).toBe("metered");
  });

  test("VPN 跟随底层网络，拿不到底层通道时按流量处理", () => {
    expect(usageOf({ type: "vpn", details: { isConnectionExpensive: false } })).toBe("wifi");
    expect(usageOf({ type: "vpn", details: { isConnectionExpensive: true } })).toBe("metered");
    expect(usageOf({ type: "vpn", details: null })).toBe("metered");
    expect(usageOf({ type: "other", details: null })).toBe("metered");
    expect(usageOf({ type: "bluetooth", details: null })).toBe("metered");
  });
});
