import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowUp, X } from "lucide-react-native";

import { ThemedIcon } from "@/components/ThemedIcon";
import { theme } from "@/constants/colors.tw";

import type { CommentComposerProps } from "./comment-composer.types";

const MAX_COMMENT_LENGTH = 1000;

/** 贴键盘上方浮出的评论输入条，只支持文字评论 */
export default function CommentComposer(props: CommentComposerProps) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const canSubmit = Boolean(draft.trim()) && !props.pending;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function submit() {
    if (!canSubmit) {
      return;
    }
    if (await props.onSubmit(draft)) {
      setDraft("");
    }
  }

  return (
    <View
      className="flex-row items-center gap-2 border-t border-divider-subtle bg-surface px-3 pt-2"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      <TextInput
        ref={inputRef}
        value={draft}
        multiline
        autoFocus
        placeholder="发一条友善的评论"
        placeholderTextColorClassName={theme.icon.muted}
        selectionColorClassName={theme.primary.accent}
        className="max-h-28 min-h-9 flex-1 rounded-3xl bg-fill-raised px-4 py-2 text-[15px] text-heading"
        accessibilityLabel="评论输入框"
        onChangeText={(value) => setDraft([...value].slice(0, MAX_COMMENT_LENGTH).join(""))}
        onSubmitEditing={() => void submit()}
      />
      <Pressable
        className={`h-9 w-9 items-center justify-center rounded-full ${canSubmit ? theme.primary.bg : theme.background.fillDisabled.bg}`}
        accessibilityRole="button"
        accessibilityLabel="发送评论"
        accessibilityState={{ disabled: !canSubmit, busy: props.pending }}
        disabled={!canSubmit}
        onPress={() => void submit()}
      >
        {props.pending ? (
          <ActivityIndicator size="small" colorClassName={theme.icon.disabled} />
        ) : (
          <ThemedIcon
            icon={ArrowUp}
            size={18}
            colorClassName={canSubmit ? theme.primary.content : theme.icon.disabled}
          />
        )}
      </Pressable>
      <Pressable
        className="h-9 w-9 items-center justify-center rounded-full"
        accessibilityRole="button"
        accessibilityLabel="关闭评论输入框"
        onPress={props.onClose}
      >
        <ThemedIcon icon={X} size={20} colorClassName={theme.icon.secondary} />
      </Pressable>
    </View>
  );
}
