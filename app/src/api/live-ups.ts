import useSWR from "swr";

import { bilibiliSession } from "../features/bilibili-session/session";
import { useBilibiliSessionState } from "../features/bilibili-session/useBilibiliSession";
import fetcher from "./fetcher";
import { LiveUpsDataSchema } from "./live-ups.schema";
import type { LiveUpsData } from "./live-ups.schema";

const LIVE_UPS_URL = "/x/polymer/web-dynamic/v1/live-up";

export async function fetchLiveUps() {
  const payload = await fetcher(LIVE_UPS_URL);
  return LiveUpsDataSchema.parse(payload);
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
