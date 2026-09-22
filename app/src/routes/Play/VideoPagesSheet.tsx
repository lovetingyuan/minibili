import type { FlashListRef } from "@shopify/flash-list";
import { Check, X } from "lucide-react-native";
import React from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import type { Edge } from "react-native-safe-area-context";

import type { VideoInfo } from "@/api/video-info";
import { BottomSheet, FlashList, Text } from "@/components/styled/rneui";
import { ThemedIcon } from "@/components/ThemedIcon";
import { colors } from "@/constants/colors.tw";
import { parseDuration } from "@/utils";

import { formatVideoPageTitle, getVideoPagesSheetHeight } from "./video-pages-sheet.helpers";

type VideoPage = VideoInfo["pages"][number];

type VideoPagesSheetProps = {
  currentPage: number;
  pages: VideoInfo["pages"];
  visible: boolean;
  onClose: () => void;
  onSelectPage: (page: number) => void;
};

const SHEET_SAFE_AREA_EDGES: Edge[] = ["top"];

export default function VideoPagesSheet(props: VideoPagesSheetProps) {
  const { height } = useWindowDimensions();
  const listRef = React.useRef<FlashListRef<VideoPage>>(null);
  const sheetHeight = getVideoPagesSheetHeight(height, props.pages.length);

  React.useEffect(() => {
    if (!props.visible || !props.pages.length) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({
        index: Math.max(0, props.currentPage - 1),
        animated: false,
        viewPosition: 0.5,
      });
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [props.currentPage, props.pages.length, props.visible]);

  return (
    <BottomSheet
      backdropClassName="bg-black/35"
      edges={SHEET_SAFE_AREA_EDGES}
      onBackdropPress={props.onClose}
      modalProps={{ onRequestClose: props.onClose, statusBarTranslucent: true }}
      isVisible={props.visible}
    >
      <View
        className="overflow-hidden rounded-t-[28px] bg-white dark:bg-neutral-950"
        style={{ height: sheetHeight }}
      >
        <View className="items-center pb-1 pt-2.5">
          <View className="h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-700" />
        </View>
        <View className="relative h-14 flex-row items-center border-b border-neutral-100 px-4 dark:border-neutral-800">
          <Text className="text-base font-semibold tabular-nums">
            {`分 P · ${props.currentPage}/${props.pages.length}`}
          </Text>
          <Pressable
            className="absolute right-2 h-11 w-11 items-center justify-center rounded-full"
            android_ripple={{ color: "transparent" }}
            style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}
            accessibilityRole="button"
            accessibilityLabel="关闭分P列表"
            onPress={props.onClose}
          >
            <ThemedIcon icon={X} size={21} colorClassName={colors.gray7.accent} />
          </Pressable>
        </View>
        <FlashList
          ref={listRef}
          data={props.pages}
          extraData={props.currentPage}
          keyExtractor={(item) => String(item.cid)}
          contentContainerClassName="px-3 py-2"
          maintainVisibleContentPosition={{ disabled: true }}
          renderItem={({ item }) => {
            const selected = item.page === props.currentPage;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`播放 P${item.page} ${formatVideoPageTitle(item.title, item.page)}`}
                accessibilityState={{ selected }}
                android_ripple={{ color: "transparent" }}
                className={
                  selected
                    ? "h-[60px] flex-row items-center gap-3 rounded-2xl bg-pink-50 px-3 dark:bg-pink-950/40"
                    : "h-[60px] flex-row items-center gap-3 rounded-2xl px-3"
                }
                style={({ pressed }) => ({ opacity: pressed ? 0.68 : 1 })}
                onPress={() => {
                  props.onSelectPage(item.page);
                  props.onClose();
                }}
              >
                <View
                  className={
                    selected
                      ? "min-w-12 items-center rounded-full bg-pink-400 px-2 py-1"
                      : "min-w-12 items-center rounded-full bg-neutral-100 px-2 py-1 dark:bg-neutral-800"
                  }
                >
                  <Text
                    className={
                      selected
                        ? "text-xs font-semibold tabular-nums text-white"
                        : `text-xs font-semibold tabular-nums ${colors.gray7.text}`
                    }
                  >
                    {`P${item.page}`}
                  </Text>
                </View>
                <Text
                  className={
                    selected
                      ? `min-w-0 flex-1 font-semibold ${colors.secondary.text}`
                      : "min-w-0 flex-1"
                  }
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {formatVideoPageTitle(item.title, item.page)}
                </Text>
                <Text className={`text-xs tabular-nums ${colors.gray6.text}`}>
                  {parseDuration(item.duration)}
                </Text>
                {selected ? (
                  <ThemedIcon icon={Check} size={19} colorClassName={colors.secondary.accent} />
                ) : null}
              </Pressable>
            );
          }}
        />
      </View>
    </BottomSheet>
  );
}

export { formatVideoPageTitle, getVideoPagesSheetHeight };
