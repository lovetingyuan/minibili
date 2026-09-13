import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

import { BilibiliSessionChangedError } from "@/features/bilibili-session/controller";
import { bilibiliSession } from "@/features/bilibili-session/session";
import {
  useBilibiliSessionActions,
  useBilibiliSessionState,
} from "@/features/bilibili-session/useBilibiliSession";
import type { NavigationProps } from "@/types";
import { showToast } from "@/utils";

import {
  addCommentReply,
  CommentLoginRequiredError,
  CommentResultUnknownError,
  modifyCommentAttitude,
} from "./comment-actions";
import type { CommentAttitude, CommentAttitudeKind, CommentTarget } from "./comment-actions.types";
import type { ReplyItemType } from "./comments.types";
import { getBilibiliLoginCookie } from "./get-cookie";

export function useCommentActions(sourceUrl: string, refreshAfterUnknown: () => Promise<unknown>) {
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const { account, control } = useBilibiliSessionState();
  const { logout } = useBilibiliSessionActions();
  const currentAccount = account && bilibiliSession.isCurrentAccount(account) ? account : null;
  const preparing =
    account === undefined || control.phase !== "ready" || Boolean(account && !currentAccount);
  const [pending, setPending] = useState<Set<string>>(() => new Set());
  const pendingRef = useRef(new Set<string>());
  const focused = useIsFocused();
  const active = useRef(focused);

  useEffect(() => {
    active.current = focused;
    return () => {
      active.current = false;
    };
  }, [focused]);

  function requireAccount() {
    if (preparing) {
      showToast("正在确认登录状态，请稍候重试");
      return null;
    }
    if (!currentAccount) {
      showToast("请先登录 B站，登录后即可参与评论互动");
      navigation.navigate("MainTabs", { screen: "Followings" });
      return null;
    }
    return currentAccount;
  }

  function startPending(key: string) {
    if (pendingRef.current.has(key)) return false;
    pendingRef.current.add(key);
    setPending(new Set(pendingRef.current));
    return true;
  }

  function finishPending(key: string) {
    pendingRef.current.delete(key);
    setPending(new Set(pendingRef.current));
  }

  async function handleError(error: unknown, actionName: string) {
    if (error instanceof CommentResultUnknownError) {
      if (active.current) showToast(error.message);
      await refreshAfterUnknown().catch(() => {});
      return;
    }
    if (!active.current) return;
    if (error instanceof CommentLoginRequiredError) {
      Alert.alert("请重新登录 B站", error.message, [
        { text: "取消", style: "cancel" },
        {
          text: "重新登录",
          onPress: () => {
            void logout()
              .then(() => navigation.navigate("MainTabs", { screen: "Followings" }))
              .catch(() => showToast("退出登录失败，请在设置页重试"));
          },
        },
      ]);
      return;
    }
    if (!(error instanceof BilibiliSessionChangedError)) {
      showToast(error instanceof Error ? error.message : `${actionName}失败，请稍后重试`);
    }
  }

  async function changeAttitude(
    target: CommentTarget,
    current: CommentAttitude,
    kind: CommentAttitudeKind,
  ): Promise<CommentAttitude | null> {
    const confirmedAccount = requireAccount();
    const key = `attitude:${target.id}`;
    if (!confirmedAccount || !startPending(key)) return null;
    const next: CommentAttitude = current === kind ? "none" : kind;
    try {
      await modifyCommentAttitude(
        confirmedAccount,
        { target, kind, active: next === kind, sourceUrl },
        {
          readCookie: getBilibiliLoginCookie,
          isCurrentAccount: bilibiliSession.isCurrentAccount,
        },
      );
      return next;
    } catch (error) {
      await handleError(error, kind === "like" ? "点赞" : "点踩");
      return null;
    } finally {
      finishPending(key);
    }
  }

  async function submitReply(
    target: CommentTarget,
    message: string,
  ): Promise<ReplyItemType | null> {
    const confirmedAccount = requireAccount();
    const key = `reply:${target.id}`;
    if (!confirmedAccount || !startPending(key)) return null;
    try {
      return await addCommentReply(
        confirmedAccount,
        { target, message, sourceUrl },
        {
          readCookie: getBilibiliLoginCookie,
          isCurrentAccount: bilibiliSession.isCurrentAccount,
        },
      );
    } catch (error) {
      await handleError(error, "回复");
      return null;
    } finally {
      finishPending(key);
    }
  }

  return {
    changeAttitude,
    submitReply,
    isAttitudePending: (id: string) => pending.has(`attitude:${id}`),
    isReplyPending: (id: string) => pending.has(`reply:${id}`),
  };
}
