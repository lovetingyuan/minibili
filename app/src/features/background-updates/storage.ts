import AsyncStorage from "@react-native-async-storage/async-storage";

import type { FollowingDynamicsNavBatch } from "@/api/following-dynamics.types";
import { isNewerFollowingDynamicId } from "@/api/following-dynamics";
import type { FollowingDynamicsUpdateCount } from "@/api/following-dynamics-update.schema";
import type { LiveUpsData } from "@/api/live-ups.schema";
import { BackgroundContextSchema, PollSnapshotSchema } from "./background-updates.schema";
import { showLiveNotification } from "./notifications";
import type { BackgroundContext, PollOwner, PollSnapshot } from "./types";

const CONTEXT_KEY = "background-updates:context";
const snapshotKey = (mid: string) => `background-updates:snapshot:${mid}`;
let writeQueue: Promise<unknown> = Promise.resolve();

/** 同一 JS 运行时的前后台结果串行落盘，比较和通知去重必须在一个队列内完成。 */
function enqueueWrite<T>(action: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(action);
  writeQueue = result.catch(() => {});
  return result;
}

export async function readBackgroundContext(): Promise<BackgroundContext | null> {
  const raw = await AsyncStorage.getItem(CONTEXT_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = BackgroundContextSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function writeBackgroundContext(context: BackgroundContext | null) {
  // 不排在网络请求后面，退出登录要立即使执行中的任务失效。
  return AsyncStorage.setItem(CONTEXT_KEY, JSON.stringify(context));
}

export async function readPollSnapshot(mid: string): Promise<PollSnapshot> {
  const raw = await AsyncStorage.getItem(snapshotKey(mid));
  if (!raw) {
    return {};
  }
  try {
    const parsed = PollSnapshotSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

export function saveLiveResult(owner: PollOwner, data: LiveUpsData, at: number) {
  return enqueueWrite(async () => {
    const snapshot = await readPollSnapshot(owner.mid);
    if (!(await owner.isCurrent())) {
      return null;
    }
    if (snapshot.live && snapshot.live.at >= at) {
      return snapshot.live;
    }
    const followed = new Set(owner.followedMids);
    const liveByMid = new Map<string, LiveUpsData["items"][number]>();
    for (const item of data.items) {
      if (!item.is_reserve_recall && followed.has(item.mid)) {
        liveByMid.set(item.mid, item);
      }
    }
    const liveItems = [...liveByMid.values()];
    const previous = snapshot.detectedLiveMids;
    const previouslyLive = new Set(previous);
    const newLiveItems = previous ? liveItems.filter((item) => !previouslyLive.has(item.mid)) : [];
    const live = { at, data };
    await AsyncStorage.setItem(
      snapshotKey(owner.mid),
      JSON.stringify({
        ...snapshot,
        live,
        detectedLiveMids: liveItems.map((item) => item.mid),
      } satisfies PollSnapshot),
    );
    for (const item of newLiveItems) {
      if (!(await owner.isCurrent())) {
        break;
      }
      // 先记录已观察到的开播。权限拒绝或通知失败不补发历史提醒。
      await showLiveNotification(
        {
          kind: "live-up",
          accountMid: owner.mid,
          mid: item.mid,
          name: item.uname,
          url: item.link.startsWith("//") ? `https:${item.link}` : item.link,
        },
        at,
        owner.isCurrent,
      ).catch(() => {});
    }
    return live;
  });
}

export function saveUpdatesResult(
  owner: PollOwner,
  baseline: string,
  data: FollowingDynamicsUpdateCount,
  at: number,
) {
  return enqueueWrite(async () => {
    const snapshot = await readPollSnapshot(owner.mid);
    if (!(await owner.isCurrent())) {
      return null;
    }
    if (snapshot.updates && snapshot.updates.at >= at) {
      return snapshot.updates;
    }
    const updates = { at, baseline, data };
    await AsyncStorage.setItem(snapshotKey(owner.mid), JSON.stringify({ ...snapshot, updates }));
    return updates;
  });
}

export function saveNavResult(owner: PollOwner, data: FollowingDynamicsNavBatch, at: number) {
  return enqueueWrite(async () => {
    const snapshot = await readPollSnapshot(owner.mid);
    if (!(await owner.isCurrent())) {
      return null;
    }
    if (snapshot.nav && snapshot.nav.at >= at) {
      return snapshot.nav;
    }
    // 后台连续多轮同步也要累积最新 id；分页上限不能丢掉上一轮已发现的未读 UP。
    const latestByMid = { ...snapshot.nav?.data.latestByMid };
    const observedAtByMid: Record<string, number> = {};
    for (const mid of Object.keys(latestByMid)) {
      observedAtByMid[mid] = snapshot.nav?.data.observedAtByMid?.[mid] ?? snapshot.nav?.at ?? at;
    }
    for (const [mid, id] of Object.entries(data.latestByMid)) {
      if (isNewerFollowingDynamicId(id, latestByMid[mid] ?? "")) {
        latestByMid[mid] = id;
        observedAtByMid[mid] = data.observedAtByMid?.[mid] ?? at;
      }
    }
    const followed = new Set(owner.followedMids);
    for (const mid of Object.keys(latestByMid)) {
      if (!followed.has(mid)) {
        delete latestByMid[mid];
        delete observedAtByMid[mid];
      }
    }
    const nav = { at, data: { ...data, latestByMid, observedAtByMid } };
    await AsyncStorage.setItem(snapshotKey(owner.mid), JSON.stringify({ ...snapshot, nav }));
    return nav;
  });
}
