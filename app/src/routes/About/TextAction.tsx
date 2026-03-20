import { Button, Text } from "@/components/styled/rneui";
import React from "react";
import { View } from "react-native";

export default TextAction;

function TextAction(
  props: React.PropsWithChildren<{
    text: string;
    onTextPress?: () => void;
    onTextLongPress?: () => void;
    buttons: {
      text: string;
      loading?: boolean;
      color?: string;
      onPress: () => void;
    }[];
  }>,
) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-base" onPress={props.onTextPress} onLongPress={props.onTextLongPress}>
        {props.text}
      </Text>
      <View className="flex-row">
        {props.buttons.map((button) => {
          return (
            <Button
              type="clear"
              size="sm"
              key={button.text}
              loading={!!button.loading}
              buttonClassName="h-8"
              titleStyle={button.color ? { color: button.color } : undefined}
              onPress={() => {
                button.onPress();
              }}
            >
              {button.text}
            </Button>
          );
        })}
      </View>
      {props.children}
    </View>
  );
}
