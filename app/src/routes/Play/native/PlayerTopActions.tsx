import React from "react";
import { Pressable, View } from "react-native";

import { Icon } from "@/components/styled/rneui";
import { colors } from "@/constants/colors.tw";
import useResolvedColor from "@/hooks/useResolvedColor";

export type PlayerTopActionsProps = {
  /**
   * 是否允许后台播放，开启时按钮高亮
   */
  backgroundPlayEnabled: boolean;
  /**
   * 未登录 B站 时不展示发送弹幕按钮
   */
  canSendDanmaku: boolean;
  onToggleBackgroundPlay: () => void;
  onSendDanmaku: () => void;
};

/**
 * 播放器右上角的悬浮按钮：后台播放开关在左，发送弹幕在右
 */
export default function PlayerTopActions(props: PlayerTopActionsProps) {
  const accentColor = useResolvedColor(colors.secondary.text) ?? "#ff6699";

  return (
    <View className="flex-row items-center gap-3">
      <Pressable
        className="h-9 w-9 items-center justify-center rounded-full bg-black/40"
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
