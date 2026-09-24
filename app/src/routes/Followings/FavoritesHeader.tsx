import React from "react";
import { Plus } from "lucide-react-native";
import { Pressable } from "react-native";

import { ThemedIcon } from "@/components/ThemedIcon";
import { theme } from "@/constants/theme";
import { showLoginRequiredAlert } from "@/features/bilibili-session/login-required-alert";
import { bilibiliSession } from "@/features/bilibili-session/session";
import {
  useBilibiliSessionActions,
  useBilibiliSessionState,
} from "@/features/bilibili-session/useBilibiliSession";
import { showToast } from "@/utils";

import CreateFavoriteFolderDialog from "./CreateFavoriteFolderDialog";

export const headerRight = () => <CreateFavoriteFolderButton />;

function CreateFavoriteFolderButton() {
  const { account } = useBilibiliSessionState();
  const { logout } = useBilibiliSessionActions();
  const [visible, setVisible] = React.useState(false);
  const current = account && bilibiliSession.isCurrentAccount(account) ? account : null;
  const accountKey = current ? `${current.mid}:${current.generation}` : null;

  React.useEffect(() => {
    if (!current) {
      setVisible(false);
    }
  }, [current]);

  if (!current) {
    return null;
  }

  function loginRequired(error: Error) {
    setVisible(false);
    showLoginRequiredAlert(error.message, { session: { account: current, logout } });
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="新建收藏夹"
        hitSlop={8}
        className="px-2 py-1"
        onPress={() => setVisible(true)}
      >
        <ThemedIcon icon={Plus} size={24} colorClassName={theme.primary.accent} />
      </Pressable>
      {visible ? (
        <CreateFavoriteFolderDialog
          key={accountKey}
          account={current}
          onClose={() => setVisible(false)}
          onCreated={(folder) => {
            setVisible(false);
            showToast(`已创建收藏夹「${folder.title}」`);
          }}
          onLoginRequired={loginRequired}
        />
      ) : null}
    </>
  );
}
