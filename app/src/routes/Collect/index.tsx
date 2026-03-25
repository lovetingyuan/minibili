import { FlashList, Icon, Text } from "@/components/styled/rneui";
import React from "react";
import { Alert, Linking, View } from "react-native";

import VideoListItem from "@/components/VideoItem";
import { colors } from "@/constants/colors.tw";
import useResolvedColor from "@/hooks/useResolvedColor";
import useUpdateNavigationOptions from "@/hooks/useUpdateNavigationOptions";
import { useStore } from "@/store";
import type { CollectVideoInfo } from "@/types";

function EmptyCollectContent() {
  return (
    <View className="flex-1 items-center justify-center px-8 pb-16">
      <View
        className={`${colors.gray2.bg} mb-4 h-16 w-16 items-center justify-center rounded-full`}
      >
        <Icon name="star-outline" size={30} colorClassName={colors.warning.accent} />
      </View>
      <Text className={`${colors.black.text} mb-2 text-center text-lg font-semibold`}>
        暂无收藏
      </Text>
      <Text className={`${colors.gray6.text} text-center text-sm leading-6 my-4`}>
        在视频播放页点击收藏按钮，视频会出现在这里。
      </Text>
      {/* <Text className={`${colors.gray5.text} mt-2 text-center text-xs`}>
        先去逛逛，看到喜欢的再收藏。
      </Text> */}
    </View>
  );
}

function CollectList() {
  const { $collectedVideos, set$collectedVideos } = useStore();
  const headerTitle = `⭐️ 我的收藏（${$collectedVideos.length}）`;
  const blackColor = useResolvedColor(colors.black.text);
  const [searchKeyWord, setSearchKeyWord] = React.useState("");
  useUpdateNavigationOptions({
    headerTitle,
    headerSearchBarOptions: {
      placeholder: "搜索视频",
      headerIconColor: blackColor,
      hintTextColor: blackColor,
      textColor: blackColor,
      tintColor: blackColor,
      disableBackButtonOverride: false,
      shouldShowHintSearchIcon: false,
      onClose: () => {
        setSearchKeyWord("");
      },
      onSearchButtonPress: ({ nativeEvent: { text } }) => {
        const keyword = text.trim();
        if (!keyword) {
          return;
        }
        setSearchKeyWord(keyword);
      },
    },
  });

  const buttons = (video: CollectVideoInfo) => {
    return [
      {
        text: "查看封面",
        onPress: () => {
          Linking.openURL(video.cover);
        },
      },
      {
        text: "取消收藏",
        onPress: () => {
          Alert.alert("是否取消收藏？", "", [
            {
              text: "否",
            },
            {
              text: "是",
              onPress: () => {
                set$collectedVideos($collectedVideos.filter((v) => v.bvid !== video.bvid));
              },
            },
          ]);
        },
      },
    ];
  };
  const collectVideos = searchKeyWord
    ? $collectedVideos.filter((vi) => {
        return vi.title.includes(searchKeyWord);
      })
    : $collectedVideos;
  const isEmptyCollect = $collectedVideos.length === 0;
  return (
    <FlashList
      data={collectVideos}
      keyExtractor={(v: CollectVideoInfo) => v.bvid}
      renderItem={({ item }: { item: CollectVideoInfo }) => {
        return <VideoListItem video={item} buttons={buttons} />;
      }}
      persistentScrollbar
      estimatedItemSize={100}
      ListEmptyComponent={
        isEmptyCollect ? (
          <EmptyCollectContent />
        ) : (
          <View className="my-16 flex-1 gap-2">
            <Text className={`${colors.gray6.text} text-center text-base`}>无搜索结果</Text>
          </View>
        )
      }
      ListFooterComponent={
        collectVideos.length ? (
          <Text className={`${colors.gray6.text} my-2 text-center text-xs`}>暂无更多</Text>
        ) : null
      }
      contentContainerClassName={collectVideos.length ? "px-1 pt-6" : "flex-1 px-4 pt-6"}
      estimatedFirstItemOffset={80}
    />
  );
}

export default CollectList;
