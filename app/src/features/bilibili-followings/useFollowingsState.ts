import useSWR from "swr";

import { getFollowingsKey } from "../../api/followings";
import { useStore } from "../../store";
import type { UpInfo } from "../../types";
import { bilibiliSession } from "../bilibili-session/session";
import { useBilibiliSessionState } from "../bilibili-session/useBilibiliSession";

export function useFollowingsState() {
  const { account, control, error: sessionError } = useBilibiliSessionState();
  const { followingsGeneration } = useStore();
  const currentAccount = account && bilibiliSession.isCurrentAccount(account) ? account : null;
  const key = currentAccount
    ? getFollowingsKey(currentAccount.mid, currentAccount.generation)
    : null;
  const response = useSWR<UpInfo[], Error>(key, null, {
    revalidateOnMount: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
  const isReady = Boolean(
    currentAccount &&
    response.data !== undefined &&
    followingsGeneration === currentAccount.generation,
  );
  return { ...response, key, account, currentAccount, control, sessionError, isReady };
}
