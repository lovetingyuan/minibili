import { StatusBar } from "expo-status-bar";
import * as Updates from "expo-updates";
import { CircleAlert } from "lucide-react-native";
import { Button, Text, View } from "react-native";

import { useAppUpdateInfo } from "@/api/check-update";
import { ThemedIcon } from "@/components/ThemedIcon";
import { theme } from "@/constants/theme";
import { startAppUpdateDownload } from "@/features/app-update/controller";

export default function ErrorFallback(props: { error: Error; resetError: Function }) {
  const { availableUpdate, loading } = useAppUpdateInfo();

  if (__DEV__) {
    // oxlint-disable-next-line no-console
    console.error(props.error);
  }
  return (
    <View className="flex-1 dark:bg-slate-900">
      <StatusBar style="auto" />
      <View
        accessible
        accessibilityLabel="应用发生错误"
        accessibilityRole="image"
        className="h-64 items-center justify-center"
      >
        <ThemedIcon icon={CircleAlert} size={112} colorClassName={theme.error.accent} />
      </View>
      <Text className="mx-7 text-base text-red-600">
        非常抱歉，应用发生了未知错误
        {"\n\n"}
        <Text className="text-xs italic">{props.error.message || "😔"}</Text>
        {"\n\n"}
        我们会处理这个错误，感谢您的理解和支持
        {"\n\n"}
        您可以
        <Text
          className={`font-bold ${theme.primary.text}`}
          onPress={() => {
            Updates.reloadAsync();
          }}
        >
          {" 重启应用 "}
        </Text>
        {availableUpdate ? "，我们推荐您安装新版" : "。"}
      </Text>
      {process.env.EXPO_OS === "android" ? (
        <View className="my-8 px-8">
          <Button
            disabled={!availableUpdate}
            title={
              loading ? "正在检查新版本…" : availableUpdate ? "下载最新版本" : "暂无可下载新版本"
            }
            onPress={() => {
              if (!availableUpdate) {
                return;
              }
              startAppUpdateDownload({
                downloadUrl: availableUpdate.downloadLink,
                releaseName: availableUpdate.release.version,
                version: availableUpdate.latestVersion,
              });
            }}
          />
        </View>
      ) : null}
    </View>
  );
}
