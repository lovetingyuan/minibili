import { ActivityIndicator, ScrollView, View } from "react-native";

import { CheckBox } from "@/components/CheckBox";
import { Dialog } from "@/components/Dialog";
import { Button, Text } from "@/components/styled/rneui";
import { theme } from "@/constants/theme";
import { isLoginRequiredError } from "@/features/bilibili-session/login-required";
import { showToast } from "@/utils";
import type { FavoriteDialogProps } from "./Favorite.types";
import { useFavoriteEditor } from "./useFavoriteEditor";

export default function FavoriteDialog(props: FavoriteDialogProps) {
  const editor = useFavoriteEditor(props);
  // 每行收藏夹都要判断是否选中，用 Set 避免列表变长后反复线性查找
  const selectedFolderIds = new Set(editor.selection?.selectedIds ?? []);
  function close() {
    if (editor.canClose()) {
      props.onClose();
    }
  }
  async function submit() {
    if (await editor.submit()) {
      showToast(editor.selection?.selectedIds.length ? "收藏已更新" : "已取消收藏");
      props.onClose();
    }
  }
  return (
    <Dialog visible onClose={close}>
      <Dialog.Title title="选择收藏夹" />
      {editor.loading ? <ActivityIndicator accessibilityLabel="正在加载收藏夹" /> : null}
      {editor.error ? (
        <View className="gap-2 py-2">
          <Text accessibilityRole="alert" className={theme.error.text}>
            {editor.error.message}
          </Text>
          {isLoginRequiredError(editor.error) ? (
            <Button
              title="去登录"
              type="clear"
              onPress={() => {
                if (editor.error) {
                  props.onLoginRequired(editor.error);
                }
              }}
            />
          ) : !editor.selection || editor.needsReload ? (
            <Button
              title="重试"
              type="clear"
              disabled={editor.loading || editor.busy}
              onPress={() => {
                void editor.reload();
              }}
            />
          ) : null}
        </View>
      ) : null}
      {!editor.loading && editor.selection?.folders.length === 0 ? (
        <View className="gap-2 py-4">
          <Text className={theme.text.muted}>暂无 B站收藏夹，请先到 B站创建收藏夹</Text>
          <Button
            title="刷新"
            type="clear"
            onPress={() => {
              void editor.reload();
            }}
          />
        </View>
      ) : null}
      {/* 弹窗里没有分隔线，靠每行自己的纵向内边距撑开间距，避免列表挤在一起 */}
      <ScrollView className="max-h-[50vh]" keyboardShouldPersistTaps="handled">
        {editor.selection?.folders.map((folder) => (
          <CheckBox
            key={folder.id}
            title={`${folder.title}（${folder.media_count}）`}
            checked={selectedFolderIds.has(folder.id)}
            onPress={() => editor.toggle(folder.id)}
            disabled={editor.loading || editor.busy || editor.needsReload}
            accessibilityRole="checkbox"
            accessibilityLabel={`${folder.title}，${folder.media_count} 个内容`}
            accessibilityState={{
              checked: selectedFolderIds.has(folder.id),
              disabled: editor.loading || editor.busy || editor.needsReload,
            }}
            checkedColorClassName={theme.primary.accent}
            containerClassName="mx-0 border-0 bg-transparent px-0 py-2"
            textClassName={`shrink font-normal ${theme.text.primary}`}
          />
        ))}
      </ScrollView>
      <Dialog.Actions className="mt-3">
        <Dialog.Button
          title="确定"
          loading={editor.busy}
          disabled={!editor.canSubmit || isLoginRequiredError(editor.error)}
          onPress={() => {
            void submit();
          }}
        />
        <Dialog.Button
          title="取消"
          titleClassName={theme.text.muted}
          disabled={editor.busy}
          onPress={close}
        />
      </Dialog.Actions>
    </Dialog>
  );
}
