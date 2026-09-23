import React from "react";
import { TextInput } from "react-native";

import { Dialog } from "@/components/Dialog";
import { Text } from "@/components/styled/rneui";
import { theme } from "@/constants/theme";

import type { GroupNameDialogProps } from "./FollowGroups.types";

export default function GroupNameDialog({
  mode,
  initialName = "",
  saving,
  error,
  onClose,
  onSubmit,
}: GroupNameDialogProps) {
  const [name, setName] = React.useState(initialName);
  const trimmed = name.trim();
  const unchanged = mode === "rename" && trimmed === initialName.trim();
  const canSubmit = Boolean(trimmed) && !unchanged && !saving;
  const title = mode === "create" ? "新建分组" : "修改分组名称";

  return (
    <Dialog visible onClose={saving ? undefined : onClose}>
      <Dialog.Title title={title} />
      <TextInput
        value={name}
        autoFocus
        editable={!saving}
        placeholder="分组名称"
        returnKeyType="done"
        accessibilityLabel="分组名称"
        className={`rounded-lg border px-3 py-2 text-base ${theme.border.outline} ${theme.text.primary}`}
        onChangeText={setName}
        onSubmitEditing={() => {
          if (canSubmit) {
            onSubmit(trimmed);
          }
        }}
      />
      <Text className={`mt-1 text-xs ${theme.text.muted}`}>分组名称不能为空</Text>
      {error ? (
        <Text accessibilityRole="alert" className={`mt-2 text-sm ${theme.error.text}`}>
          {error.message}
        </Text>
      ) : null}
      <Dialog.Actions>
        <Dialog.Button
          title="保存"
          loading={saving}
          disabled={!canSubmit}
          onPress={() => {
            onSubmit(trimmed);
          }}
        />
        <Dialog.Button
          title="取消"
          titleClassName={theme.text.muted}
          disabled={saving}
          onPress={onClose}
        />
      </Dialog.Actions>
    </Dialog>
  );
}
