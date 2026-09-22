import React from "react";

import { useAppUpdateInfo } from "@/api/check-update";
import { useStore } from "@/store";

/** 两次自动检查更新的最小间隔 */
const CHECK_UPDATE_INTERVAL = 1000 * 60 * 60 * 24 * 3;

function CheckAppUpdate() {
  const appUpdateInfo = useAppUpdateInfo();
  const { $checkAppUpdateTime } = useStore();
  const { hasUpdate, showAlert } = appUpdateInfo;

  // 弹窗属于副作用，放在 effect 中执行，避免渲染阶段调用 Date.now() 与弹窗 API
  React.useEffect(() => {
    if (__DEV__ || !hasUpdate) {
      return;
    }
    if ($checkAppUpdateTime + CHECK_UPDATE_INTERVAL >= Date.now()) {
      return;
    }
    showAlert();
  });

  return null;
}

export default CheckAppUpdate;
