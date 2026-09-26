import { useIsFocused } from "@react-navigation/native";
import { Star } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable } from "react-native";

import { useVideoRelation } from "@/api/useVideoFavorites";
import { Text } from "@/components/styled/rneui";
import { ThemedIcon } from "@/components/ThemedIcon";
import { theme } from "@/constants/theme";
import { showLoginRequiredAlert } from "@/features/bilibili-session/login-required-alert";
import { bilibiliSession } from "@/features/bilibili-session/session";
import {
  useBilibiliSessionActions,
  useBilibiliSessionState,
} from "@/features/bilibili-session/useBilibiliSession";
import { parseNumber, showToast } from "@/utils";
import type { FavoriteButtonContentProps, FavoriteButtonProps } from "./Favorite.types";
import FavoriteDialog from "./FavoriteDialog";

export default function FavoriteButton(props: FavoriteButtonProps) {
  const { account, control } = useBilibiliSessionState();
  const current = account && bilibiliSession.isCurrentAccount(account) ? account : null;
  return (
    <FavoriteButtonContent
      key={`${current?.mid}:${current?.generation}:${props.aid}:${props.bvid}`}
      {...props}
      account={current}
      preparing={account === undefined || control.phase !== "ready" || Boolean(account && !current)}
    />
  );
}

function FavoriteButtonContent({
  aid,
  bvid,
  count,
  account,
  preparing,
}: FavoriteButtonContentProps) {
  const [visible, setVisible] = useState(false);
  const focused = useIsFocused();
  const { logout } = useBilibiliSessionActions();
  const video = aid ? { aid: String(aid), bvid } : null;
  const relation = useVideoRelation(account, video);
  const favorite = relation.data?.favorite === true;

  useEffect(() => {
    if (!focused) {
      setVisible(false);
    }
  }, [focused]);

  function open() {
    if (preparing) {
      showToast("正在确认登录状态，请稍候重试");
      return;
    }
    if (!account) {
      showLoginRequiredAlert("请先登录 B站，登录后重新点击收藏");
      return;
    }
    if (!video) {
      showToast("视频信息尚未加载完成，请稍候重试");
      return;
    }
    setVisible(true);
  }

  function loginRequired(error: Error) {
    setVisible(false);
    showLoginRequiredAlert(error.message, { session: { account, logout } });
  }

  return (
    <>
      <Pressable
        className="min-w-0 flex-1 flex-row items-center justify-center gap-1 px-0.5 py-1"
        accessibilityRole="button"
        accessibilityLabel={`${favorite ? "已收藏，编辑收藏夹" : "收藏视频"}，收藏数 ${count ?? "加载中"}`}
        accessibilityState={{ selected: favorite, busy: relation.isLoading }}
        hitSlop={6}
        onPress={open}
      >
        <ThemedIcon
          icon={Star}
          filled={favorite}
          size={16}
          colorClassName={favorite ? theme.primary.accent : theme.icon.primary}
        />
        <Text className={`text-xs ${favorite ? theme.primary.text : theme.text.primary}`}>
          {parseNumber(count)}
        </Text>
      </Pressable>
      {visible && focused && account && video ? (
        <FavoriteDialog
          account={account}
          video={video}
          onClose={() => setVisible(false)}
          onLoginRequired={loginRequired}
        />
      ) : null}
    </>
  );
}
