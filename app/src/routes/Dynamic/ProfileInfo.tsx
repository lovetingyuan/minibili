import { useState } from "react";
import { Pressable, View } from "react-native";

import { Text } from "@/components/styled/rneui";
import { theme } from "@/constants/theme";

import {
  hasProfileInfoOverflow,
  PROFILE_INFO_COLLAPSED_LINES,
  withProfileInfoLines,
} from "./profile-info.helpers";
import type { ProfileInfoLines, ProfileInfoLinesField } from "./profile-info.helpers";
import type { ProfileInfoProps, ProfileInfoRowProps } from "./ProfileInfo.types";

function ProfileInfoRow(props: ProfileInfoRowProps) {
  const content = (
    <>
      <Text className={`text-xs font-medium ${theme.text.muted}`}>{props.label}　</Text>
      {props.value}
    </>
  );

  return (
    <View className="relative flex-row items-start gap-1">
      <Text
        selectable={props.expanded}
        numberOfLines={props.expanded ? undefined : PROFILE_INFO_COLLAPSED_LINES}
        ellipsizeMode="tail"
        className="min-w-0 flex-1 text-sm leading-5"
      >
        {content}
      </Text>
      {/*
        隐形测量副本：不受 numberOfLines 限制，用来量出文案在整行宽度下的真实行数。
        必须和按钮的显隐无关（绝对定位占满整行宽度），否则"放得下→隐藏按钮→变宽"
        这类循环会让判定来回抖动；展开时也不能跟着变宽/变窄，否则"收起"按钮会消失。
      */}
      <Text
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        className="absolute left-0 right-0 top-0 text-sm leading-5 opacity-0"
        onTextLayout={(event) => props.onLinesChange(props.field, event.nativeEvent.lines.length)}
      >
        {content}
      </Text>
      {props.action}
    </View>
  );
}

export default function ProfileInfo(props: ProfileInfoProps) {
  const [expanded, setExpanded] = useState(false);
  const [lines, setLines] = useState<ProfileInfoLines>({ official: 0, sign: 0 });
  const officialDescription = props.officialDescription?.trim() ?? "";
  const sign = props.sign?.trim() ?? "";

  if (!officialDescription && !sign) {
    return null;
  }

  const canExpand = hasProfileInfoOverflow(lines);
  const isExpanded = canExpand && expanded;

  function handleLinesChange(field: ProfileInfoLinesField, value: number) {
    setLines((current) => withProfileInfoLines(current, field, value));
  }

  const action = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isExpanded ? "收起UP主资料" : "查看UP主资料详情"}
      hitSlop={8}
      className="shrink-0 self-end px-1 py-0.5"
      onPress={() => setExpanded((current) => !current)}
    >
      <Text className={`text-xs font-medium leading-5 ${theme.primary.text}`}>
        {isExpanded ? "收起" : "详情"}
      </Text>
    </Pressable>
  );

  return (
    <View className="mb-3 gap-2 bg-white px-4 py-3 dark:bg-slate-950">
      {officialDescription ? (
        <ProfileInfoRow
          action={sign || !canExpand ? undefined : action}
          expanded={isExpanded}
          field="official"
          label="UP主介绍"
          onLinesChange={handleLinesChange}
          value={officialDescription}
        />
      ) : null}
      {sign ? (
        <ProfileInfoRow
          action={canExpand ? action : undefined}
          expanded={isExpanded}
          field="sign"
          label="个人签名"
          onLinesChange={handleLinesChange}
          value={sign}
        />
      ) : null}
    </View>
  );
}
