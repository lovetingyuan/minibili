import type { NetInfoStateType } from "@react-native-community/netinfo";

/**
 * 当前网络对用户的钱包意味着什么：
 * - `wifi`：确认走 WiFi/以太网，且系统没有把它标记成计费网络
 * - `metered`：会消耗移动流量
 * - `offline`：没有连接
 * - `unknown`：还没拿到网络状态（首帧、系统未返回）
 */
export type NetworkUsage = "wifi" | "metered" | "offline" | "unknown";

/** NetInfo 的连接类型取值，与 `NetInfoStateType` 保持一致 */
type NetInfoConnectionType = `${NetInfoStateType}`;

export type NetworkStateSnapshot = {
  type: NetInfoConnectionType;
  isConnected: boolean | null;
  details?: { isConnectionExpensive?: boolean } | null;
};

/**
 * 把 NetInfo 状态收敛成"要不要为用户省流量"的结论。
 *
 * 先看有没有连接，其次信系统的计费标记（WiFi 热点、VPN 的底层网络都会体现在
 * `isConnectionExpensive` 上），最后才按连接类型兜底：只有 WiFi/以太网敢认为免费，
 * vpn/other/bluetooth 这类拿不到底层通道的情况一律按流量处理。
 */
export function resolveNetworkUsage(state: NetworkStateSnapshot): NetworkUsage {
  if (state.isConnected === false) {
    return "offline";
  }
  if (state.isConnected === null || state.type === "unknown") {
    return "unknown";
  }
  if (state.type === "cellular" || state.type === "wimax") {
    return "metered";
  }
  const isConnectionExpensive = state.details?.isConnectionExpensive;
  if (isConnectionExpensive !== undefined) {
    return isConnectionExpensive ? "metered" : "wifi";
  }
  return state.type === "wifi" || state.type === "ethernet" ? "wifi" : "metered";
}
