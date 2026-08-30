import React from "react";
import { ActivityIndicator, RefreshControl, ScrollView, View } from "react-native";

import {
  useBilibiliFavoriteFolders,
  useBilibiliFavoriteResources,
} from "@/api/useBilibiliFavorites";
import { Button, FlashList, Icon, Text } from "@/components/styled/rneui";
import VideoListItem from "@/components/VideoItem";
import { colors } from "@/constants/colors.tw";
import FavoriteFolderTabs from "./FavoriteFolderTabs";

export default function FavoritesContent() {
  const folders = useBilibiliFavoriteFolders();
  const [selectedId, setSelectedId] = React.useState<number>();
  const [refreshing, setRefreshing] = React.useState(false);
  const refreshingRef = React.useRef(false);
  const folderList = folders.data?.list ?? [];
  const folder = folderList.find((item) => item.id === selectedId) ?? folderList[0];
  const resources = useBilibiliFavoriteResources(folder?.id);

  React.useEffect(() => {
    setSelectedId(folder?.id);
  }, [folder?.id]);

  async function refresh() {
    if (refreshingRef.current) {
      return;
    }
    refreshingRef.current = true;
    setRefreshing(true);
    try {
      await Promise.allSettled([folders.mutate(), resources.refresh()]);
    } finally {
      refreshingRef.current = false;
      setRefreshing(false);
    }
  }

  if (!folders.data) {
    return (
      <View className="flex-1 items-center justify-center gap-4 px-8">
        {folders.error ? (
          <>
            <Text className="text-center">收藏夹加载失败，请检查网络或登录状态后重试</Text>
            <Button
              title="重试"
              loading={folders.isValidating}
              onPress={() => {
                void folders.mutate().catch(() => {});
              }}
            />
          </>
        ) : (
          <>
            <ActivityIndicator />
            <Text>正在加载 B站收藏夹</Text>
          </>
        )}
      </View>
    );
  }

  return (
    <View className="flex-1">
      {folders.error ? (
        <View className="flex-row items-center justify-center gap-2 px-3 py-2">
          <Text className="shrink text-xs">收藏夹刷新失败，正在显示上次数据</Text>
          <Button
            title="重试"
            type="clear"
            size="sm"
            loading={folders.isValidating}
            onPress={() => {
              void folders.mutate().catch(() => {});
            }}
          />
        </View>
      ) : null}
      {folder ? (
        <>
          <FavoriteFolderTabs
            folders={folderList}
            selectedId={folder.id}
            onSelect={setSelectedId}
            disabled={refreshing}
          />
          <FlashList
            key={folder.id}
            data={resources.items}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) =>
              item.video ? (
                <VideoListItem video={item.video} />
              ) : (
                <View className={`mx-3 my-2 gap-2 rounded-lg p-4 ${colors.gray1.bg}`}>
                  <Text className={colors.gray7.text} numberOfLines={2}>
                    {item.title || "不可用的收藏内容"}
                  </Text>
                  <Text className={`text-sm ${colors.gray6.text}`}>
                    该收藏内容暂不支持播放或已失效
                  </Text>
                </View>
              )
            }
            refreshing={refreshing}
            onRefresh={() => {
              void refresh();
            }}
            onEndReached={() => {
              void resources.loadMore().catch(() => {});
            }}
            onEndReachedThreshold={0.5}
            contentContainerClassName={resources.items.length ? "pt-2 pb-4" : "grow px-4 py-4"}
            ListEmptyComponent={
              <View className="items-center justify-center gap-4 px-6 py-16">
                {resources.isLoading ? (
                  <ActivityIndicator />
                ) : resources.error ? (
                  <>
                    <Text className="text-center">
                      收藏内容加载失败，请检查网络或登录状态后重试
                    </Text>
                    <Button
                      title="重试"
                      loading={resources.isValidating}
                      onPress={() => {
                        void resources.mutate().catch(() => {});
                      }}
                    />
                  </>
                ) : (
                  <>
                    <Icon name="star-outline" size={36} colorClassName={colors.gray5.accent} />
                    <Text className={colors.gray6.text}>这个收藏夹暂无内容</Text>
                  </>
                )}
              </View>
            }
            ListFooterComponent={
              resources.error && resources.items.length ? (
                <View className="items-center gap-2 py-4">
                  <Text className={`text-sm ${colors.gray6.text}`}>加载失败，已保留当前内容</Text>
                  <Button
                    title="重试"
                    type="clear"
                    loading={resources.isValidating}
                    onPress={() => {
                      void resources.mutate().catch(() => {});
                    }}
                  />
                </View>
              ) : resources.isLoadingMore && resources.items.length ? (
                <ActivityIndicator className="my-4" />
              ) : resources.items.length && !resources.hasMore ? (
                <Text className={`py-4 text-center text-xs ${colors.gray6.text}`}>暂无更多</Text>
              ) : null
            }
          />
        </>
      ) : (
        <ScrollView
          contentContainerClassName="grow items-center justify-center gap-4 px-8 pb-16"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                void refresh();
              }}
            />
          }
        >
          <Icon name="star-outline" size={40} colorClassName={colors.gray5.accent} />
          <Text className={colors.gray6.text}>暂无 B站收藏夹</Text>
          <Button
            title="刷新"
            type="clear"
            loading={refreshing}
            onPress={() => {
              void refresh();
            }}
          />
        </ScrollView>
      )}
    </View>
  );
}
