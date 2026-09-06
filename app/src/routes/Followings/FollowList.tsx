import type { HeaderSearchBarRef } from "@react-navigation/elements";
import { Text } from "@/components/styled/rneui";
import React from "react";
import { FlatList, Image, useWindowDimensions, View } from "react-native";

import { orderFollowedUps } from "@/features/bilibili-followings/order-followings";
import { useFollowingsState } from "@/features/bilibili-followings/useFollowingsState";
import { useUserSettings } from "@/features/user-data/useUserSettings";
import { useUpUpdateCount } from "@/store/derives";
import { useActiveFollowedUps } from "@/store/followings";

import { useStore } from "../../store";
import type { UpInfo } from "../../types";
import UpList from "./UpList";
import FollowItem from "./FollowItem";
import useFollowListHeader from "./FollowListHeader";

const tvL = require("../../../assets/tv-l.png");
const tvR = require("../../../assets/tv-r.png");

function TvImg() {
  const [tvImg, setTvImg] = React.useState(false);
  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setTvImg((v) => !v);
    }, 700);
    return () => {
      if (timer) {
        window.clearInterval(timer);
      }
    };
  }, []);

  return (
    <Image source={tvImg ? tvL : tvR} className="mt-12 aspect-square h-auto w-35 self-center" />
  );
}
function FollowList() {
  if (__DEV__) {
    // oxlint-disable-next-line no-console
    console.log("Follow page");
  }
  const [searchKeyword, setSearchKeyword] = React.useState("");
  const { $upUpdateMap, livingUps, requestDynamicFailed } = useStore();
  const $followedUps = useActiveFollowedUps();
  const { values } = useUserSettings();
  const { isValidating, mutate } = useFollowingsState();
  const _updatedCount = useUpUpdateCount();
  const followListRef = React.useRef<FlatList | null>(null);
  const searchBarRef = React.useRef<HeaderSearchBarRef | null>(null);

  function changeSearchText(text: string) {
    if (!text.trim()) {
      setSearchKeyword("");
    }
  }

  function submitSearch(text: string) {
    const keyword = text.trim();
    if (!keyword) {
      return;
    }
    setSearchKeyword(keyword);
  }

  function cancelSearch() {
    setSearchKeyword("");
  }

  const { width } = useWindowDimensions();
  const columns = Math.floor(width / 90);
  const count = $followedUps.length;
  const failed = Date.now() - requestDynamicFailed < 60 * 60 * 1000;
  const followSummary = `关注的UP${
    count
      ? _updatedCount
        ? ` (${_updatedCount}/${count}${failed ? "！" : ""})`
        : ` (${count}${failed ? "！" : ""})`
      : ""
  }`;
  useFollowListHeader({
    title: followSummary,
    onChangeText: changeSearchText,
    onClose: cancelSearch,
    onSubmit: submitSearch,
    searchActive: Boolean(searchKeyword),
    searchBarRef,
  });

  const renderItem = ({ item, index }: { item: UpInfo | null; index: number }) => {
    if (item) {
      return <FollowItem item={item} index={index} />;
    }
    return <View className="flex-1" />;
  };

  const followedUpListLen = $followedUps.length;
  const rest = followedUpListLen
    ? columns - (followedUpListLen ? followedUpListLen % columns : 0)
    : 0;
  const orderedUps = orderFollowedUps($followedUps, values.$pinnedUpIds, livingUps, $upUpdateMap);

  return (
    <View className="flex-1">
      {searchKeyword ? (
        <UpList keyword={searchKeyword} />
      ) : (
        <FlatList
          refreshing={isValidating}
          onRefresh={() => {
            void mutate().catch(() => {});
          }}
          data={[...orderedUps, ...(rest ? Array.from({ length: rest }).map(() => null) : [])]}
          renderItem={renderItem}
          keyExtractor={(item, index) => (item ? `${item.mid}` : `${index}`)}
          onEndReachedThreshold={1}
          persistentScrollbar
          key={columns} // FlatList不支持直接更改columns
          numColumns={columns}
          ref={followListRef}
          contentContainerClassName="pt-6"
          columnWrapperClassName="px-3"
          ListEmptyComponent={
            <View>
              <TvImg />
              <Text className="my-10 text-center text-base">
                暂无关注，请搜索你感兴趣的UP主添加
              </Text>
            </View>
          }
          ListFooterComponent={
            $followedUps.length ? (
              <Text className="pb-3 text-center text-xs text-gray-500">到底了~</Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

export default FollowList;
