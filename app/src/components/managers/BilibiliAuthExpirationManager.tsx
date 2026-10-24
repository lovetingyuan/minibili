import React from "react";
import { Alert } from "react-native";

import {
  bilibiliAuthExpiration,
  clearBilibiliAuthExpiration,
} from "@/features/bilibili-session/auth-expiration";
import { bilibiliSession } from "@/features/bilibili-session/session";
import { useBilibiliSession } from "@/features/bilibili-session/useBilibiliSession";
import { openBilibiliLogin } from "@/routes/navigation";

/** 业务接口的未登录响应先复核，只有确认失效后才清理并提示。 */
export default function BilibiliAuthExpirationManager() {
  const snapshot = React.useSyncExternalStore(
    bilibiliAuthExpiration.subscribe,
    bilibiliAuthExpiration.getSnapshot,
  );
  const handledVersion = React.useRef(0);
  const { logout, revalidate, control } = useBilibiliSession();

  React.useEffect(() => {
    if (
      !snapshot.error ||
      snapshot.version <= handledVersion.current ||
      control.phase !== "ready"
    ) {
      return;
    }
    handledVersion.current = snapshot.version;
    if (snapshot.confirmedGeneration === null) {
      void revalidate()
        .catch(() => {})
        .finally(() => {
          if (bilibiliAuthExpiration.getSnapshot().version === snapshot.version) {
            clearBilibiliAuthExpiration();
          }
        });
      return;
    }
    const current = bilibiliSession.getSnapshot();
    if (current.phase !== "ready" || current.generation !== snapshot.confirmedGeneration) {
      return;
    }
    const cleanup = logout().catch(() => {});
    Alert.alert("B站登录已过期，请重新登录", "", [
      { text: "取消", style: "cancel" },
      { text: "去登录", onPress: () => void cleanup.then(openBilibiliLogin) },
    ]);
  }, [control, logout, revalidate, snapshot]);

  return null;
}
