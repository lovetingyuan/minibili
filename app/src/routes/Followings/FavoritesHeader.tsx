import React from "react";
import { Plus } from "lucide-react-native";
import { Alert, Pressable } from "react-native";

import { ThemedIcon } from "@/components/ThemedIcon";
import { colors } from "@/constants/colors.tw";
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
    Alert.alert("请重新登录 B站", error.message, [
      { text: "取消", style: "cancel" },
      {
        text: "重新登录",
        onPress: () => {
          setVisible(false);
          void logout().catch(() => showToast("退出登录失败，请在设置页重试"));
        },
      },
    ]);
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
        <ThemedIcon icon={Plus} size={24} colorClassName={colors.primary.accent} />
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
