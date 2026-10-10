import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { Alert } from "react-native";

import { useAppUpdateInfo } from "@/api/check-update";
import { serverUrl } from "@/constants";
import useResolvedColor from "@/hooks/useResolvedColor";
import { theme } from "@/constants/colors.tw";

import TextAction from "./TextAction";

export default Version;

function Version() {
  const updateHighlightColor = useResolvedColor(theme.secondary.text);
  const updateTime: string = Updates.createdAt
    ? `${Updates.createdAt.toLocaleDateString()} ${Updates.createdAt.toLocaleTimeString()}`
    : Constants.expoConfig?.extra?.buildTime;
  const {
    currentVersion,
    checkUpdate,
    loading: checkingUpdate,
    hasUpdate,
    showUpdateDialog,
  } = useAppUpdateInfo();
  const handleCheckUpdate = () => {
    if (hasUpdate) {
      showUpdateDialog();
    } else if (!checkingUpdate) {
      void checkUpdate();
    }
  };
  return (
    <TextAction
      text={`当前版本：${currentVersion}`}
      onTextLongPress={() => {
        Alert.alert(
          "版本信息",
          [
            `当前版本：${currentVersion} (${Constants.expoConfig?.extra?.gitHash || "-"})`,
            `更新时间：${updateTime || "-"}`,
            `版本频道：${Updates.channel} - ${Updates.runtimeVersion}`,
            Updates.updateId && `更新ID：${Updates.updateId}`,
            __DEV__ && `本地接口地址：${serverUrl}`,
          ]
            .filter(Boolean)
            .join("\n"),
        );
      }}
      buttons={
        process.env.EXPO_OS === "android"
          ? [
              {
                text: hasUpdate ? "APP有更新🎉" : "检查更新",
                loading: hasUpdate ? false : checkingUpdate,
                onPress: handleCheckUpdate,
                color: hasUpdate ? updateHighlightColor : undefined,
              },
            ]
          : []
      }
    />
  );
}
