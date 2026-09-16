import React from "react";
import { Pressable, View } from "react-native";

import { Icon } from "@/components/styled/rneui";
import { colors } from "@/constants/colors.tw";
import useResolvedColor from "@/hooks/useResolvedColor";

export type PlayerTopActionsProps = {
  loopEnabled: boolean;
  autoNextEnabled: boolean;
  showAutoNext: boolean;
  /**
   * 是否允许后台播放，开启时按钮高亮
   */
  backgroundPlayEnabled: boolean;
  /**
   * 未登录 B站 时不展示发送弹幕按钮
   */
  canSendDanmaku: boolean;
  onToggleLoop: () => void;
  onToggleAutoNext: () => void;
  onToggleBackgroundPlay: () => void;
  onSendDanmaku: () => void;
};

/**
 * 播放器右上角的悬浮按钮：播放模式、后台播放与发送弹幕。
 */
export default function PlayerTopActions(props: PlayerTopActionsProps) {
  const accentColor = useResolvedColor(colors.secondary.text) ?? "#ff6699";

  return (
    <View className="flex-row items-center gap-2">
      <Pressable
        className="h-9 w-9 items-center justify-center rounded-full bg-black/40"
        android_ripple={{ color: "transparent" }}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        accessibilityRole="button"
        accessibilityLabel={props.loopEnabled ? "关闭循环播放" : "开启循环播放"}
        accessibilityState={{ selected: props.loopEnabled }}
        hitSlop={8}
        onPress={props.onToggleLoop}
      >
        <Icon
          name="repeat"
          type="material-design"
          size={20}
          color={props.loopEnabled ? accentColor : "#ffffff"}
        />
      </Pressable>
      {props.showAutoNext ? (
        <Pressable
          className="h-9 w-9 items-center justify-center rounded-full bg-black/40"
          android_ripple={{ color: "transparent" }}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          accessibilityRole="button"
          accessibilityLabel={props.autoNextEnabled ? "关闭自动分P" : "开启自动分P"}
          accessibilityState={{ selected: props.autoNextEnabled }}
          hitSlop={8}
          onPress={props.onToggleAutoNext}
        >
          <Icon
            name="playlist-play"
            type="material-design"
            size={22}
            color={props.autoNextEnabled ? accentColor : "#ffffff"}
          />
        </Pressable>
      ) : null}
      <Pressable
        className="h-9 w-9 items-center justify-center rounded-full bg-black/40"
        android_ripple={{ color: "transparent" }}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        accessibilityRole="button"
        accessibilityLabel={props.backgroundPlayEnabled ? "关闭后台播放" : "开启后台播放"}
        accessibilityState={{ selected: props.backgroundPlayEnabled }}
        hitSlop={8}
        onPress={props.onToggleBackgroundPlay}
      >
        <Icon
          name="headphones"
          type="material-design"
          size={20}
          color={props.backgroundPlayEnabled ? accentColor : "#ffffff"}
        />
      </Pressable>
      {props.canSendDanmaku ? (
        <Pressable
          className="h-9 w-9 items-center justify-center rounded-full bg-black/40"
          android_ripple={{ color: "transparent" }}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          accessibilityRole="button"
          accessibilityLabel="发送弹幕"
          hitSlop={8}
          onPress={props.onSendDanmaku}
        >
          <Icon name="pencil" type="material-design" size={20} color="#ffffff" />
        </Pressable>
      ) : null}
    </View>
  );
}
