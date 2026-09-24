import { Chip } from "@/components/Chip";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { Text } from "@/components/styled/rneui";
import { ThemedIcon } from "@/components/ThemedIcon";
import { X } from "lucide-react-native";
import React from "react";
import { Pressable, View } from "react-native";

import { theme } from "@/constants/theme";
import useResolvedColor from "@/hooks/useResolvedColor";
import { useUserSettings } from "@/features/user-data/useUserSettings";

export default BlackTags;

function BlackTags() {
  const [expanded, setExpanded] = React.useState(false);
  const {
    values: { $blackTags },
    setSetting,
  } = useUserSettings();
  const gray5Color = useResolvedColor(theme.text.disabled);
  return (
    <CollapsibleSection
      expanded={expanded}
      title={`不感兴趣的分类（${Object.keys($blackTags).length}）`}
      onPress={() => {
        setExpanded(!expanded);
      }}
    >
      <View className="flex-row flex-wrap items-center bg-transparent px-1 pb-4">
        {Object.values($blackTags).map((tag) => {
          return (
            <Chip
              title={tag}
              key={tag}
              type="outline"
              icon={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`移除不感兴趣分类：${tag}`}
                  hitSlop={8}
                  onPress={() => {
                    setSetting("$blackTags", (previous) => {
                      const blackTags = { ...previous };
                      delete blackTags[tag];
                      return blackTags;
                    });
                  }}
                >
                  <ThemedIcon icon={X} size={16} color={gray5Color} />
                </Pressable>
              }
              iconRight
              titleClassName="text-left text-sm font-normal"
              containerClassName="mb-2 mr-2 self-start"
              buttonClassName="px-2 py-[2px]"
            />
          );
        })}
        {Object.values($blackTags).length === 0 ? <Text>🈚</Text> : null}
      </View>
    </CollapsibleSection>
  );
}
