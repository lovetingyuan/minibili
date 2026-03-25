import Constants from "expo-constants";
import * as Updates from "expo-updates";
import React from "react";
import { Alert } from "react-native";

import { useAppUpdateInfo } from "@/api/check-update";

import TextAction from "./TextAction";

export default Version;

function Version() {
  const updateTime: string = Updates.createdAt
    ? `${Updates.createdAt.toLocaleDateString()} ${Updates.createdAt.toLocaleTimeString()}`
    : Constants.expoConfig?.extra?.buildTime;
  const {
    currentVersion,
    checkUpdate,
    loading: checkingUpdate,
    hasUpdate,
    showAlert,
  } = useAppUpdateInfo();
  const handleCheckUpdate = () => {
    if (hasUpdate) {
      showAlert();
    } else if (!checkingUpdate) {
      checkUpdate();
    }
  };
  return (
    <TextAction
      text={`💡 当前版本：${currentVersion}`}
      onTextLongPress={() => {
        Alert.alert(
          "版本信息",
          [
            `当前版本：${currentVersion} (${Constants.expoConfig?.extra?.gitHash || "-"})`,
            `更新时间：${updateTime || "-"}`,
            `版本频道：${Updates.channel} - ${Updates.runtimeVersion}`,
            Updates.updateId && `更新ID：${Updates.updateId}`,
          ]
            .filter(Boolean)
            .join("\n"),
        );
      }}
      buttons={[
        {
          text: hasUpdate ? "APP有更新🎉" : "检查更新",
          loading: hasUpdate ? false : checkingUpdate,
          onPress: handleCheckUpdate,
          color: hasUpdate ? "#FF6699" : undefined,
        },
      ]}
    />
  );
}
