import { Skeleton } from "@/components/styled/rneui";
import React from "react";
import { View } from "react-native";

const SKELETON_WIDTHS = [85, 62, 92, 45, 76, 30, 55, 95, 70, 40, 88, 35, 66, 52, 78, 25];

function VideoLoading({ index }: { index: number }) {
  const width = SKELETON_WIDTHS[index % SKELETON_WIDTHS.length];
  return (
    <View className="flex-1 gap-3">
      <Skeleton animation="pulse" width={"100%" as any} height={110} />
      <View className="gap-2">
        <Skeleton animation="wave" width={`${width}%` as any} height={15} />
        {index % 2 === 0 ? (
          <Skeleton
            animation="wave"
            width={`${SKELETON_WIDTHS[(index + 7) % SKELETON_WIDTHS.length]}%` as any}
            height={15}
          />
        ) : (
          <View className="h-3" />
        )}
      </View>
      <View className="flex-row justify-between">
        <Skeleton animation="wave" width={60} height={12} />
        <Skeleton animation="wave" width={50} height={12} />
      </View>
    </View>
  );
}

export default VLoading;

function VLoading() {
  return (
    <View>
      {Array(10)
        .fill(null)
        .map((_, i) => {
          return (
            <View className="mb-4 flex-row gap-3 px-2 pb-2" key={i}>
              <VideoLoading index={i * 2} />
              <VideoLoading index={i * 2 + 1} />
            </View>
          );
        })}
    </View>
  );
}
