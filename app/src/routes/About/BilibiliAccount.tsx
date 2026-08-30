import React from "react";
import { Alert } from "react-native";

import { useBilibiliSession } from "@/features/bilibili-session/useBilibiliSession";
import { showToast } from "@/utils";
import TextAction from "./TextAction";

export default function BilibiliAccount() {
  const { isAuthenticated, control, logout } = useBilibiliSession();
  if (!isAuthenticated && control.phase === "ready") {
    return null;
  }

  async function handleLogout() {
    try {
      await logout();
      showToast("已退出登录");
    } catch {
      showToast("退出登录失败，请重试；B站收藏和本地历史未删除");
    }
  }

  return (
    <TextAction
      text={control.phase === "logout-error" ? "B站账号（退出失败）" : "📺 B站账号"}
      buttons={[
        {
          text: "退出登录",
          loading: control.phase === "logging-out",
          onPress() {
            Alert.alert(
              "退出登录",
              "仅退出本 App 的 B站登录，不删除 B站收藏，保留本地关注缓存和历史。",
              [
                { text: "取消", style: "cancel" },
                {
                  text: "退出",
                  style: "destructive",
                  onPress: () => {
                    void handleLogout();
                  },
                },
              ],
            );
          },
        },
      ]}
    />
  );
}
