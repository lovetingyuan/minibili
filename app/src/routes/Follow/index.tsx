import { Text } from "@/components/styled/rneui";
import React from "react";
import { FlatList, Image, ImageBackground, useColorScheme, useWindowDimensions, View } from "react-native";

import useUpdateNavigationOptions from "@/hooks/useUpdateNavigationOptions";
import { useUpUpdateCount } from "@/store/derives";

import { useStore } from "../../store";
import type { UpInfo } from "../../types";
import FollowItem from "./FollowItem";

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
    <Image source={tvImg ? tvL : tvR} className="mt-12 aspect-square h-auto w-[50%] self-center" />
  );
}
function FollowList() {
  if (__DEV__) {
    // oxlint-disable-next-line no-console
    console.log("Follow page");
  }
  const { $followedUps, $upUpdateMap, livingUps, requestDynamicFailed } = useStore();
  const _updatedCount = useUpUpdateCount();
  const followListRef = React.useRef<FlatList | null>(null);
  const dark = useColorScheme() === "dark";

  const { width } = useWindowDimensions();
  const columns = Math.floor(width / 90);
  const count = $followedUps.length;
  const failed = Date.now() - requestDynamicFailed < 60 * 60 * 1000;
  const headerTitle = `关注的UP${
    count
      ? _updatedCount
        ? ` (${_updatedCount}/${count}${failed ? "！" : ""})`
        : ` (${count}${failed ? "！" : ""})`
      : ""
  }`;
  useUpdateNavigationOptions({
    headerTitle,
  });

  const renderItem = ({
    item,
    index,
  }: {
    item: UpInfo | null;
    index: number;
  }) => {
    if (item) {
      return <FollowItem item={item} index={index} />;
    }
    return <View className="flex-1" />;
  };

  const followedUpListLen = $followedUps.length;
  const rest = followedUpListLen ? columns - (followedUpListLen ? followedUpListLen % columns : 0) : 0;
  const pinUps: UpInfo[] = [];
  const liveUps: UpInfo[] = [];
  const updateUps: UpInfo[] = [];
  const otherUps: UpInfo[] = [];

  for (const up of $followedUps) {
    if (up.pin) {
      pinUps.push({ ...up });
    } else if (livingUps[up.mid]) {
      liveUps.push({ ...up });
    } else if (
      up.mid in $upUpdateMap &&
      $upUpdateMap[up.mid].latestId !== $upUpdateMap[up.mid].currentLatestId
    ) {
      updateUps.push({ ...up });
    } else {
      otherUps.push({ ...up });
    }
  }

  const content = (
    <View className="flex-1">
      <FlatList
        data={[
          ...pinUps.sort((a, b) => b.pin! - a.pin!),
          ...liveUps,
          ...updateUps,
          ...otherUps,
          ...(rest ? Array.from({ length: rest }).map(() => null) : []),
        ]}
        renderItem={renderItem}
        keyExtractor={(item, index) => (item ? `${item.mid}` : `${index}`)}
        onEndReachedThreshold={1}
        persistentScrollbar
        key={columns} // FlatList不支持直接更改columns
        numColumns={columns}
        ref={followListRef}
        columnWrapperClassName="px-3"
        contentContainerClassName="pt-8"
        ListEmptyComponent={
          <View>
            <TvImg />
            <Text className="my-10 text-center text-lg">暂无关注，请搜索你感兴趣的UP主添加</Text>
          </View>
        }
        ListFooterComponent={
          $followedUps.length ? <Text className="pb-3 text-center text-xs text-gray-500">到底了~</Text> : null
        }
      />
    </View>
  );

  return (
    <View className="flex-1 flex-col">
      {dark ? (
        content
      ) : (
        <ImageBackground
          source={require("../../../assets/bg.webp")}
          resizeMode="cover"
          className="flex-1 justify-center"
        >
          {content}
        </ImageBackground>
      )}
    </View>
  );
}

export default FollowList;
