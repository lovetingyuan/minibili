import React from "react";
import { Clock } from "lucide-react-native";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";

import { useBilibiliWatchLater } from "@/api/useWatchLater";
import type { WatchLaterListItem } from "@/api/watch-later.types";
import { Button, FlashList, Text } from "@/components/styled/rneui";
import { ThemedIcon } from "@/components/ThemedIcon";
import VideoListItem from "@/components/VideoItem";
import { theme } from "@/constants/theme";
import { useWatchLaterActions } from "@/hooks/useWatchLaterActions";
import { useStore } from "@/store";

export default function WatchLaterContent() {
  const watchLater = useBilibiliWatchLater();
  const watchLaterActions = useWatchLaterActions();
  const { setOverlayButtons } = useStore();
  const [refreshing, setRefreshing] = React.useState(false);
  const refreshingRef = React.useRef(false);

  function buttons(item: WatchLaterListItem) {
    return [
      {
        text: "从稍后再看移除",
        onPress: () => {
          void watchLaterActions.toggle({ aid: item.aid });
        },
      },
    ];
  }

  function retry() {
    void watchLater.mutate().catch(() => {});
  }

  async function refresh() {
    if (refreshingRef.current) {
      return;
    }
    refreshingRef.current = true;
    setRefreshing(true);
    try {
      await watchLater.mutate();
    } finally {
      refreshingRef.current = false;
      setRefreshing(false);
    }
  }

  return (
    <FlashList
      data={watchLater.items}
      keyExtractor={(item) => item.key}
      renderItem={({ item }) =>
        item.video ? (
          <VideoListItem
            video={item.video}
            playCountOnCover
            progressRatio={item.progressRatio}
            buttons={() => buttons(item)}
          />
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            onLongPress={() => setOverlayButtons(buttons(item))}
            accessibilityHint="长按打开稍后再看操作菜单"
            className={`mx-3 my-2 gap-2 rounded-lg p-4 ${theme.background.fill.bg}`}
          >
            <Text className={theme.text.secondary} numberOfLines={2}>
              {item.title}
            </Text>
            <Text className={`text-sm ${theme.text.muted}`}>该视频暂不支持播放或已失效</Text>
            <Text className={`text-xs ${theme.text.muted}`}>长按可从稍后再看移除</Text>
          </TouchableOpacity>
        )
      }
      refreshing={refreshing}
      onRefresh={() => {
        void refresh();
      }}
      contentContainerClassName={watchLater.items.length ? "pt-2 pb-4" : "grow px-4 py-4"}
      ListEmptyComponent={
        <View className="items-center justify-center gap-4 px-6 py-16">
          {watchLater.isLoading ? (
            <>
              <ActivityIndicator />
              <Text>正在加载 B站稍后再看</Text>
            </>
          ) : watchLater.error ? (
            <>
              <Text className="text-center">稍后再看加载失败，请检查网络或登录状态后重试</Text>
              <Button
                title="重试"
                loading={watchLater.isValidating || refreshing}
                onPress={retry}
              />
            </>
          ) : (
            <>
              <ThemedIcon icon={Clock} size={36} colorClassName={theme.icon.disabled} />
              <Text className={theme.text.muted}>暂无稍后再看视频</Text>
            </>
          )}
        </View>
      }
      ListFooterComponent={
        watchLater.items.length ? (
          watchLater.error ? (
            <View className="items-center gap-2 py-4">
              <Text className={`text-sm ${theme.text.muted}`}>加载失败，已保留当前内容</Text>
              <Button
                title="重试"
                type="clear"
                loading={watchLater.isValidating || refreshing}
                onPress={retry}
              />
            </View>
          ) : (
            <Text className={`py-4 text-center text-xs ${theme.text.muted}`}>暂无更多</Text>
          )
        ) : null
      }
    />
  );
}
