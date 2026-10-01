import {
  getFollowingDynamicsUpdateCount,
  isSameFollowingDynamicsReadState,
  mergeFollowingDynamicsReadState,
} from "@/api/following-dynamics";
import type { FollowingDynamicsNavBatch } from "@/api/following-dynamics.types";
import type { FollowingDynamicsUpdateCount } from "@/api/following-dynamics-update.schema";
import type { LiveUpsData } from "@/api/live-ups.schema";
import { bilibiliSession } from "@/features/bilibili-session/session";
import { getStoreMethods } from "@/store";
import { readPollSnapshot } from "./storage";
import type { AppliedPollTime, ForegroundPollAccount, PollOwner } from "./types";

const appliedTimes = new Map<string, AppliedPollTime>();

function acceptResult(account: ForegroundPollAccount, key: string, at: number, baseline?: string) {
  const scopedKey = `${account.mid}:${account.generation}:${key}`;
  const previous = appliedTimes.get(scopedKey);
  if (previous && previous.baseline === baseline && previous.at > at) {
    return false;
  }
  appliedTimes.set(scopedKey, { at, baseline });
  return true;
}

export function isForegroundAccountCurrent(account: ForegroundPollAccount) {
  const methods = getStoreMethods();
  return (
    methods.getInitialed() &&
    bilibiliSession.isCurrentAccount(account) &&
    methods.getFollowingsGeneration() === account.generation
  );
}

export function getForegroundPollOwner(account: ForegroundPollAccount): PollOwner {
  const followedUps = getStoreMethods().get$followedUps();
  return {
    mid: account.mid,
    followedMids: followedUps.map((up) => String(up.mid)),
    isCurrent: () =>
      isForegroundAccountCurrent(account) && getStoreMethods().get$followedUps() === followedUps,
  };
}

export function applyLiveResult(account: ForegroundPollAccount, data: LiveUpsData, at: number) {
  if (!isForegroundAccountCurrent(account) || !acceptResult(account, "live", at)) {
    return;
  }
  const methods = getStoreMethods();
  const followed = new Set(methods.get$followedUps().map((up) => String(up.mid)));
  const livingUps: Record<string, string> = {};
  for (const item of data.items) {
    if (!item.is_reserve_recall && followed.has(item.mid)) {
      livingUps[item.mid] = item.link;
    }
  }
  methods.setLivingUps(livingUps);
}

export function applyUpdatesResult(
  account: ForegroundPollAccount,
  baseline: string,
  data: FollowingDynamicsUpdateCount,
  at: number,
) {
  if (!isForegroundAccountCurrent(account)) {
    return;
  }
  const methods = getStoreMethods();
  const current = methods.get$followingDynamicsUpdateMap()[account.mid];
  if (!baseline || current?.baseline !== baseline) {
    return;
  }
  if (at <= (current.readAt ?? -1) || !acceptResult(account, "updates", at, baseline)) {
    return;
  }
  const count = getFollowingDynamicsUpdateCount(data);
  methods.set$followingDynamicsUpdateMap((map) => ({
    ...map,
    [account.mid]: { ...current, baseline, count },
  }));
  methods.setFollowingDynamicsUpdateCount(count);
}

export function applyNavResult(
  account: ForegroundPollAccount,
  data: FollowingDynamicsNavBatch,
  at: number,
) {
  if (!isForegroundAccountCurrent(account)) {
    return;
  }
  const methods = getStoreMethods();
  const followedMids = new Set(methods.get$followedUps().map((up) => String(up.mid)));
  const readBaseline = methods.get$followingDynamicsUpdateMap()[account.mid]?.baseline ?? "";
  methods.set$followingDynamicsReadMap((map) => {
    const current = map[account.mid];
    const next = mergeFollowingDynamicsReadState({
      state: current,
      batch: data,
      followedMids,
      readBaseline,
      observedAt: at,
    });
    return isSameFollowingDynamicsReadState(current, next) ? map : { ...map, [account.mid]: next };
  });
  methods.setFollowingDynamicsNavReadyAccount({ mid: account.mid, generation: account.generation });
}

export async function restorePollResults(account: ForegroundPollAccount) {
  const snapshot = await readPollSnapshot(account.mid);
  if (!isForegroundAccountCurrent(account)) {
    return;
  }
  if (snapshot.live) {
    applyLiveResult(account, snapshot.live.data, snapshot.live.at);
  }
  if (snapshot.updates) {
    applyUpdatesResult(
      account,
      snapshot.updates.baseline,
      snapshot.updates.data,
      snapshot.updates.at,
    );
  }
  if (snapshot.nav) {
    applyNavResult(account, snapshot.nav.data, snapshot.nav.at);
  }
}
