import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { theme } from "@/constants/colors.tw";
import { LoadErrorText } from "@/components/LoadErrorText";

import type { PlayerErrorProps } from "./PlayerError.types";

export default function PlayerError(props: PlayerErrorProps) {
  const title = props.title ?? "视频加载失败";
  const description = props.description ?? "播放地址获取失败或播放器出错，请稍后重试";
  const actionLabel = props.actionLabel && props.onAction ? props.actionLabel : null;
  const showRetry = props.showRetry ?? true;

  return (
    <View className="absolute inset-0 items-center justify-center bg-media-background/80 px-8">
      {props.retrying ? (
        <ActivityIndicator size="large" colorClassName={theme.secondary.accent} />
      ) : (
        <>
          <Text className="text-lg font-bold text-media-content">{title}</Text>
          {showRetry && !props.retryLabel ? (
            <LoadErrorText
              message={description.replace(/，请(?:稍后)?重试$/, '')}
              className="mt-2 text-sm leading-6"
              colorClassName={theme.media.secondary}
              retryClassName={`${theme.media.content} underline`}
              onRetry={props.onRetry}
            />
          ) : (
            <Text className="mt-2 text-center text-sm leading-6 text-media-content/80">{description}</Text>
          )}
          {actionLabel || (showRetry && props.retryLabel) ? (
            <View className="mt-4 flex-row items-center gap-3">
              {actionLabel ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={actionLabel}
                  className={`rounded-full px-6 py-3 ${theme.primary.bg}`}
                  onPress={props.onAction}
                >
                  <Text className="font-bold text-media-content">{actionLabel}</Text>
                </Pressable>
              ) : null}
              {showRetry && props.retryLabel ? (
                <Pressable
                  accessibilityRole="button"
                  className={
                    actionLabel
                      ? "rounded-full border border-media-content/40 px-6 py-3"
                      : `rounded-full px-6 py-3 ${theme.primary.bg}`
                  }
                  onPress={props.onRetry}
                >
                  <Text className="font-bold text-media-content">{props.retryLabel}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}
