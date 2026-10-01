import useSWR from "swr";

import { bilibiliSession } from "../features/bilibili-session/session";
import { useBilibiliSessionState } from "../features/bilibili-session/useBilibiliSession";
import fetcher from "./fetcher";
import { LiveUpsDataSchema } from "./live-ups.schema";
import type { LiveUpsData } from "./live-ups.schema";
import type { FollowingDynamicsRequest } from "./following-dynamics.types";
import { timestampPollResult } from "./poll-result-time";

const LIVE_UPS_URL = "/x/polymer/web-dynamic/v1/live-up";

export async function fetchLiveUps(request: FollowingDynamicsRequest = fetcher) {
  const startedAt = Date.now();
  const payload = await request(LIVE_UPS_URL);
  return timestampPollResult(LiveUpsDataSchema.parse(payload), startedAt);
}

export function useLiveUps() {
  const session = useBilibiliSessionState();
  const account =
    session.account && bilibiliSession.isCurrentAccount(session.account) ? session.account : null;

  return useSWR<LiveUpsData, Error>(
    account ? ["bilibili-live-ups", account.mid, account.generation] : null,
    () => fetchLiveUps(),
    {
      refreshInterval: 10 * 60 * 1000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );
}
