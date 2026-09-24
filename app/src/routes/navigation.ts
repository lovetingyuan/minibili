import { createNavigationContainerRef } from "@react-navigation/native";

import type { RootStackParamList } from "@/types";

export const rootNavigationRef = createNavigationContainerRef<RootStackParamList>();

let pendingBilibiliLogin = false;

function navigateToBilibiliLogin() {
  rootNavigationRef.navigate("BilibiliLogin");
}

export function openBilibiliLogin() {
  if (rootNavigationRef.isReady()) {
    pendingBilibiliLogin = false;
    navigateToBilibiliLogin();
    return;
  }
  pendingBilibiliLogin = true;
}

export function flushPendingBilibiliLogin() {
  if (pendingBilibiliLogin && rootNavigationRef.isReady()) {
    pendingBilibiliLogin = false;
    navigateToBilibiliLogin();
  }
}
