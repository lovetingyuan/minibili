import { useNetInfo } from "@react-native-community/netinfo";
import React from "react";

import { useStore } from "@/store";
import { resolveNetworkUsage, showToast } from "@/utils";

/** 网络状态稳定这么久之后才提示，避免切换过程中的瞬时抖动打扰用户 */
const NET_STATE_NOTICE_DELAY_MS = 3000;

/**
 * 把全局网络状态写进 store，并在开始消耗流量/断网时提示用户。
 * 播放页按 store 里的 `networkUsage` 决定要不要自动播放、默认用哪档清晰度。
 */
function CheckNetState() {
  const { setNetworkUsage } = useStore();
  const netInfo = useNetInfo();
  const networkUsage = resolveNetworkUsage(netInfo);

  React.useEffect(() => {
    // 状态未知时不改结论也不提示，等 NetInfo 给出结果
    if (networkUsage === "unknown") {
      return;
    }
    setNetworkUsage(networkUsage);
    const timer = setTimeout(() => {
      if (networkUsage === "metered") {
        showToast("当前网络不是 WiFi，播放视频将消耗流量");
      } else if (networkUsage === "offline") {
        showToast("当前网络已断开，请检查网络设置");
      }
    }, NET_STATE_NOTICE_DELAY_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [networkUsage, setNetworkUsage]);

  return null;
}

export default CheckNetState;
