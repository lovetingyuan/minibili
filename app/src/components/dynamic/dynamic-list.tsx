import { useNavigation } from '@react-navigation/native';
import React from 'react';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import type { DynamicItem } from '@/api/dynamic-items.type';
import { Button, FlashList, Skeleton, Text } from '@/components/styled/rneui';
import type { FlashListRef } from '@/components/styled/rneui';
import { colors } from '@/constants/colors.tw';
import type { MainTabNavigationProp } from '@/types';

import { DynamicCard } from './dynamic-card';
import type { DynamicListProps } from './dynamic-list.types';

function DynamicListLoading(props: { text: string; listHeader?: ReactNode }) {
  return (
    <View className="flex-1 bg-neutral-100 dark:bg-black">
      {props.listHeader}
      <Text className={`px-4 ${props.listHeader ? 'pb-3' : 'py-3'} text-center text-xs ${colors.gray6.text}`}>
        {props.text}
      </Text>
      <View className="gap-3">
        {[0, 1, 2].map((index) => (
          <View key={index} className="gap-3 bg-white p-4 dark:bg-neutral-950">
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

function DynamicListEmpty(props: Pick<DynamicListProps, 'error' | 'emptyTitle' | 'emptyMessage' | 'retry'>) {
  return (
    <View className="items-center gap-3 px-8 py-24">
      <Text className="text-lg font-semibold">{props.error ? '动态加载失败' : props.emptyTitle}</Text>
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
  const navigation = useNavigation<MainTabNavigationProp>();
  const listRef = React.useRef<FlashListRef<DynamicItem> | null>(null);
  const pendingScrollTopRef = React.useRef(false);

  React.useEffect(() => {
    if (!props.onTabReselect) {
      return;
    }

    return navigation.addListener('tabPress', () => {
      if (!navigation.isFocused()) {
        return;
      }
      // 刷新会替换整个列表，等新列表渲染出来后再滚动，否则滚动位置会被新数据覆盖
      pendingScrollTopRef.current = true;
      props.onTabReselect?.();
    });
  }, [navigation, props.onTabReselect]);

  React.useEffect(() => {
    if (!pendingScrollTopRef.current || props.isRefreshing) {
      return;
    }
    pendingScrollTopRef.current = false;
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [props.isRefreshing]);

  if (props.isLoading && !props.list.length) {
    return <DynamicListLoading text={props.loadingText} listHeader={props.listHeader} />;
  }

  return (
    <FlashList
      ref={listRef}
      className="flex-1 bg-neutral-100 dark:bg-black"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="pb-6"
      data={props.list}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View className="mb-3">
          <DynamicCard item={item} onPress={() => props.onItemPress(item)} />
        </View>
      )}
      ListHeaderComponent={props.listHeader == null ? null : <>{props.listHeader}</>}
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
