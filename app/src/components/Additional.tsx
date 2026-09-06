import { Text } from "@/components/styled/rneui";
import { Image } from "@/components/styled/expo";
import { Linking, Pressable, View } from "react-native";

import type { DynamicAdditional } from "@/api/dynamic-items.type";
import { colors } from "@/constants/colors.tw";
import { getImagePixelDimensions, parseImgUrl } from "@/utils";

export function Additional(props: { additional: DynamicAdditional | null }) {
  const { additional } = props;
  if (!additional) {
    return null;
  }
  const value = additional;
  const coverSize = getImagePixelDimensions(80, 64);

  function open() {
    if (value.url) {
      void Linking.openURL(value.url);
    }
  }

  return (
    <Pressable
      disabled={!additional.url}
      onPress={open}
      className="mb-3 flex-row overflow-hidden rounded-lg bg-neutral-100 p-2 dark:bg-neutral-800"
    >
      {additional.cover ? (
        <Image
          source={{ uri: parseImgUrl(additional.cover, coverSize) }}
          contentFit="cover"
          className="mr-3 h-16 w-20 rounded-md"
        />
      ) : null}
      <View className="min-w-0 flex-1 justify-center gap-0.5">
        <Text className={`text-xs ${colors.secondary.text}`}>{additional.head}</Text>
        <Text className="text-sm font-semibold" numberOfLines={2}>
          {additional.title}
        </Text>
        {additional.description ? (
          <Text className={`text-xs ${colors.gray6.text}`} numberOfLines={2}>
            {additional.description}
          </Text>
        ) : null}
      </View>
      {additional.url ? (
        <Text className={`self-center pl-2 text-xs ${colors.primary.text}`}>
          {additional.actionLabel || "查看"}
        </Text>
      ) : null}
    </Pressable>
  );
}
