import React from "react";

import { useAppUpdateInfo } from "@/api/check-update";
import { AppUpdateDialog } from "@/features/app-update/app-update-dialog";
import { cleanupAppUpdateCache } from "@/features/app-update/controller";
import { useStore } from "@/store";

/** 两次自动检查更新的最小间隔 */
const CHECK_UPDATE_INTERVAL = 1000 * 60 * 60 * 24 * 7;

function CheckAppUpdate() {
  // 安装包只在启动时清理：下发安装意图后立刻删会让系统安装器读不到文件。
  React.useEffect(cleanupAppUpdateCache, []);
  const { availableUpdate, hideUpdateDialog, hasUpdate } = useAppUpdateInfo();
  const {
    $checkAppUpdateTime,
    appUpdateDialogVisible,
    initialed,
    set$checkAppUpdateTime,
    setAppUpdateDialogVisible,
  } = useStore();

  React.useEffect(() => {
    if (
      __DEV__ ||
      process.env.EXPO_OS !== "android" ||
      !initialed ||
      !hasUpdate ||
      appUpdateDialogVisible
    ) {
      return;
    }
    if ($checkAppUpdateTime + CHECK_UPDATE_INTERVAL >= Date.now()) {
      return;
    }
    set$checkAppUpdateTime(Date.now());
    setAppUpdateDialogVisible(true);
  }, [
    $checkAppUpdateTime,
    appUpdateDialogVisible,
    hasUpdate,
    initialed,
    set$checkAppUpdateTime,
    setAppUpdateDialogVisible,
  ]);

  return (
    <AppUpdateDialog
      update={availableUpdate}
      visible={appUpdateDialogVisible}
      onClose={hideUpdateDialog}
    />
  );
}

export default CheckAppUpdate;
