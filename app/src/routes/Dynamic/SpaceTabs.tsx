import { Pressable, View } from "react-native";

import { Text } from "@/components/styled/rneui";
import { theme } from "@/constants/theme";

import type { SpaceTabsProps } from "./SpaceTabs.types";

export default function SpaceTabs(props: SpaceTabsProps) {
  return (
    <View className={`flex-row border-b ${theme.background.surface} ${theme.border.divider}`}>
      {props.tabs.map((tab) => {
        const selected = props.selectedKey === tab.key;
        const label = tab.count === undefined ? tab.label : `${tab.label} ${tab.count}`;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
            className="relative flex-1 items-center justify-center py-3"
            onPress={() => props.onSelect(tab.key)}
          >
            <Text
              className={`text-sm ${selected ? `${theme.primary.text} font-semibold` : theme.text.muted}`}
            >
              {label}
            </Text>
            {selected ? (
              <View className={`absolute bottom-0 h-0.5 w-8 rounded-full ${theme.primary.bg}`} />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
