import * as Notifications from "expo-notifications";
import type { NotificationResponse } from "expo-notifications";
import { useEffect, useRef } from "react";

import { bilibiliSession } from "@/features/bilibili-session/session";
import { rootNavigationRef } from "@/routes/navigation";
import { LiveNotificationDataSchema } from "./background-updates.schema";
import { isNativePollingSupported } from "./notifications";
import type { ForegroundPollAccount, PendingLiveNotification } from "./types";

export function useLiveNotificationResponses(account: ForegroundPollAccount | null | undefined) {
  const pending = useRef<PendingLiveNotification | null>(null);
  const handled = useRef(new Set<string>());

  useEffect(() => {
    if (!isNativePollingSupported()) {
      return;
    }

    function flush() {
      const current = pending.current;
      if (!current || account === undefined) {
        return;
      }
      if (
        account &&
        bilibiliSession.isCurrentAccount(account) &&
        current.data.accountMid === account.mid
      ) {
        if (!rootNavigationRef.isReady()) {
          return;
        }
        rootNavigationRef.navigate("Living", {
          url: current.data.url,
          title: `${current.data.name}的直播间`,
          user: { mid: current.data.mid, name: current.data.name },
        });
      }
      pending.current = null;
      handled.current.add(current.identifier);
      if (
        Notifications.getLastNotificationResponse()?.notification.request.identifier ===
        current.identifier
      ) {
        Notifications.clearLastNotificationResponse();
      }
    }

    function receive(response: NotificationResponse) {
      if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
        return;
      }
      const request = response.notification.request;
      const parsed = LiveNotificationDataSchema.safeParse(request.content.data);
      if (!parsed.success || handled.current.has(request.identifier)) {
        return;
      }
      pending.current = { identifier: request.identifier, data: parsed.data };
      flush();
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(receive);
    const removeReadyListener = rootNavigationRef.addListener("ready", flush);
    const response = Notifications.getLastNotificationResponse();
    if (response) {
      receive(response);
    }
    flush();
    return () => {
      subscription.remove();
      removeReadyListener();
    };
  }, [account]);
}
