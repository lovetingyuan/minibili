import React from "react";
import { Alert, Linking, Platform } from "react-native";

import { saveImageToLibrary } from "@/components/image-viewer-download";
import type { SaveImageResult } from "@/components/image-viewer-download";
import { showToast } from "@/utils";

async function ensureWritePermission() {
  const { requestPermissionsAsync } = await import("expo-media-library");
  const permission = await requestPermissionsAsync(true, ["photo"]);
  return permission.status === "granted";
}

export function useSaveImage() {
  const [saving, setSaving] = React.useState(false);

  const saveImage = async (uri: string) => {
    if (saving) {
      return;
    }

    if (Platform.OS === "web") {
      void Linking.openURL(uri);
      return;
    }

    setSaving(true);
    let result: SaveImageResult = "failed";

    try {
      result = await saveImageToLibrary(uri, ensureWritePermission);
    } catch {
      result = "failed";
    }

    setSaving(false);

    if (result === "saved") {
      showToast("已保存到相册");
      return;
    }

    if (result === "permission-denied") {
      Alert.alert("需要相册权限", "请在系统设置中允许 MiniBili 保存图片到相册。", [
        { text: "取消", style: "cancel" },
        {
          text: "去设置",
          onPress: () => {
            void Linking.openSettings();
          },
        },
      ]);
      return;
    }

    showToast("下载失败，请稍后重试");
  };

  return { saving, saveImage };
}
