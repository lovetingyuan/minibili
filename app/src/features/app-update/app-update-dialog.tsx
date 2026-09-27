import * as Clipboard from "expo-clipboard";
import { ScrollView, View } from "react-native";

import { Dialog } from "@/components/Dialog";
import { Text } from "@/components/styled/rneui";
import { theme } from "@/constants/theme";
import { showToast } from "@/utils";

import { startAppUpdateDownload } from "./controller";
import type { AppUpdateDialogProps } from "./app-update-dialog.types";

export function AppUpdateDialog({ onClose, update, visible }: AppUpdateDialogProps) {
  async function copyDownloadLink() {
    if (!update) {
      return;
    }
    try {
      await Clipboard.setStringAsync(update.downloadLink);
      onClose();
      showToast("已复制下载链接");
    } catch {
      showToast("复制下载链接失败");
    }
  }

  function downloadUpdate() {
    if (!update) {
      return;
    }
    const result = startAppUpdateDownload({
      downloadUrl: update.downloadLink,
      releaseName: update.release.version,
      version: update.latestVersion,
    });
    if (result === "unsupported") {
      showToast("当前平台不支持应用内更新");
      return;
    }
    onClose();
  }

  return (
    <Dialog visible={visible && update !== null} onClose={onClose} className="max-w-md">
      <Dialog.Title title="发现新版本 🎉" />

      {update ? (
        <>
          <View
            className={`mb-4 flex-row items-center justify-center gap-3 rounded-xl p-3 ${theme.primary.tint}`}
          >
            <Text selectable className={`font-medium ${theme.text.secondary}`}>
              v{update.currentVersion}
            </Text>
            <Text className={theme.primary.text}>⟶</Text>
            <Text selectable className={`text-lg font-semibold ${theme.primary.text}`}>
              v{update.latestVersion}
            </Text>
          </View>

          <Text className={`mb-2 text-sm font-semibold ${theme.text.heading}`}>更新内容</Text>
          <ScrollView className="max-h-52" nestedScrollEnabled>
            <Text selectable className={`text-sm leading-6 ${theme.text.secondary}`}>
              {update.release.changelog || "修复已知问题，提升使用体验。"}
            </Text>
          </ScrollView>

          <Dialog.Actions className="mt-4">
            <Dialog.Button title="下载新版" onPress={downloadUpdate} />
            <Dialog.Button title="复制链接" onPress={() => void copyDownloadLink()} />
            <Dialog.Button title="稍后提醒" titleClassName={theme.text.muted} onPress={onClose} />
          </Dialog.Actions>
        </>
      ) : null}
    </Dialog>
  );
}
