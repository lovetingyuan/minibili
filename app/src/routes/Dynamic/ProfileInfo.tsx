import { useState } from "react";
import { Pressable, View } from "react-native";

import { Text } from "@/components/styled/rneui";
import { theme } from "@/constants/theme";

import type { ProfileInfoProps, ProfileInfoRowProps } from "./ProfileInfo.types";

function ProfileInfoRow(props: ProfileInfoRowProps) {
  return (
    <View className="flex-row items-start gap-1">
      <Text
        selectable={props.expanded}
        numberOfLines={props.expanded ? undefined : 1}
        ellipsizeMode="tail"
        className="min-w-0 flex-1 text-sm leading-5"
      >
        <Text className={`text-xs font-medium ${theme.text.muted}`}>{props.label}　</Text>
        {props.value}
      </Text>
      {props.action}
    </View>
  );
}

export default function ProfileInfo(props: ProfileInfoProps) {
  const [expanded, setExpanded] = useState(false);
  const officialDescription = props.officialDescription?.trim() ?? "";
  const sign = props.sign?.trim() ?? "";

  if (!officialDescription && !sign) {
    return null;
  }

  const action = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={expanded ? "收起UP主资料" : "查看UP主资料详情"}
      hitSlop={8}
      className="shrink-0 self-end px-1 py-0.5"
      onPress={() => setExpanded((current) => !current)}
    >
      <Text className={`text-xs font-medium leading-5 ${theme.primary.text}`}>
        {expanded ? "收起" : "详情"}
      </Text>
    </Pressable>
  );

  return (
    <View className="mb-3 gap-2 bg-white px-4 py-3 dark:bg-slate-950">
      {officialDescription ? (
        <ProfileInfoRow
          action={sign ? undefined : action}
          expanded={expanded}
          label="UP主介绍"
          value={officialDescription}
        />
      ) : null}
      {sign ? (
        <ProfileInfoRow action={action} expanded={expanded} label="个人签名" value={sign} />
      ) : null}
    </View>
  );
}
