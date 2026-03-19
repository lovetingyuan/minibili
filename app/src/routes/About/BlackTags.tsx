import { Chip, Icon, ListItem, Text } from "@/components/styled/rneui";
import React from "react";

import { colors } from "@/constants/colors.tw";
import useResolvedColor from "@/hooks/useResolvedColor";
import { useStore } from "@/store";

export default React.memo(BlackTags);

function BlackTags() {
  const [expanded, setExpanded] = React.useState(false);
  const { $blackTags, set$blackTags } = useStore();
  const gray5Color = useResolvedColor(colors.gray5.text);
  return (
    <ListItem.Accordion
      icon={<Icon name={"chevron-down"} type="material-community" />}
      containerClassName="p-0 mt-1 mb-3 bg-transparent"
      content={
        <ListItem.Content>
          <ListItem.Title>不感兴趣的分类（{Object.keys($blackTags).length}）</ListItem.Title>
        </ListItem.Content>
      }
      isExpanded={expanded}
      onPress={() => {
        setExpanded(!expanded);
      }}
    >
      <ListItem containerClassName="flex-wrap p-0 flex-row px-1 pb-4 bg-transparent">
        {Object.values($blackTags).map((tag) => {
          return (
            <Chip
              title={tag}
              key={tag}
              type="outline"
              icon={
                <Icon
                  name="close"
                  type="Ionicons"
                  size={16}
                  color={gray5Color}
                  onPress={() => {
                    const blackTags = { ...$blackTags };
                    delete blackTags[tag];
                    set$blackTags(blackTags);
                  }}
                />
              }
              iconRight
              titleClassName="text-left text-sm font-thin"
              containerClassName="mb-2 self-start"
              buttonClassName="pl-1 py-[2px]"
            />
          );
        })}
        {Object.values($blackTags).length === 0 ? <Text>🈚</Text> : null}
      </ListItem>
    </ListItem.Accordion>
  );
}
