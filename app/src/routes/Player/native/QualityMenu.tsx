import { Check, ChevronDown, ChevronUp } from "lucide-react-native";
import { Text, View } from "react-native";

import { formatVideoQuality, VIDEO_QUALITIES } from "@/api/play-dash";
import { Menu, MenuOption, MenuOptions, MenuTrigger } from "@/components/Menu";
import { ThemedIcon } from "@/components/ThemedIcon";
import { theme } from "@/constants/colors.tw";
import { clsx as tw } from "clsx";

import type { QualityMenuProps } from "./quality-menu.types";

export default function QualityMenu(props: QualityMenuProps) {
  const label = props.quality ? formatVideoQuality(props.quality) : "清晰度";
  return (
    <Menu opened={props.opened} onBackdropPress={props.onClose} onClose={props.onClose}>
      <MenuTrigger
        accessibilityRole="button"
        accessibilityLabel={`清晰度，当前${label}${props.opened ? "，列表已展开" : ""}`}
        onPress={props.onToggle}
      >
        <View className="h-9 flex-row items-center justify-center gap-0.5 rounded-full bg-media-background/40 px-2">
          <Text className="text-xs font-semibold text-media-content">{label}</Text>
          <ThemedIcon
            icon={props.opened ? ChevronUp : ChevronDown}
            size={14}
            colorClassName={theme.media.content}
          />
        </View>
      </MenuTrigger>
      <MenuOptions>
        {VIDEO_QUALITIES.map((quality) => {
          const available = props.availableQualities.includes(quality);
          const selected = props.quality === quality;
          const text = formatVideoQuality(quality);
          return (
            <MenuOption
              key={quality}
              disabled={!available}
              accessibilityRole="menuitem"
              accessibilityLabel={`${text}${available ? (selected ? "，当前清晰度" : "") : "，不可用"}`}
              onSelect={() => props.onSelect(quality)}
            >
              <View className="h-11 min-w-[148px] flex-row items-center justify-between gap-3 px-4">
                <Text
                  className={tw(
                    !available
                      ? theme.text.disabled
                      : selected
                        ? theme.secondary.text
                        : theme.text.primary,
                  )}
                >
                  {text}
                </Text>
                {!available ? (
                  <Text className={tw("text-xs", theme.text.disabled)}>不可用</Text>
                ) : selected ? (
                  <ThemedIcon icon={Check} size={18} colorClassName={theme.secondary.text} />
                ) : null}
              </View>
            </MenuOption>
          );
        })}
      </MenuOptions>
    </Menu>
  );
}
