import { useNavigation } from "@react-navigation/native";
import { Avatar, Button, Skeleton, Text } from "@/components/styled/rneui";
import UpName from "@/components/UpName";
import { FlashList } from "@/components/styled/rneui";
import { clsx } from "clsx";
import React from "react";
import { Keyboard, Platform, TouchableOpacity, View } from "react-native";
import type { EmitterSubscription } from "react-native";

import { useSearchUps } from "@/api/search-up";
import { colors } from "@/constants/colors.tw";
import {
  buildUpSearchItems,
  type UpSearchItem,
} from "@/features/bilibili-followings/merge-up-search-results";
import { useFollowActions } from "@/hooks/useFollowActions";
import { useFollowedUpsMap } from "@/store/derives";
import { useActiveFollowedUps } from "@/store/followings";
import type { NavigationProps } from "@/types";
import { getImagePixelSize, parseImgUrl, parseNumber } from "@/utils";
import type { FlashListRef } from "@/components/styled/rneui";

const EMPTY_LIST_BOTTOM_SPACING = 16;
/** 首次搜索时的骨架屏行数 */
const INITIAL_SKELETON_ROWS = 20;
/** 加载更多时列表底部补的骨架屏行数 */
const FOOTER_SKELETON_ROWS = 3;

function useKeyboardInset() {
  const [keyboardInset, setKeyboardInset] = React.useState(() => {
    if (Platform.OS !== "android") {
      return 0;
    }
    return Keyboard.metrics()?.height ?? 0;
  });

  React.useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    const subscriptions: EmitterSubscription[] = [
      Keyboard.addListener("keyboardDidShow", (event) => {
        setKeyboardInset(event.endCoordinates.height);
      }),
      Keyboard.addListener("keyboardDidHide", () => {
        setKeyboardInset(0);
      }),
    ];

    return () => {
      subscriptions.forEach((subscription) => {
        subscription.remove();
      });
    };
  }, []);

  return keyboardInset;
}

function SearchUpItem(props: { up: UpSearchItem }) {
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
        <Avatar
          rounded
          source={{ uri: parseImgUrl(props.up.face, getImagePixelSize(40)) }}
          size={40}
        />
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
      {typeof props.up.fans === "number" ? (
        <Text className={`${colors.gray6.text} px-2 text-sm`}>
          {parseNumber(props.up.fans)}粉丝
        </Text>
      ) : null}
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

function SkeletonRow(props: { index: number }) {
  return (
    <View className="mb-6 flex-row items-center justify-between gap-4 px-4" key={props.index}>
      <View className="flex-row items-center gap-4">
        <Skeleton animation="pulse" width={40} className="rounded-full" height={40} />
        <Skeleton animation="wave" width={100} height={20} />
        <Skeleton animation="wave" width={50} height={16} />
      </View>
      <Skeleton animation="wave" width={50} height={16} />
    </View>
  );
}

function SkeletonRows(props: { count: number }) {
  return (
    <View>
      {Array.from({ length: props.count }).map((_, i) => {
        return <SkeletonRow key={i} index={i} />;
      })}
    </View>
  );
}

function EmptyContent(props: { loading: boolean; keyword: string }) {
  if (props.loading) {
    return <SkeletonRows count={INITIAL_SKELETON_ROWS} />;
  }
  if (!props.keyword) {
    return <Text className="my-10 text-center">输入UP主名称开始搜索</Text>;
  }
  return <Text className="my-10 text-center">暂无结果</Text>;
}

function UpList(props: { keyword: string }) {
  const keyword = props.keyword.trim();
  const {
    data: searchedUps,
    isLoading,
    update,
    isReachingEnd,
    isValidating,
  } = useSearchUps(keyword);
  const followedUps = useActiveFollowedUps();
  const items = buildUpSearchItems(keyword, followedUps, searchedUps);
  const listRef = React.useRef<FlashListRef<UpSearchItem> | null>(null);
  const keyboardInset = useKeyboardInset();

  React.useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToOffset({ offset: 0 });
    }
  }, [keyword]);

  return (
    <FlashList
      data={items}
      ref={listRef}
      keyExtractor={(v: UpSearchItem) => `${v.mid}`}
      renderItem={({ item }: { item: UpSearchItem }) => {
        return <SearchUpItem up={item} />;
      }}
      persistentScrollbar
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
      ListEmptyComponent={<EmptyContent loading={isLoading} keyword={keyword} />}
      ListFooterComponent={
        items.length && isValidating ? (
          <SkeletonRows count={FOOTER_SKELETON_ROWS} />
        ) : items.length && isReachingEnd ? (
          <Text className={`${colors.gray6.text} my-2 text-center text-xs`}>暂无更多</Text>
        ) : null
      }
      contentContainerStyle={{
        paddingBottom: EMPTY_LIST_BOTTOM_SPACING + (Platform.OS === "android" ? keyboardInset : 0),
      }}
      contentContainerClassName="px-1 pt-6"
      onEndReached={() => {
        update();
      }}
      onEndReachedThreshold={1}
    />
  );
}

export default UpList;
