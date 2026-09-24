import { useNavigation } from "@react-navigation/native";

import { useModifyRelation } from "../api/useModifyRelation";
import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import {
  handleLoginRequiredError,
  showLoginRequiredAlert,
} from "../features/bilibili-session/login-required-alert";
import { useBilibiliSessionActions } from "../features/bilibili-session/useBilibiliSession";
import type { NavigationProps, UpInfo } from "../types";
import { showToast } from "../utils";

export function useFollowActions() {
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const mutation = useModifyRelation();
  const { logout } = useBilibiliSessionActions();

  async function act(up: UpInfo, follow: boolean) {
    if (mutation.account === null) {
      showLoginRequiredAlert("请先登录 B站，登录后重新点击关注");
      return;
    }
    if (!mutation.isReady) {
      showToast("请先完成登录和 B站关注列表同步");
      navigation.navigate("MainTabs", { screen: "Followings" });
      return;
    }
    try {
      await (follow ? mutation.follow(up) : mutation.unfollow(up));
      showToast(follow ? "已关注" : "已取消关注");
    } catch (error) {
      if (
        handleLoginRequiredError(error, "请先登录 B站后重新操作", {
          session: { account: mutation.account, logout },
        })
      ) {
        return;
      }
      showToast(
        error instanceof BilibiliSessionChangedError
          ? "登录状态已改变，请重新操作"
          : error instanceof Error
            ? error.message
            : "关注操作失败，请稍后重试",
      );
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
