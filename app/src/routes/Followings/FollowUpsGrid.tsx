import { FlatList, View, useWindowDimensions } from "react-native";

import type { UpInfo } from "@/types";

import FollowItem from "./FollowItem";
import type { FollowUpsGridProps } from "./FollowGroups.types";

export default function FollowUpsGrid({
  ups,
  onSetGroups,
  refreshing,
  onRefresh,
  onEndReached,
  onEndReachedThreshold = 1,
  emptyContent,
  footer,
}: FollowUpsGridProps) {
  const { width } = useWindowDimensions();
  const columns = Math.max(1, Math.floor(width / 90));
  const rest = ups.length ? columns - (ups.length % columns) : 0;
  const data: (UpInfo | null)[] = rest
    ? [...ups, ...Array.from({ length: rest }, () => null)]
    : [...ups];

  return (
    <FlatList
      data={data}
      keyExtractor={(item, index) => (item ? `${item.mid}` : `filler-${index}`)}
      renderItem={({ item }) =>
        item ? (
          <FollowItem item={item} onSetGroups={onSetGroups} />
        ) : (
          <View className="flex-1" />
        )
      }
      numColumns={columns}
      key={columns} // FlatList 不支持直接更改 columns
      persistentScrollbar
      contentContainerClassName="pt-6"
      columnWrapperClassName="px-3"
      refreshing={refreshing}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      ListEmptyComponent={emptyContent}
      ListFooterComponent={footer}
    />
  );
}
