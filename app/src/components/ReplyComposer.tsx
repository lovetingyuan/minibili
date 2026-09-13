import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Keyboard, Pressable, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon, Text } from "@/components/styled/rneui";
import { colors } from "@/constants/colors.tw";

import type { ReplyComposerProps } from "./reply-composer.types";

export default function ReplyComposer(props: ReplyComposerProps) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const count = [...draft].length;

  useEffect(() => {
    if (props.focusRequested) inputRef.current?.focus();
  }, [props.focusRequested, props.target.id]);

  async function submit() {
    if (!draft.trim() || props.pending) return;
    if (await props.onSubmit(draft)) {
      setDraft("");
      Keyboard.dismiss();
    }
  }

  return (
    <View
      className="border-t border-neutral-100 bg-white px-3 pt-2 dark:border-neutral-800 dark:bg-neutral-950"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      {count ? (
        <View className="mb-1 flex-row items-center justify-between px-1">
          <Text className={`min-w-0 flex-1 text-xs ${colors.gray6.text}`} numberOfLines={1}>
            回复 @{props.target.name}
          </Text>
          <Text
            className={`text-[11px] tabular-nums ${count === 1000 ? colors.warning.text : colors.gray6.text}`}
          >
            {count}/1000
          </Text>
        </View>
      ) : null}
      <View className="flex-row items-end gap-2">
        <TextInput
          ref={inputRef}
          value={draft}
          multiline
          placeholder={`回复 @${props.target.name}`}
          className="max-h-28 min-h-11 flex-1 rounded-3xl bg-neutral-100 px-4 py-2.5 text-[15px] text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
          accessibilityLabel={`回复 ${props.target.name}`}
          onChangeText={(value) => setDraft([...value].slice(0, 1000).join(""))}
          onSubmitEditing={() => void submit()}
        />
        <Pressable
          className={`h-11 w-11 items-center justify-center rounded-full ${draft.trim() && !props.pending ? colors.primary.bg : colors.gray3.bg}`}
          accessibilityRole="button"
          accessibilityLabel="发送回复"
          accessibilityState={{ disabled: !draft.trim() || props.pending, busy: props.pending }}
          disabled={!draft.trim() || props.pending}
          onPress={() => void submit()}
        >
          {props.pending ? (
            <ActivityIndicator size="small" colorClassName={colors.coverBadge.accent} />
          ) : (
            <Icon name="send" size={19} colorClassName={colors.coverBadge.accent} />
          )}
        </Pressable>
      </View>
    </View>
  );
}
