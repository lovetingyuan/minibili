import { useNavigation } from "@react-navigation/native";
import { ChevronRight, CirclePlay } from "lucide-react-native";
import { Text } from "@/components/styled/rneui";
import { Image } from "@/components/styled/expo";
import { Linking, Pressable, View } from "react-native";
import type { GestureResponderEvent } from "react-native";

import type { DynamicAdditional } from "@/api/dynamic-items.type";
import { ThemedIcon } from "@/components/ThemedIcon";
import { theme } from "@/constants/theme";
import type { NavigationProps } from "@/types";
import { getImagePixelDimensions, parseImgUrl } from "@/utils";

export function Additional(props: { additional: DynamicAdditional | null }) {
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const { additional } = props;
  if (!additional) {
    return null;
  }
  const value = additional;
  const coverSize = getImagePixelDimensions(96, 54);
  const interactive = Boolean(value.bvid || value.url);

  function open(event: GestureResponderEvent) {
    event.stopPropagation();
    if (value.bvid) {
      navigation.navigate("Play", {
        bvid: value.bvid,
        title: value.title,
        cover: value.cover,
        desc: value.description,
      });
      return;
    }
    if (value.url) {
      void Linking.openURL(value.url);
    }
  }

  return (
    <Pressable
      accessibilityRole={interactive ? "button" : undefined}
      accessibilityLabel={
        interactive
          ? value.bvid
            ? `播放视频：${value.title}`
            : `查看${value.head}：${value.title}`
          : undefined
      }
      disabled={!interactive}
      onPress={open}
      className="mb-3 min-h-18 flex-row items-center overflow-hidden rounded-lg bg-slate-100 p-2.5 dark:bg-slate-800"
    >
      {additional.cover ? (
        <Image
          source={{ uri: parseImgUrl(additional.cover, coverSize) }}
          contentFit="cover"
          className="mr-3 aspect-video w-24 shrink-0 rounded-md bg-slate-200 dark:bg-slate-700"
        />
      ) : null}
      <View className="min-w-0 flex-1 justify-center gap-0.5 py-0.5">
        <Text className={`text-[11px] font-medium ${theme.secondary.text}`} numberOfLines={1}>
          {additional.head}
        </Text>
        <Text className="text-sm font-semibold leading-5" numberOfLines={2}>
          {additional.title}
        </Text>
        {additional.description ? (
          <Text className={`text-xs leading-4 ${theme.text.muted}`} numberOfLines={1}>
            {additional.description}
          </Text>
        ) : null}
      </View>
      {additional.actionLabel && !additional.bvid ? (
        <Text className={`ml-2 shrink-0 text-xs ${theme.primary.text}`}>
          {additional.actionLabel}
        </Text>
      ) : interactive ? (
        <View className="ml-2 shrink-0">
          <ThemedIcon
            icon={additional.bvid ? CirclePlay : ChevronRight}
            size={18}
            colorClassName={additional.bvid ? theme.icon.primary : theme.icon.muted}
          />
        </View>
      ) : null}
    </Pressable>
  );
}
