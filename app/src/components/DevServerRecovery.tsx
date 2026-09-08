import { reloadAppAsync } from "expo";
import { useEffect } from "react";
import { AppState } from "react-native";

const BACKGROUND_RELOAD_DELAY_MS = 30_000;

export default function DevServerRecovery() {
  useEffect(() => {
    if (!__DEV__) {
      return;
    }

    let backgroundedAt: number | undefined;
    let isReloading = false;

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "background") {
        if (backgroundedAt === undefined) {
          backgroundedAt = Date.now();
        }
        return;
      }

      if (nextState !== "active" || backgroundedAt === undefined) {
        return;
      }

      const backgroundDuration = Date.now() - backgroundedAt;
      backgroundedAt = undefined;

      if (backgroundDuration < BACKGROUND_RELOAD_DELAY_MS || isReloading) {
        return;
      }

      isReloading = true;
      void reloadAppAsync("Reconnect to Expo CLI after backgrounding");
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return null;
}
