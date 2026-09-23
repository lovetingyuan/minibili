import { Pressable, Text, View } from "react-native";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Headphones,
  ListVideo,
  Pencil,
  Repeat2,
} from "lucide-react-native";

import { Menu, MenuOption, MenuOptions, MenuTrigger } from "@/components/Menu";
import { ThemedIcon } from "@/components/ThemedIcon";
import { theme } from "@/constants/theme";
import useResolvedColor from "@/hooks/useResolvedColor";

import { formatPlaybackRate, PLAYBACK_RATES, type PlaybackRate } from "./playback-rate";

export type PlayerTopActionsProps = {
  playbackRate: PlaybackRate;
  playbackRateMenuOpen: boolean;
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
  onTogglePlaybackRateMenu: () => void;
  onClosePlaybackRateMenu: () => void;
  onPlaybackRateChange: (rate: PlaybackRate) => void;
  onToggleLoop: () => void;
  onToggleAutoNext: () => void;
  onToggleBackgroundPlay: () => void;
  onSendDanmaku: () => void;
};

/**
 * 播放器右上角的悬浮按钮：倍速、播放模式、后台播放与发送弹幕。
 */
export default function PlayerTopActions(props: PlayerTopActionsProps) {
  const accentColor = useResolvedColor(theme.secondary.text) ?? "#ff6699";
  const playbackRateLabel = formatPlaybackRate(props.playbackRate);

  return (
    <View className="flex-row items-center gap-2">
      <Menu
        opened={props.playbackRateMenuOpen}
        onBackdropPress={props.onClosePlaybackRateMenu}
        onClose={props.onClosePlaybackRateMenu}
      >
        <MenuTrigger
          accessibilityRole="button"
          accessibilityLabel={`播放速度，当前 ${playbackRateLabel}${
            props.playbackRateMenuOpen ? "，列表已展开" : ""
          }`}
          onPress={props.onTogglePlaybackRateMenu}
        >
          <View className="h-9 min-w-12 flex-row items-center justify-center gap-0.5 rounded-full bg-black/40 px-2">
            <Text className="text-xs font-semibold text-white">{playbackRateLabel}</Text>
            <ThemedIcon
              icon={props.playbackRateMenuOpen ? ChevronUp : ChevronDown}
              size={16}
              color="#ffffff"
            />
          </View>
        </MenuTrigger>
        <MenuOptions>
          {PLAYBACK_RATES.map((rate) => {
            const label = formatPlaybackRate(rate);
            const selected = rate === props.playbackRate;
            return (
              <MenuOption
                key={rate}
                accessibilityLabel={selected ? `${label}，当前速度` : label}
                accessibilityRole="menuitem"
                onSelect={() => {
                  props.onPlaybackRateChange(rate);
                }}
              >
                <View className="h-12 min-w-[124px] flex-row items-center justify-between px-4">
                  <Text
                    className={theme.text.primary}
                    style={selected ? { color: accentColor } : null}
                  >
                    {label}
                  </Text>
                  {selected ? <ThemedIcon icon={Check} size={18} color={accentColor} /> : null}
                </View>
              </MenuOption>
            );
          })}
        </MenuOptions>
      </Menu>
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
        <ThemedIcon icon={Repeat2} size={20} color={props.loopEnabled ? accentColor : "#ffffff"} />
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
          <ThemedIcon
            icon={ListVideo}
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
        <ThemedIcon
          icon={Headphones}
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
          <ThemedIcon icon={Pencil} size={20} color="#ffffff" />
        </Pressable>
      ) : null}
    </View>
  );
}
