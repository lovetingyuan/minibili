import React from "react";

import { mergeFollowedUps, useBilibiliFollowings } from "@/api/followings";
import { BilibiliSessionChangedError } from "@/features/bilibili-session/controller";
import { isLoginRequiredError } from "@/features/bilibili-session/login-required";
import { bilibiliSession } from "@/features/bilibili-session/session";
import { useBilibiliSession } from "@/features/bilibili-session/useBilibiliSession";
import { getStoreMethods, useStore } from "@/store";
import { showToast } from "@/utils";

function BilibiliFollowingsManager() {
  const { initialed } = useStore();
  const { account, control } = useBilibiliSession();
  const notifiedErrorKeyRef = React.useRef("");
  const enabled =
    initialed && control.phase === "ready" && account && account.generation === control.generation;
  const { data, error } = useBilibiliFollowings(
    enabled ? account.mid : undefined,
    account?.generation,
    () => Boolean(account && bilibiliSession.isCurrentAccount(account)),
  );

  React.useEffect(() => {
    if (!enabled || !account || !data || !bilibiliSession.isCurrentAccount(account)) {
      return;
    }

    const methods = getStoreMethods();
    const currentUps = methods.get$followedUps();
    const mergedUps = mergeFollowedUps(currentUps, data);
    if (mergedUps !== currentUps) {
      methods.set$followedUps(mergedUps);
    }
    methods.setFollowingsGeneration(account.generation);
  }, [account, data, enabled]);

  React.useEffect(() => {
    if (!error) {
      notifiedErrorKeyRef.current = "";
    }
    if (
      !enabled ||
      !account ||
      !error ||
      !bilibiliSession.isCurrentAccount(account) ||
      error instanceof BilibiliSessionChangedError ||
      isLoginRequiredError(error)
    ) {
      return;
    }

    const errorKey = `${account.mid}:${account.generation}`;
    if (notifiedErrorKeyRef.current !== errorKey) {
      notifiedErrorKeyRef.current = errorKey;
      showToast("关注列表刷新失败，请稍后重试", true);
    }
  }, [account, enabled, error]);

  return null;
}

export default BilibiliFollowingsManager;
