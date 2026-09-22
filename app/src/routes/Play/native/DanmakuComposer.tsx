import React from "react";
import { ArrowUp, X } from "lucide-react-native";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";

import { Text } from "@/components/styled/rneui";
import { ThemedIcon } from "@/components/ThemedIcon";
import { colors } from "@/constants/colors.tw";

/**
 * 弹幕内容上限，与接口限制保持一致
 */
export const DANMAKU_COMPOSER_MAX_LENGTH = 100;
export const DANMAKU_COMPOSER_PLACEHOLDER = "发个友善的弹幕见证当下";

/**
 * 归一化输入内容：弹幕不能包含换行，超出上限按码点截断
 */
export function clampDanmakuDraft(value: string) {
  const singleLine = value.replace(/[\r\n]+/g, " ");
  return [...singleLine].slice(0, DANMAKU_COMPOSER_MAX_LENGTH).join("");
}

export type DanmakuComposerViewProps = {
  draft: string;
  pending: boolean;
  placeholder?: string;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};

/**
 * 播放器底部的弹幕输入条，贴键盘上方浮出
 */
export function DanmakuComposerView(props: DanmakuComposerViewProps) {
  const count = [...props.draft].length;
  const canSubmit = Boolean(props.draft.trim()) && !props.pending;
  const reachedLimit = count >= DANMAKU_COMPOSER_MAX_LENGTH;

  return (
    <View className="absolute bottom-0 left-0 right-0" pointerEvents="box-none">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View className="flex-row items-center gap-2 bg-black/80 px-3 pb-2 pt-2">
          <TextInput
            value={props.draft}
            autoFocus
            placeholder={props.placeholder ?? DANMAKU_COMPOSER_PLACEHOLDER}
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            selectionColor="#ffffff"
            maxLength={DANMAKU_COMPOSER_MAX_LENGTH}
            className="min-h-9 flex-1 rounded-3xl bg-white/15 px-4 py-2 text-[15px] text-white"
            accessibilityLabel="弹幕输入框"
            onChangeText={props.onChangeText}
            onSubmitEditing={props.onSubmit}
          />
          <Text
            className={`text-[11px] tabular-nums ${reachedLimit ? "text-orange-400" : "text-white/60"}`}
          >{`${count}/${DANMAKU_COMPOSER_MAX_LENGTH}`}</Text>
          <Pressable
            className={`h-9 w-9 items-center justify-center rounded-full ${canSubmit ? colors.primary.bg : "bg-white/20"}`}
            accessibilityRole="button"
            accessibilityLabel="发送弹幕"
            accessibilityState={{ disabled: !canSubmit, busy: props.pending }}
            disabled={!canSubmit}
            onPress={props.onSubmit}
          >
            {props.pending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <ThemedIcon icon={ArrowUp} size={18} color="#ffffff" />
            )}
          </Pressable>
          <Pressable
            className="h-9 w-9 items-center justify-center rounded-full"
            accessibilityRole="button"
            accessibilityLabel="关闭弹幕输入框"
            hitSlop={6}
            onPress={props.onClose}
          >
            <ThemedIcon icon={X} size={20} color="#ffffff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

type DanmakuComposerProps = {
  pending: boolean;
  /**
   * 返回 true 表示发送成功，可以清空草稿
   */
  onSubmit: (text: string) => Promise<boolean>;
  onClose: () => void;
};

export default function DanmakuComposer(props: DanmakuComposerProps) {
  const [draft, setDraft] = React.useState("");

  function submit() {
    if (!draft.trim() || props.pending) {
      return;
    }
    void props.onSubmit(draft).then(
      (sent) => {
        if (sent) {
          setDraft("");
        }
      },
      () => {
        // 发送失败时保留草稿，错误提示由调用方负责
      },
    );
  }

  return (
    <DanmakuComposerView
      draft={draft}
      pending={props.pending}
      onChangeText={(value) => {
        setDraft(clampDanmakuDraft(value));
      }}
      onSubmit={submit}
      onClose={props.onClose}
    />
  );
}
