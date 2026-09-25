import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { theme } from "@/constants/theme";

type PlayerErrorProps = {
  retrying: boolean;
  onRetry: () => void;
  /**
   * 覆盖默认的「视频加载失败」文案。付费/会员/充电等受限内容会用到，
   * 也用于试看、互动片段播完后的提示。
   */
  title?: string;
  description?: string;
  /** 重试按钮文案，默认「重试」 */
  retryLabel?: string;
  /** 受限内容的主操作，例如「在 B站 打开」；有值时展示在重试按钮上方 */
  actionLabel?: string;
  onAction?: () => void;
};

export default function PlayerError(props: PlayerErrorProps) {
  const title = props.title ?? "视频加载失败";
  const description = props.description ?? "播放地址获取失败或播放器出错，请稍后重试";
  const actionLabel = props.actionLabel && props.onAction ? props.actionLabel : null;

  return (
    <View className="absolute inset-0 items-center justify-center bg-black/80 px-8">
      {props.retrying ? (
        <ActivityIndicator size="large" colorClassName={theme.secondary.accent} />
      ) : (
        <>
          <Text className="text-lg font-bold text-white">{title}</Text>
          <Text className="mt-2 text-center text-sm leading-6 text-white/80">{description}</Text>
          <View className="mt-4 flex-row items-center gap-3">
            {actionLabel ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={actionLabel}
                className={`rounded-full px-6 py-3 ${theme.primary.bg}`}
                onPress={props.onAction}
              >
                <Text className="font-bold text-white">{actionLabel}</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              className={
                actionLabel
                  ? "rounded-full border border-white/40 px-6 py-3"
                  : `rounded-full px-6 py-3 ${theme.primary.bg}`
              }
              onPress={props.onRetry}
            >
              <Text className="font-bold text-white">{props.retryLabel ?? "重试"}</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}
