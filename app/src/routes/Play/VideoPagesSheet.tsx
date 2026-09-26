import type { FlashListRef } from "@shopify/flash-list";
import { Check, X } from "lucide-react-native";
import React from "react";
import { Pressable, useWindowDimensions, View } from "react-native";

import type { VideoInfo } from "@/api/video-info";
import { BottomSheet } from "@/components/styled/bottom-sheet";
import { FlashList, Text } from "@/components/styled/rneui";
import { ThemedIcon } from "@/components/ThemedIcon";
import { theme } from "@/constants/theme";
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

const SHEET_BACKDROP_OPACITY = 0.35;

export default function VideoPagesSheet(props: VideoPagesSheetProps) {
  const { height } = useWindowDimensions();
  const listRef = React.useRef<FlashListRef<VideoPage>>(null);
  const loadedRef = React.useRef(false);
  const sheetHeight = getVideoPagesSheetHeight(height, props.pages.length);

  function scrollToCurrentPage() {
    listRef.current?.scrollToIndex({
      index: Math.max(0, props.currentPage - 1),
      animated: false,
      viewPosition: 0.5,
    });
  }

  // sheet 内容每次打开都会重新挂载，onLoad 之后 ref 才可用，首次居中只能在这里做
  function handlePagesLoad() {
    loadedRef.current = true;
    scrollToCurrentPage();
  }

  React.useEffect(() => {
    if (!props.visible) {
      loadedRef.current = false;
      return;
    }
    if (!loadedRef.current || !props.pages.length) {
      return;
    }
    const frame = requestAnimationFrame(scrollToCurrentPage);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [props.currentPage, props.pages.length, props.visible]);

  return (
    <BottomSheet
      backdropOpacity={SHEET_BACKDROP_OPACITY}
      onClose={props.onClose}
      snapPoints={[sheetHeight]}
      visible={props.visible}
    >
      {/* flex-1 撑满 sheet 的内容区（sheet 高度已扣除把手），不要再写死高度 */}
      <View className={`flex-1 overflow-hidden rounded-t-[28px] ${theme.background.surface}`}>
        <View className="relative h-14 flex-row items-center border-b border-slate-100 px-4 dark:border-slate-800">
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
            <ThemedIcon icon={X} size={21} colorClassName={theme.icon.secondary} />
          </Pressable>
        </View>
        <FlashList
          ref={listRef}
          data={props.pages}
          extraData={props.currentPage}
          keyExtractor={(item) => String(item.cid)}
          contentContainerClassName="px-3 py-2"
          maintainVisibleContentPosition={{ disabled: true }}
          onLoad={handlePagesLoad}
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
                    ? `h-[60px] flex-row items-center gap-3 rounded-2xl px-3 ${theme.secondary.tint}`
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
                      ? `min-w-12 items-center rounded-full px-2 py-1 ${theme.secondary.bg}`
                      : "min-w-12 items-center rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800"
                  }
                >
                  <Text
                    className={
                      selected
                        ? "text-xs font-semibold tabular-nums text-white"
                        : `text-xs font-semibold tabular-nums ${theme.text.secondary}`
                    }
                  >
                    {`P${item.page}`}
                  </Text>
                </View>
                <Text
                  className={
                    selected
                      ? `min-w-0 flex-1 font-semibold ${theme.secondary.text}`
                      : "min-w-0 flex-1"
                  }
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {formatVideoPageTitle(item.title, item.page)}
                </Text>
                <Text className={`text-xs tabular-nums ${theme.text.muted}`}>
                  {parseDuration(item.duration)}
                </Text>
                {selected ? (
                  <ThemedIcon icon={Check} size={19} colorClassName={theme.secondary.accent} />
                ) : null}
              </Pressable>
            );
          }}
        />
      </View>
    </BottomSheet>
  );
}
