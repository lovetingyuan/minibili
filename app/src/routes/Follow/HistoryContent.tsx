import React from "react";
import { ActivityIndicator, View } from "react-native";

import { useBilibiliHistory } from "@/api/useBilibiliHistory";
import { Button, FlashList, Icon, Text } from "@/components/styled/rneui";
import VideoListItem from "@/components/VideoItem";
import { colors } from "@/constants/colors.tw";
import { formatWatchTime } from "@/utils/watch-time";

export default function HistoryContent() {
  const history = useBilibiliHistory();
  const retry = () => {
    void history.retry().catch(() => {});
  };
  const loadMore = () => {
    void history.loadMore().catch(() => {});
  };
  return (
    <FlashList
      data={history.items}
      keyExtractor={(item) => item.key}
      renderItem={({ item }) =>
        item.video ? (
          <VideoListItem video={item.video} watchedAt={item.watchedAt} />
        ) : (
          <View className={`mx-3 my-2 gap-2 rounded-lg p-4 ${colors.gray1.bg}`}>
            <Text className={colors.gray7.text} numberOfLines={2}>
              {item.title}
            </Text>
            <Text className={`text-sm ${colors.gray6.text}`}>该视频暂不支持播放或已失效</Text>
            <Text className={`text-xs ${colors.gray6.text}`}>
              {formatWatchTime(item.watchedAt)}
            </Text>
          </View>
        )
      }
      refreshing={history.refreshing}
      onRefresh={() => {
        void history.refresh().catch(() => {});
      }}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      contentContainerClassName={history.items.length ? "pt-2 pb-4" : "grow px-4 py-4"}
      ListEmptyComponent={
        <View className="items-center justify-center gap-4 px-6 py-16">
          {history.isLoading ? (
            <>
              <ActivityIndicator />
              <Text>正在加载 B站观看历史</Text>
            </>
          ) : history.error ? (
            <>
              <Text className="text-center">观看历史加载失败，请检查网络或登录状态后重试</Text>
              <Button
                title="重试"
                loading={history.isValidating || history.refreshing}
                onPress={retry}
              />
            </>
          ) : (
            <>
              <Icon name="history" size={36} colorClassName={colors.gray5.accent} />
              <Text className={colors.gray6.text}>
                {history.hasMore ? "当前已加载记录中暂无视频" : "暂无 B站视频观看历史"}
              </Text>
              {history.hasMore ? (
                <Button title="继续加载" loading={history.isLoadingMore} onPress={loadMore} />
              ) : null}
            </>
          )}
        </View>
      }
      ListFooterComponent={
        history.items.length > 0 ? (
          history.error ? (
            <View className="items-center gap-2 py-4">
              <Text className={`text-sm ${colors.gray6.text}`}>加载失败，已保留当前内容</Text>
              <Button
                title="重试"
                type="clear"
                loading={history.isValidating || history.refreshing}
                onPress={retry}
              />
            </View>
          ) : history.isLoadingMore ? (
            <ActivityIndicator className="my-4" />
          ) : !history.hasMore ? (
            <Text className={`py-4 text-center text-xs ${colors.gray6.text}`}>暂无更多</Text>
          ) : null
        ) : null
      }
    />
  );
}
