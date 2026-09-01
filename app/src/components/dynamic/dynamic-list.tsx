import { ActivityIndicator, Pressable, View } from "react-native";

import { Button, FlashList, Skeleton, Text } from "@/components/styled/rneui";
import { colors } from "@/constants/colors.tw";

import { DynamicCard } from "./dynamic-card";
import type { DynamicListProps } from "./dynamic-list.types";

function DynamicListLoading(props: { text: string }) {
  return (
    <View className="flex-1 bg-neutral-100 dark:bg-black">
      <Text className={`px-4 py-3 text-center text-xs ${colors.gray6.text}`}>{props.text}</Text>
      <View className="gap-2">
        {[0, 1, 2].map((index) => (
          <View key={index} className="gap-3 bg-white p-4 dark:bg-neutral-950">
            <View className="flex-row items-center gap-3">
              <Skeleton animation="pulse" circle width={42} height={42} />
              <View className="flex-1 gap-2">
                <Skeleton animation="wave" width="35%" height={16} />
                <Skeleton animation="wave" width="50%" height={12} />
              </View>
            </View>
            <Skeleton animation="wave" width="92%" height={16} />
            <Skeleton animation="wave" width="68%" height={16} />
            <Skeleton animation="pulse" width="100%" height={190} />
          </View>
        ))}
      </View>
    </View>
  );
}

function DynamicListEmpty(props: Pick<DynamicListProps, "error" | "emptyTitle" | "emptyMessage" | "retry">) {
  return (
    <View className="items-center gap-3 px-8 py-24">
      <Text className="text-lg font-semibold">{props.error ? "动态加载失败" : props.emptyTitle}</Text>
      <Text selectable className={`text-center text-sm ${colors.gray6.text}`}>
        {props.error?.message || props.emptyMessage}
      </Text>
      {props.error ? (
        <Button
          title="重新加载"
          type="outline"
          onPress={() => {
            void props.retry();
          }}
        />
      ) : null}
    </View>
  );
}

export function DynamicList(props: DynamicListProps) {
  if (props.isLoading && !props.list.length) {
    return <DynamicListLoading text={props.loadingText} />;
  }

  return (
    <FlashList
      className="flex-1 bg-neutral-100 dark:bg-black"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="pb-6"
      data={props.list}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View className="mb-2">
          <DynamicCard item={item} onPress={() => props.onItemPress(item)} />
        </View>
      )}
      ListEmptyComponent={
        <DynamicListEmpty
          error={props.error}
          emptyTitle={props.emptyTitle}
          emptyMessage={props.emptyMessage}
          retry={props.retry}
        />
      }
      ListFooterComponent={
        props.list.length ? (
          <Pressable
            disabled={!props.error && (props.isLoadingMore || props.isReachingEnd)}
            onPress={
              props.error
                ? () => {
                    void props.retry();
                  }
                : undefined
            }
            className="items-center py-5"
          >
            {props.isLoadingMore ? (
              <ActivityIndicator colorClassName={colors.secondary.accent} />
            ) : (
              <Text className={`text-xs ${props.error ? colors.error.text : colors.gray6.text}`}>
                {props.error
                  ? "加载下一页失败，点击重试"
                  : props.isReachingEnd
                    ? "暂无更多"
                    : "上拉加载更多"}
              </Text>
            )}
          </Pressable>
        ) : null
      }
      refreshing={props.isRefreshing}
      onRefresh={() => {
        void props.refresh();
      }}
      onEndReached={() => {
        void props.loadMore();
      }}
      onEndReachedThreshold={0.7}
    />
  );
}
