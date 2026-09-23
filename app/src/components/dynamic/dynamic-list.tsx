import { useNavigation } from '@react-navigation/native';
import React from 'react';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import type { DynamicItem } from '@/api/dynamic-items.type';
import { Button, FlashList, Skeleton, Text } from '@/components/styled/rneui';
import type { FlashListRef } from '@/components/styled/rneui';
import { theme } from "@/constants/theme";
import type { MainTabNavigationProp } from '@/types';

import { DynamicCard } from './dynamic-card';
import type { DynamicListProps } from './dynamic-list.types';

function DynamicListLoading(props: { listHeader?: ReactNode }) {
  return (
    <View className={`flex-1 ${theme.background.page}`}>
      {props.listHeader}
      <View className="gap-3">
        {[0, 1, 2].map((index) => (
          <View key={index} className="gap-3 bg-white p-4 dark:bg-slate-950">
            <View className="flex-row items-center gap-3">
              <Skeleton animation="pulse" circle width={36} height={36} />
              <View className="flex-1 flex-row items-center justify-between gap-3">
                <Skeleton animation="wave" width="35%" height={16} />
                <Skeleton animation="wave" width={72} height={12} />
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

function DynamicListEmpty(
  props: Pick<DynamicListProps, 'error' | 'errorTitle' | 'emptyTitle' | 'emptyMessage' | 'retry'>,
) {
  return (
    <View className="items-center gap-3 px-8 py-24">
      <Text className="text-lg font-semibold">
        {props.error ? (props.errorTitle ?? '动态加载失败') : props.emptyTitle}
      </Text>
      <Text selectable className={`text-center text-sm ${theme.text.muted}`}>
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
  const navigation = useNavigation<MainTabNavigationProp>();
  const listRef = React.useRef<FlashListRef<DynamicItem> | null>(null);
  const pendingScrollTopRef = React.useRef(false);
  const { onTabReselect } = props;

  React.useEffect(() => {
    if (!onTabReselect) {
      return;
    }

    return navigation.addListener('tabPress', () => {
      if (!navigation.isFocused()) {
        return;
      }
      // 刷新会替换整个列表，等新列表渲染出来后再滚动，否则滚动位置会被新数据覆盖
      pendingScrollTopRef.current = true;
      onTabReselect();
    });
  }, [navigation, onTabReselect]);

  React.useEffect(() => {
    if (!pendingScrollTopRef.current || props.isRefreshing) {
      return;
    }
    pendingScrollTopRef.current = false;
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [props.isRefreshing]);

  if (props.isLoading && !props.list.length) {
    return <DynamicListLoading listHeader={props.listHeader} />;
  }

  return (
    <FlashList
      ref={listRef}
      className={`flex-1 ${theme.background.page}`}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="pb-6"
      data={props.list}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View className="mb-3">
          <DynamicCard
            item={item}
            showActions={props.showActions}
            onPress={() => props.onItemPress(item)}
          />
        </View>
      )}
      ListHeaderComponent={props.listHeader == null ? null : <>{props.listHeader}</>}
      ListEmptyComponent={
        <DynamicListEmpty
          error={props.error}
          errorTitle={props.errorTitle}
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
              <ActivityIndicator colorClassName={theme.secondary.accent} />
            ) : (
              <Text className={`text-xs ${props.error ? theme.error.text : theme.text.muted}`}>
                {props.error ? '加载下一页失败，点击重试' : props.isReachingEnd ? '暂无更多' : '上拉加载更多'}
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
