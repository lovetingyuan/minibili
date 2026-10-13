import { EllipsisVertical } from "lucide-react-native";
import React from "react";
import { Alert } from "react-native";

import { useBilibiliWatchLater, useClearWatchLater } from "@/api/useWatchLater";
import type { WatchLaterAccount, WatchLaterClearMode } from "@/api/watch-later.types";
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
  menuTriggerIconButtonStyles,
} from "@/components/Menu";
import { ThemedIcon } from "@/components/ThemedIcon";
import { handleLoginRequiredError } from "@/features/bilibili-session/login-required-alert";
import { bilibiliSession } from "@/features/bilibili-session/session";
import {
  useBilibiliSessionActions,
  useBilibiliSessionState,
} from "@/features/bilibili-session/useBilibiliSession";
import { watchLaterMutations } from "@/features/bilibili-watch-later/mutations";
import { showToast } from "@/utils";

export const headerRight = () => <WatchLaterHeader />;

function WatchLaterHeader() {
  const { account } = useBilibiliSessionState();
  if (!account || !bilibiliSession.isCurrentAccount(account)) {
    return null;
  }
  return (
    <WatchLaterMenu
      key={`${account.mid}:${account.generation}`}
      mid={account.mid}
      generation={account.generation}
    />
  );
}

function WatchLaterMenu(account: WatchLaterAccount) {
  const [visible, setVisible] = React.useState(false);
  const watchLater = useBilibiliWatchLater();
  const mutation = useClearWatchLater();
  const { logout } = useBilibiliSessionActions();
  const disabled = !watchLater.data || !watchLater.items.length || mutation.isPending;

  function hideMenu() {
    setVisible(false);
  }

  async function clear(mode: WatchLaterClearMode) {
    if (!bilibiliSession.isCurrentAccount(account)) {
      showToast("登录状态已改变，请重新操作");
      return;
    }
    if (watchLaterMutations.hasPending(account)) {
      showToast("稍后再看操作正在进行，请稍候");
      return;
    }
    try {
      const refreshed = await mutation.clear(account, mode);
      if (bilibiliSession.isCurrentAccount(account)) {
        showToast(
          refreshed
            ? mode === "finished"
              ? "已清除已看完视频"
              : "已清除全部视频"
            : "已清除，列表刷新失败，请重试",
        );
      }
    } catch (error) {
      if (!bilibiliSession.isCurrentAccount(account)) {
        showToast("登录状态已改变，请重新操作");
        return;
      }
      if (
        !handleLoginRequiredError(error, "请先登录 B站后重新操作", {
          session: { account, logout },
        })
      ) {
        showToast(error instanceof Error ? error.message : "清除失败，请稍后重试");
      }
    }
  }

  function confirm(mode: WatchLaterClearMode) {
    hideMenu();
    Alert.alert(mode === "finished" ? "清除已看完？" : "清除全部？", "清除后将从稍后再看移除", [
      { text: "取消", style: "cancel" },
      {
        text: "清除",
        style: "destructive",
        onPress: () => {
          void clear(mode);
        },
      },
    ]);
  }

  return (
    <Menu opened={visible} onBackdropPress={hideMenu} onClose={hideMenu}>
      <MenuTrigger
        accessibilityRole="button"
        accessibilityLabel="稍后再看更多操作"
        customStyles={menuTriggerIconButtonStyles}
        onPress={() => setVisible(true)}
      >
        <ThemedIcon icon={EllipsisVertical} />
      </MenuTrigger>
      <MenuOptions>
        <MenuOption text="清除已看完" disabled={disabled} onSelect={() => confirm("finished")} />
        <MenuOption text="清除全部" disabled={disabled} onSelect={() => confirm("all")} />
      </MenuOptions>
    </Menu>
  );
}
