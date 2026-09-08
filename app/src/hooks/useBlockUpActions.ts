import { useNavigation } from "@react-navigation/native";
import { Alert } from "react-native";

import { RelationLoginRequiredError } from "../api/modify-relation";
import type { BlockRelationChange, RelationAccount } from "../api/modify-relation.types";
import { useBlockUp } from "../api/useBlockUp";
import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import { bilibiliSession } from "../features/bilibili-session/session";
import { useBilibiliSessionActions } from "../features/bilibili-session/useBilibiliSession";
import type { NavigationProps } from "../types";
import { showToast } from "../utils";

function assertAccountIsCurrent(account: RelationAccount) {
  if (!bilibiliSession.isCurrentAccount(account)) {
    throw new BilibiliSessionChangedError();
  }
}

export function useBlockUpActions() {
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const mutation = useBlockUp();
  const { logout } = useBilibiliSessionActions();

  async function submit(up: BlockRelationChange["up"], account: RelationAccount) {
    try {
      assertAccountIsCurrent(account);
      await mutation.block(up, account);
      assertAccountIsCurrent(account);
      showToast("已拉黑");
    } catch (error) {
      if (error instanceof RelationLoginRequiredError) {
        Alert.alert("请重新登录 B站", error.message, [
          { text: "取消", style: "cancel" },
          {
            text: "重新登录",
            onPress: () => {
              if (!bilibiliSession.isCurrentAccount(account)) {
                showToast("登录状态已改变，请重新操作");
                return;
              }
              void logout()
                .then(() => navigation.navigate("MainTabs", { screen: "Followings" }))
                .catch(() => showToast("退出登录失败，请在设置页重试"));
            },
          },
        ]);
      } else {
        showToast(
          error instanceof BilibiliSessionChangedError
            ? "登录状态已改变，请重新操作"
            : error instanceof Error
              ? error.message
              : "拉黑操作失败，请稍后重试",
        );
      }
    }
  }

  function confirmBlock(up: BlockRelationChange["up"]) {
    if (mutation.isPreparing) {
      showToast("登录状态更新中，请稍候再试");
      return;
    }
    if (!mutation.account) {
      showToast("请先登录 B站，登录后重新点击拉黑");
      navigation.navigate("MainTabs", { screen: "Followings" });
      return;
    }
    if (mutation.isMutating) {
      showToast("关系操作正在进行，请稍候");
      return;
    }
    const target = { mid: up.mid, name: up.name };
    const account = { mid: mutation.account.mid, generation: mutation.account.generation };
    Alert.alert(`拉黑 UP 主「${target.name}」？`, "将加入当前 B 站账号的黑名单", [
      { text: "取消", style: "cancel" },
      {
        text: "拉黑",
        style: "destructive",
        onPress: () => {
          void submit(target, account);
        },
      },
    ]);
  }

  return { confirmBlock };
}
