import { TextInput, View } from "react-native";

import { Dialog } from "@/components/Dialog";
import { Switch, Text } from "@/components/styled/rneui";
import { theme } from "@/constants/theme";
import { FAVORITE_FOLDER_NAME_MAX_LENGTH } from "@/features/bilibili-favorites/folder-name";
import type { CreateFavoriteFolderDialogProps } from "./Favorites.types";
import { useCreateFavoriteFolder } from "./useCreateFavoriteFolder";

export default function CreateFavoriteFolderDialog(props: CreateFavoriteFolderDialogProps) {
  const editor = useCreateFavoriteFolder(props);
  function close() {
    if (editor.canClose()) {
      props.onClose();
    }
  }
  return (
    <Dialog visible onClose={close}>
      <Dialog.Title title="新建收藏夹" />
      <TextInput
        value={editor.title}
        autoFocus
        editable={!editor.saving}
        placeholder="收藏夹名称"
        returnKeyType="done"
        accessibilityLabel="收藏夹名称"
        className={`rounded-lg border px-3 py-2 text-base ${theme.border.outline} ${theme.text.primary}`}
        onChangeText={editor.setTitle}
        onSubmitEditing={() => {
          void editor.submit();
        }}
      />
      <View className="mt-1 flex-row items-start justify-between gap-2">
        <Text
          accessibilityRole={editor.nameError ? "alert" : undefined}
          className={`shrink text-xs ${editor.nameError ? theme.error.text : theme.text.muted}`}
        >
          {editor.nameError ?? `名称最长 ${FAVORITE_FOLDER_NAME_MAX_LENGTH} 个字`}
        </Text>
        <Text
          className={`text-xs tabular-nums ${editor.count > FAVORITE_FOLDER_NAME_MAX_LENGTH ? theme.warning.text : theme.text.muted}`}
        >
          {editor.count}/{FAVORITE_FOLDER_NAME_MAX_LENGTH}
        </Text>
      </View>
      <View className="mt-4 flex-row items-center justify-between gap-2">
        <Text className={theme.text.primary}>仅自己可见</Text>
        <Switch
          value={editor.isPrivate}
          disabled={editor.saving}
          accessibilityLabel="仅自己可见"
          onValueChange={editor.setIsPrivate}
          colorClassName={theme.primary.accent}
          trackColorOnClassName={theme.primary.accent}
          trackColorOffClassName={theme.background.fillMuted.accent}
        />
      </View>
      {editor.error ? (
        <View className="mt-3">
          <Text accessibilityRole="alert" className={`text-sm ${theme.error.text}`}>
            {editor.error.message}
          </Text>
        </View>
      ) : null}
      <Dialog.Actions>
        <Dialog.Button
          title="保存"
          loading={editor.saving}
          disabled={!editor.canSubmit}
          onPress={() => {
            void editor.submit();
          }}
        />
        <Dialog.Button
          title="取消"
          titleClassName={theme.text.muted}
          disabled={editor.saving}
          onPress={close}
        />
      </Dialog.Actions>
    </Dialog>
  );
}
