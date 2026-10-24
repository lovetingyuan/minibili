import React from "react";
import { ThemedIcon } from "@/components/ThemedIcon";
import { VideoBadge } from "@/components/VideoBadge";
import { Play } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { parseDuration } from "@/utils";
import QualityMenu from "./QualityMenu";
import type { PlayerCoverProps } from "./player-cover.types";

function PlayerPlayIcon() {
  return (
    <ThemedIcon icon={Play} size={64} colorClassName="text-media-content" filled opacity={0.8} />
  );
}

export default function PlayerCover(props: PlayerCoverProps) {
  const { duration, isMetered, badgeLabel } = props;
  const [qualityMenuOpen, setQualityMenuOpen] = React.useState(false);

  return (
    <View className="flex-1">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="开始播放"
        className="absolute inset-0 items-center justify-center"
        onPress={props.onStart}
      >
        <PlayerPlayIcon />
      </Pressable>
      {badgeLabel ? (
        <View pointerEvents="none" className="absolute left-2 top-2">
          <VideoBadge label={badgeLabel} tone={props.badgeTone ?? "charge"} variant="overlay" />
        </View>
      ) : null}
      <View pointerEvents="none" className="absolute bottom-2 left-2 flex-row gap-2">
        {duration ? (
          <Text className="rounded bg-media-background/60 px-2 py-0.5 font-bold text-media-content">
            {parseDuration(duration)}
          </Text>
        ) : null}
        {isMetered ? (
          <Text className="rounded bg-media-background/60 px-2 py-0.5 font-bold text-media-content">
            播放将消耗流量
          </Text>
        ) : null}
      </View>
      <View className="absolute right-2 top-2">
        <QualityMenu
          quality={props.quality}
          availableQualities={props.availableQualities}
          opened={qualityMenuOpen}
          onToggle={() => setQualityMenuOpen(!qualityMenuOpen)}
          onClose={() => setQualityMenuOpen(false)}
          onSelect={(quality) => {
            setQualityMenuOpen(false);
            props.onQualityChange(quality);
          }}
        />
      </View>
    </View>
  );
}
