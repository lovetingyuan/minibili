import { useEffect, useSyncExternalStore } from "react";
import useSWR from "swr";
import { bilibiliSession } from "../features/bilibili-session/session";
import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import { useBilibiliSession } from "../features/bilibili-session/useBilibiliSession";
import { UserDataUnauthorizedError } from "../features/user-data/errors";
import { userData } from "../features/user-data/store";
import { userDataScope } from "../features/user-data/controller";

export default function UserDataManager() {
  const { account: session, revalidate } = useBilibiliSession();
  const account = session && bilibiliSession.isCurrentAccount(session) ? session : null;
  const snapshot = useSyncExternalStore(userData.subscribe, userData.getSnapshot);

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
          error instanceof UserDataUnauthorizedError || error instanceof BilibiliSessionChangedError
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
