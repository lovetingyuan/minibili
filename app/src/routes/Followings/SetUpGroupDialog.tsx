import React from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";

import { RelationTagLoginRequiredError } from "@/api/relation-tags";
import { useBilibiliUpRelationTags } from "@/api/useBilibiliRelationTags";
import { CheckBox } from "@/components/CheckBox";
import { Button, Dialog, Text } from "@/components/styled/rneui";
import { colors } from "@/constants/colors.tw";

import type { SetUpGroupDialogProps } from "./FollowGroups.types";

export default function SetUpGroupDialog({
  up,
  groups,
  onClose,
  onSubmit,
  onLoginRequired,
}: SetUpGroupDialogProps) {
  const current = useBilibiliUpRelationTags(up.mid);
  const [selected, setSelected] = React.useState<number[] | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const initialized = React.useRef(false);

  React.useEffect(() => {
    if (initialized.current || !current.data) {
      return;
    }
    initialized.current = true;
    setSelected(current.data);
  }, [current.data]);

  const selectedIds = selected ?? [];
  const selectedIdSet = new Set(selectedIds);
  const canSubmit = selected !== null && !submitting;

  function toggle(tagid: number) {
    setSelected((previous) => {
      const ids = previous ?? [];
      return ids.includes(tagid) ? ids.filter((id) => id !== tagid) : [...ids, tagid];
    });
  }

  async function submit() {
    if (!canSubmit) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(selectedIds);
    } catch (cause) {
      const failure = cause instanceof Error ? cause : new Error("设置分组失败，请稍后重试");
      if (failure instanceof RelationTagLoginRequiredError) {
        onLoginRequired(failure);
        return;
      }
      setError(failure);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      isVisible
      overlayClassName={`w-[90%] max-w-lg rounded-xl ${colors.white.bg}`}
      onBackdropPress={submitting ? undefined : onClose}
      onRequestClose={submitting ? undefined : onClose}
    >
      <Dialog.Title title="设置分组" titleClassName={colors.black.text} />
      <Text className={`mb-2 text-sm ${colors.gray6.text}`} numberOfLines={1}>
        {up.name}
      </Text>
      {current.data === undefined ? (
        <View className="items-center gap-3 py-6">
          {current.error ? (
            <>
              <Text className="text-center">当前分组加载失败，请检查网络后重试</Text>
              <Button
                title="重试"
                loading={current.isValidating}
                onPress={() => {
                  void current.mutate().catch(() => {});
                }}
              />
            </>
          ) : (
            <ActivityIndicator />
          )}
        </View>
      ) : groups.length ? (
        <ScrollView className="max-h-72" nestedScrollEnabled>
          {groups.map((group) => (
            <CheckBox
              key={group.tagid}
              checked={selectedIdSet.has(group.tagid)}
              disabled={submitting}
              title={`${group.name}（${group.count}）`}
              onPress={() => {
                toggle(group.tagid);
              }}
              containerClassName="bg-transparent py-1 pl-0"
              textClassName={colors.gray8.text}
              checkedColorClassName={colors.primary.accent}
            />
          ))}
        </ScrollView>
      ) : (
        <Text className={`py-4 text-sm ${colors.gray6.text}`}>
          还没有可选分组，请先在关注页新建分组
        </Text>
      )}
      {error ? (
        <Text accessibilityRole="alert" className={`mt-2 text-sm ${colors.error.text}`}>
          {error.message}
        </Text>
      ) : null}
      <Dialog.Actions>
        <Dialog.Button
          title="确定"
          loading={submitting}
          disabled={!canSubmit}
          onPress={() => {
            void submit();
          }}
        />
        <Dialog.Button
          title="取消"
          titleClassName={colors.gray6.text}
          disabled={submitting}
          onPress={onClose}
        />
      </Dialog.Actions>
    </Dialog>
  );
}
