import { KeyboardAvoidingView, Platform, TextInput, View } from "react-native";

import { Dialog, Switch, Text } from "@/components/styled/rneui";
import { colors } from "@/constants/colors.tw";
import { FAVORITE_FOLDER_NAME_MAX_LENGTH } from "@/features/bilibili-favorites/folder-name";
import type { CreateFavoriteFolderDialogProps } from "./Favorites.types";
import { useCreateFavoriteFolder } from "./useCreateFavoriteFolder";

export default function CreateFavoriteFolderDialog(props: CreateFavoriteFolderDialogProps) {
  const editor = useCreateFavoriteFolder(props);
  function close() {
    if (editor.canClose()) props.onClose();
  }
  return (
    <Dialog
      isVisible
      overlayClassName={`w-[90%] max-w-lg rounded-xl ${colors.white.bg}`}
      onBackdropPress={close}
      onRequestClose={close}
    >
      <Dialog.Title title="新建收藏夹" titleClassName={colors.black.text} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <TextInput
          value={editor.title}
          autoFocus
          editable={!editor.saving}
          placeholder="收藏夹名称"
          returnKeyType="done"
          accessibilityLabel="收藏夹名称"
          className={`rounded-lg border px-3 py-2 text-base ${colors.gray3.border} ${colors.black.text}`}
          onChangeText={editor.setTitle}
          onSubmitEditing={() => {
            void editor.submit();
          }}
        />
        <View className="mt-1 flex-row items-start justify-between gap-2">
          <Text
            accessibilityRole={editor.nameError ? "alert" : undefined}
            className={`shrink text-xs ${editor.nameError ? colors.error.text : colors.gray6.text}`}
          >
            {editor.nameError ?? `名称最长 ${FAVORITE_FOLDER_NAME_MAX_LENGTH} 个字`}
          </Text>
          <Text
            className={`text-xs tabular-nums ${editor.count > FAVORITE_FOLDER_NAME_MAX_LENGTH ? colors.warning.text : colors.gray6.text}`}
          >
            {editor.count}/{FAVORITE_FOLDER_NAME_MAX_LENGTH}
          </Text>
        </View>
        <View className="mt-4 flex-row items-center justify-between gap-2">
          <Text className={colors.black.text}>仅自己可见</Text>
          <Switch
            value={editor.isPrivate}
            disabled={editor.saving}
            accessibilityLabel="仅自己可见"
            onValueChange={editor.setIsPrivate}
            colorClassName={colors.primary.accent}
            trackColorOnClassName={colors.primary.accent}
            trackColorOffClassName={colors.gray4.accent}
          />
        </View>
        <Text className={`mt-1 text-xs ${colors.gray6.text}`}>
          关闭时收藏夹会在你的 B站 主页公开
        </Text>
        {editor.error ? (
          <View className="mt-3">
            <Text accessibilityRole="alert" className={`text-sm ${colors.error.text}`}>
              {editor.error.message}
            </Text>
          </View>
        ) : null}
      </KeyboardAvoidingView>
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
          titleClassName={colors.gray6.text}
          disabled={editor.saving}
          onPress={close}
        />
      </Dialog.Actions>
    </Dialog>
  );
}
