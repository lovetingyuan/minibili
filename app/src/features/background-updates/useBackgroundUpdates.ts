import { useEffect } from "react";
import { AppState } from "react-native";

import { useBilibiliSessionState } from "@/features/bilibili-session/useBilibiliSession";
import { getStoreMethods, useStore } from "@/store";
import { isNativePollingSupported, requestLiveNotificationPermission } from "./notifications";
import { isForegroundAccountCurrent, restorePollResults } from "./results";
import { disableBackgroundUpdates, syncBackgroundUpdates } from "./task";
import { useLiveNotificationResponses } from "./useLiveNotificationResponses";

function reportBackgroundError(error: unknown) {
  if (__DEV__) {
    // oxlint-disable-next-line no-console
    console.log("后台更新初始化失败", error);
  }
}

export function useBackgroundUpdates() {
  const { account, control } = useBilibiliSessionState();
  const { initialed, followingsGeneration, $followedUps, $followingDynamicsUpdateMap } = useStore();
  const baseline = account ? ($followingDynamicsUpdateMap[account.mid]?.baseline ?? "") : "";
  useLiveNotificationResponses(control.phase === "ready" ? account : null);

  useEffect(() => {
    if (!isNativePollingSupported() || !initialed) {
      return;
    }
    if (control.phase !== "ready" || account === null) {
      void disableBackgroundUpdates().catch(reportBackgroundError);
      return;
    }
    if (!account || followingsGeneration !== account.generation) {
      return;
    }
    let canceled = false;
    const currentAccount = account;
    const isCurrent = () => !canceled && isForegroundAccountCurrent(currentAccount);
    async function initialize() {
      const operations = await Promise.allSettled([
        syncBackgroundUpdates(
          currentAccount,
          $followedUps.map((up) => String(up.mid)),
          baseline,
          isCurrent,
        ),
        restorePollResults(currentAccount),
      ]);
      for (const operation of operations) {
        if (operation.status === "rejected") {
          reportBackgroundError(operation.reason);
        }
      }
      if (!isCurrent()) {
        return;
      }
      if (isCurrent() && AppState.currentState === "active") {
        await requestLiveNotificationPermission();
      }
    }
    void initialize().catch(reportBackgroundError);
    return () => {
      canceled = true;
    };
  }, [account, control.phase, initialed, followingsGeneration, $followedUps, baseline]);

  useEffect(() => {
    if (
      !isNativePollingSupported() ||
      !account ||
      !initialed ||
      followingsGeneration !== account.generation
    ) {
      return;
    }
    const currentAccount = account;
    async function resume() {
      const methods = getStoreMethods();
      const operations = await Promise.allSettled([
        syncBackgroundUpdates(
          currentAccount,
          methods.get$followedUps().map((up) => String(up.mid)),
          methods.get$followingDynamicsUpdateMap()[currentAccount.mid]?.baseline ?? "",
          () => isForegroundAccountCurrent(currentAccount),
        ),
        restorePollResults(currentAccount),
      ]);
      for (const operation of operations) {
        if (operation.status === "rejected") {
          reportBackgroundError(operation.reason);
        }
      }
      if (isForegroundAccountCurrent(currentAccount)) {
        await requestLiveNotificationPermission();
      }
    }
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active" || !isForegroundAccountCurrent(currentAccount)) {
        return;
      }
      void resume().catch(reportBackgroundError);
    });
    return () => subscription.remove();
  }, [account, initialed, followingsGeneration]);
}
