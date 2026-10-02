import { Check, Headphones } from "lucide-react-native";
import { Text, View } from "react-native";

import { Menu, MenuOption, MenuOptions, MenuTrigger } from "@/components/Menu";
import { ThemedIcon } from "@/components/ThemedIcon";
import {
  BACKGROUND_PLAY_DURATIONS,
  formatBackgroundPlayDuration,
} from "@/constants/background-playback";
import { theme } from "@/constants/theme";
import useResolvedColor from "@/hooks/useResolvedColor";
import type { BackgroundPlaySelection } from "@/types/background-playback";

import type { BackgroundPlayMenuProps } from "./background-play-menu.types";

const OPTIONS: readonly BackgroundPlaySelection[] = [null, ...BACKGROUND_PLAY_DURATIONS];

export default function BackgroundPlayMenu(props: BackgroundPlayMenuProps) {
  const accentColor = useResolvedColor(theme.secondary.text) ?? "#ff6699";
  const currentLabel = props.enabled ? formatBackgroundPlayDuration(props.durationMinutes) : "关闭";

  return (
    <Menu opened={props.opened} onBackdropPress={props.onClose} onClose={props.onClose}>
      <MenuTrigger
        accessibilityRole="button"
        accessibilityLabel={`后台播放，当前${currentLabel}${props.opened ? "，列表已展开" : ""}`}
        onPress={props.onToggle}
      >
        <View className="h-9 w-9 items-center justify-center rounded-full bg-black/40">
          <ThemedIcon icon={Headphones} size={20} color={props.enabled ? accentColor : "#ffffff"} />
        </View>
      </MenuTrigger>
      <MenuOptions>
        {OPTIONS.map((option) => {
          const label = option === null ? "关闭" : formatBackgroundPlayDuration(option);
          const selected = props.enabled ? option === props.durationMinutes : option === null;
          return (
            <MenuOption
              key={option ?? "off"}
              accessibilityRole="menuitem"
              accessibilityLabel={selected ? `${label}，当前选项` : label}
              onSelect={() => props.onSelect(option)}
            >
              <View className="h-12 min-w-[124px] flex-row items-center justify-between gap-3 px-4">
                <Text className={selected ? theme.secondary.text : theme.text.primary}>
                  {label}
                </Text>
                {selected ? <ThemedIcon icon={Check} size={18} color={accentColor} /> : null}
              </View>
            </MenuOption>
          );
        })}
      </MenuOptions>
    </Menu>
  );
}
