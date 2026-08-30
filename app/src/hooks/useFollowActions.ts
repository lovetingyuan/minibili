import { useNavigation } from "@react-navigation/native";
import { Alert } from "react-native";

import { RelationLoginRequiredError } from "../api/modify-relation";
import { useModifyRelation } from "../api/useModifyRelation";
import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import { bilibiliSession } from "../features/bilibili-session/session";
import { useBilibiliSessionActions } from "../features/bilibili-session/useBilibiliSession";
import type { NavigationProps, UpInfo } from "../types";
import { showToast } from "../utils";

export function useFollowActions() {
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const mutation = useModifyRelation();
  const { logout } = useBilibiliSessionActions();

  async function act(up: UpInfo, follow: boolean) {
    if (mutation.account === null) {
      showToast("请先登录 B站，登录后重新点击关注");
      navigation.navigate("Follow");
      return;
    }
    if (!mutation.isReady) {
      showToast("请先完成登录和 B站关注列表同步");
      navigation.navigate("Follow");
      return;
    }
    try {
      await (follow ? mutation.follow(up) : mutation.unfollow(up));
      showToast(follow ? "已关注" : "已取消关注");
    } catch (error) {
      if (error instanceof RelationLoginRequiredError) {
        Alert.alert("请重新登录 B站", error.message, [
          { text: "取消", style: "cancel" },
          {
            text: "重新登录",
            onPress: () => {
              if (!mutation.account || !bilibiliSession.isCurrentAccount(mutation.account)) {
                showToast("登录状态已改变，请重新操作");
                return;
              }
              // 用户确认后退出，Follow 页的会话检查会显示已有登录入口。
              void logout()
                .then(() => navigation.navigate("Follow"))
                .catch(() => {
                  showToast("退出登录失败，请在设置页重试");
                });
            },
          },
        ]);
      } else {
        showToast(
          error instanceof BilibiliSessionChangedError
            ? "登录状态已改变，请重新操作"
            : error instanceof Error
              ? error.message
              : "关注操作失败，请稍后重试",
        );
      }
    }
  }

  return {
    follow: (up: UpInfo) => act(up, true),
    unfollow: (up: UpInfo) => act(up, false),
    disabled: mutation.isMutating || mutation.isPreparing,
    pendingMid: mutation.pendingMid,
    isPreparing: mutation.isPreparing,
  };
}
