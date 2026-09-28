import { useEffect, useRef, useSyncExternalStore } from "react";
import useSWR from "swr";
import { posthog } from "@/config/posthog";
import { bilibiliSession } from "@/features/bilibili-session/session";
import { BilibiliSessionChangedError } from "@/features/bilibili-session/controller";
import { BilibiliAuthExpiredError } from "@/features/bilibili-session/auth-expiration";
import { useBilibiliSession } from "@/features/bilibili-session/useBilibiliSession";
import { UserDataUnauthorizedError } from "@/features/user-data/errors";
import { userData } from "@/features/user-data/store";
import { userDataScope } from "@/features/user-data/controller";

export default function UserDataManager() {
  const { account: session, isChecking, revalidate } = useBilibiliSession();
  const account = session && bilibiliSession.isCurrentAccount(session) ? session : null;
  const identifiedMidRef = useRef<string | null | undefined>(undefined);
  const snapshot = useSyncExternalStore(userData.subscribe, userData.getSnapshot);

  useEffect(() => {
    if (isChecking) {
      return;
    }
    if (account) {
      if (identifiedMidRef.current !== account.mid) {
        posthog?.identify(account.mid);
      }
      identifiedMidRef.current = account.mid;
    } else if (identifiedMidRef.current !== null) {
      posthog?.reset();
      identifiedMidRef.current = null;
    }
  }, [account, isChecking]);

  useEffect(() => {
    void userData.activate(account).catch(() => {});
  }, [account?.mid, account?.generation]);

  const active =
    snapshot.scope === userDataScope(account) &&
    snapshot.generation === (account?.generation ?? null);
  const { mutate } = useSWR(
    account && active ? ["user-data", account.mid, account.generation] : null,
    ([, mid, generation]) => userData.sync({ mid, generation }),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      errorRetryCount: 2,
      shouldRetryOnError: (error: Error) =>
        !(
          error instanceof UserDataUnauthorizedError ||
          error instanceof BilibiliAuthExpiredError ||
          error instanceof BilibiliSessionChangedError
        ),
      onError(error: Error) {
        if (
          !(error instanceof UserDataUnauthorizedError) ||
          !account ||
          !bilibiliSession.isCurrentAccount(account)
        ) {
          return;
        }
        void revalidate()
          .then((validated) => {
            if (
              validated &&
              validated.mid === account.mid &&
              bilibiliSession.isCurrentAccount(account)
            ) {
              userData.resume(account);
            }
          })
          .catch(() => {});
      },
    },
  );
  useEffect(() => {
    if (!account || !active || !snapshot.ready || !snapshot.pendingCount || snapshot.authRequired) {
      return;
    }
    const timer = setTimeout(() => {
      void mutate().catch(() => {});
    }, 400);
    return () => clearTimeout(timer);
  }, [account?.mid, account?.generation, active, snapshot.ready, snapshot.revision, mutate]);
  return null;
}
