import { useNavigation } from "@react-navigation/native";
import { Avatar, Button, Skeleton, Text } from "@/components/styled/rneui";
import UpName from "@/components/UpName";
import { FlashList } from "@/components/styled/rneui";
import { clsx } from "clsx";
import React from "react";
import { TouchableOpacity, View } from "react-native";

import { type SearchedUpType, useSearchUps } from "@/api/search-up";
import { colors } from "@/constants/colors.tw";
import { useFollowActions } from "@/hooks/useFollowActions";
import { useFollowedUpsMap } from "@/store/derives";
import type { NavigationProps } from "@/types";
import { parseNumber } from "@/utils";
import type { FlashListRef } from "@/components/styled/rneui";

function SearchUpItem(props: { up: SearchedUpType }) {
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const actions = useFollowActions();
  const _followedUpsMap = useFollowedUpsMap();

  const isFollowed = props.up.mid in _followedUpsMap;
  return (
    <View className="mb-5 flex-1 flex-row items-center justify-between px-4">
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          const { mid, face, name, sign } = props.up;
          navigation.navigate("Dynamic", {
            user: {
              mid,
              face,
              name,
              sign,
            },
          });
        }}
        className="flex-1 flex-row items-center gap-4"
      >
        <Avatar rounded source={{ uri: props.up.face }} size={40} />
        <UpName
          mid={props.up.mid}
          numberOfLines={2}
          className={clsx(
            colors.primary.text,
            isFollowed && colors.secondary.text,
            "flex-1 text-base",
          )}
          ellipsizeMode="tail"
        >
          {props.up.name}
        </UpName>
      </TouchableOpacity>
      <Text className={`${colors.gray6.text} px-2 text-sm`}>{parseNumber(props.up.fans)}粉丝</Text>
      <Button
        size="sm"
        type="clear"
        disabled={isFollowed || actions.disabled}
        loading={actions.pendingMid === props.up.mid.toString()}
        onPress={() => {
          const user = {
            name: props.up.name,
            face: props.up.face,
            mid: props.up.mid,
            sign: props.up.sign,
          };
          void actions.follow(user);
        }}
        title={isFollowed ? "已关注" : actions.isPreparing ? "同步中" : "关注"}
      />
    </View>
  );
}

function EmptyContent(props: { loading: boolean }) {
  if (props.loading) {
    return (
      <View>
        {Array.from({ length: 20 }).map((_, i) => {
          return (
            <View className="mb-6 flex-row items-center justify-between gap-4 px-4" key={i}>
              <View className="flex-row items-center gap-4">
                <Skeleton animation="pulse" width={40} className="rounded-full" height={40} />
                <Skeleton animation="wave" width={100} height={20} />
                <Skeleton animation="wave" width={50} height={16} />
              </View>
              <Skeleton animation="wave" width={50} height={16} />
            </View>
          );
        })}
      </View>
    );
  }
  return <Text className="my-10 text-center">暂无结果</Text>;
}

function UpList(props: { keyword: string }) {
  const {
    data: searchedUps,
    isLoading,
    update,
    isReachingEnd,
    isValidating,
  } = useSearchUps(props.keyword);
  const listRef = React.useRef<FlashListRef<SearchedUpType> | null>(null);
  React.useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToOffset({ offset: 0 });
    }
  }, [props.keyword]);
  return (
    <FlashList
      data={searchedUps}
      ref={listRef}
      keyExtractor={(v: SearchedUpType) => `${v.mid}`}
      renderItem={({ item }: { item: SearchedUpType }) => {
        return <SearchUpItem up={item} />;
      }}
      persistentScrollbar
      ListEmptyComponent={<EmptyContent loading={isLoading} />}
      ListFooterComponent={
        isValidating ? (
          <Text className={`${colors.gray6.text} my-2 text-center text-xs`}>加载中~</Text>
        ) : searchedUps?.length && isReachingEnd ? (
          <Text className={`${colors.gray6.text} my-2 text-center text-xs`}>暂无更多</Text>
        ) : null
      }
      contentContainerClassName="px-1 pt-6"
      onEndReached={() => {
        update();
      }}
      onEndReachedThreshold={1}
    />
  );
}

export default UpList;
