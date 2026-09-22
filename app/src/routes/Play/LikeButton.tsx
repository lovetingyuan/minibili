import { useIsFocused, useNavigation } from "@react-navigation/native";
import { ThumbsUp } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Alert, Pressable } from "react-native";

import { useVideoLike } from "@/api/useVideoLike";
import { FavoriteLoginRequiredError } from "@/api/video-favorites";
import { VideoLikeLoginRequiredError } from "@/api/video-like";
import { Text } from "@/components/styled/rneui";
import { ThemedIcon } from "@/components/ThemedIcon";
import { colors } from "@/constants/colors.tw";
import { bilibiliSession } from "@/features/bilibili-session/session";
import {
  useBilibiliSessionActions,
  useBilibiliSessionState,
} from "@/features/bilibili-session/useBilibiliSession";
import type { NavigationProps } from "@/types";
import { parseNumber, showToast } from "@/utils";
import type { LikeButtonContentProps, LikeButtonProps } from "./Like.types";

export default function LikeButton(props: LikeButtonProps) {
  const { account, control } = useBilibiliSessionState();
  const current = account && bilibiliSession.isCurrentAccount(account) ? account : null;
  return (
    <LikeButtonContent
      key={`${current?.mid}:${current?.generation}:${props.aid}:${props.bvid}`}
      {...props}
      account={current}
      preparing={account === undefined || control.phase !== "ready" || Boolean(account && !current)}
    />
  );
}

function LikeButtonContent({ aid, bvid, count, account, preparing }: LikeButtonContentProps) {
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const { logout } = useBilibiliSessionActions();
  const mutation = useVideoLike(account, aid ? { aid: String(aid), bvid } : null);
  const focused = useIsFocused();
  const active = useRef(false);
  useEffect(() => {
    active.current = focused;
    return () => {
      active.current = false;
    };
  }, [focused]);

  async function press() {
    if (preparing) {
      showToast("正在确认登录状态，请稍候重试");
      return;
    }
    if (!account) {
      showToast("请先登录 B站，登录后重新点击点赞");
      navigation.navigate("MainTabs", { screen: "Followings" });
      return;
    }
    if (!aid) {
      showToast("视频信息尚未加载完成，请稍候重试");
      return;
    }
    try {
      const liked = await mutation.toggle();
      if (active.current && bilibiliSession.isCurrentAccount(account)) {
        showToast(liked === null ? "点赞状态已更新，请再次点击" : liked ? "已点赞" : "已取消点赞");
      }
    } catch (error) {
      if (!active.current || !bilibiliSession.isCurrentAccount(account)) {
        return;
      }
      if (
        error instanceof VideoLikeLoginRequiredError ||
        error instanceof FavoriteLoginRequiredError
      ) {
        Alert.alert("请重新登录 B站", error.message, [
          { text: "取消", style: "cancel" },
          {
            text: "重新登录",
            onPress: () => {
              if (!active.current || !bilibiliSession.isCurrentAccount(account)) {
                return;
              }
              void logout()
                .then(() => navigation.navigate("MainTabs", { screen: "Followings" }))
                .catch(() => showToast("退出登录失败，请在设置页重试"));
            },
          },
        ]);
      } else {
        showToast(error instanceof Error ? error.message : "点赞失败，请稍后重试");
      }
    }
  }

  return (
    <Pressable
      className="min-w-0 flex-1 flex-row items-center justify-center gap-1 px-0.5 py-1"
      accessibilityRole="button"
      accessibilityLabel={`${mutation.liked ? "已点赞，点击取消点赞" : "点赞视频"}，点赞数 ${count ?? "加载中"}`}
      accessibilityState={{
        selected: mutation.liked,
        disabled: mutation.isMutating,
        busy: mutation.isMutating || mutation.isLoading,
      }}
      disabled={mutation.isMutating}
      hitSlop={6}
      onPress={() => {
        void press();
      }}
    >
      {mutation.isMutating ? (
        <ActivityIndicator size="small" />
      ) : (
        <ThemedIcon
          icon={ThumbsUp}
          filled={mutation.liked}
          size={18}
          colorClassName={mutation.liked ? colors.primary.accent : colors.gray8.accent}
        />
      )}
      <Text className={`text-xs ${mutation.liked ? colors.primary.text : colors.gray8.text}`}>
        {parseNumber(count)}
      </Text>
    </Pressable>
  );
}
