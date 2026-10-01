import * as BackgroundTask from "expo-background-task";
import type { BackgroundTaskResult } from "expo-background-task";
import * as Crypto from "expo-crypto";
import * as TaskManager from "expo-task-manager";

import { getBilibiliUserId, hasBilibiliLoginCookie } from "@/api/bilibili-cookie.helpers";
import request from "@/api/fetcher";
import {
  fetchFollowingDynamicsNavUpdates,
  fetchFollowingDynamicsUpdateCount,
} from "@/api/following-dynamics";
import { fetchLiveUps } from "@/api/live-ups";
import { getPollResultTime } from "@/api/poll-result-time";
import { isLoginRequiredError } from "@/features/bilibili-session/login-required";
import { reportBilibiliAuthExpired } from "@/features/bilibili-session/auth-expiration";
import { bilibiliSession } from "@/features/bilibili-session/session";
import { getStoredBilibiliCookie } from "@/utils/secure-store";
import { isNativePollingSupported } from "./notifications";
import {
  readBackgroundContext,
  saveLiveResult,
  saveNavResult,
  saveUpdatesResult,
  writeBackgroundContext,
} from "./storage";
import type { ForegroundPollAccount, PollOwner } from "./types";

export const BACKGROUND_UPDATES_TASK = "minibili-background-updates";
let registrationQueue: Promise<unknown> = Promise.resolve();
let runningTask: Promise<BackgroundTaskResult> | null = null;

function enqueueRegistration<T>(action: () => Promise<T>) {
  const result = registrationQueue.then(action);
  registrationQueue = result.catch(() => {});
  return result;
}

async function unregisterTask() {
  if (
    (await TaskManager.isAvailableAsync()) &&
    (await TaskManager.isTaskRegisteredAsync(BACKGROUND_UPDATES_TASK))
  ) {
    await BackgroundTask.unregisterTaskAsync(BACKGROUND_UPDATES_TASK);
  }
}

export function disableBackgroundUpdates() {
  return enqueueRegistration(async () => {
    await writeBackgroundContext(null);
    await unregisterTask();
  });
}

export function syncBackgroundUpdates(
  account: ForegroundPollAccount,
  followedMids: string[],
  baseline: string,
  isCurrent: () => boolean,
) {
  return enqueueRegistration(async () => {
    if (!isNativePollingSupported() || !isCurrent()) {
      return;
    }
    const cookie = await getStoredBilibiliCookie();
    if (!cookie || !hasBilibiliLoginCookie(cookie) || getBilibiliUserId(cookie) !== account.mid) {
      return;
    }
    const credentialHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      cookie,
    );
    const previous = await readBackgroundContext();
    if (!isCurrent()) {
      return;
    }
    const sameCredentials =
      previous?.mid === account.mid && previous.credentialHash === credentialHash;
    if (sameCredentials && previous.expired) {
      reportBilibiliAuthExpired(-101);
      return;
    }
    await writeBackgroundContext({
      mid: account.mid,
      credentialHash,
      followedMids,
      baseline,
      sessionId: sameCredentials ? previous.sessionId : Crypto.randomUUID(),
    });
    if (!isCurrent() || !(await TaskManager.isAvailableAsync())) {
      return;
    }
    if ((await BackgroundTask.getStatusAsync()) !== BackgroundTask.BackgroundTaskStatus.Available) {
      return;
    }
    if (!(await TaskManager.isTaskRegisteredAsync(BACKGROUND_UPDATES_TASK))) {
      await BackgroundTask.registerTaskAsync(BACKGROUND_UPDATES_TASK, { minimumInterval: 15 });
    }
  });
}

async function runBackgroundUpdates(): Promise<BackgroundTaskResult> {
  const context = await readBackgroundContext();
  if (!context || context.expired) {
    await unregisterTask();
    return BackgroundTask.BackgroundTaskResult.Success;
  }
  const cookie = await getStoredBilibiliCookie();
  const credentialHash = cookie
    ? await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, cookie)
    : "";
  if (
    !cookie ||
    !hasBilibiliLoginCookie(cookie) ||
    getBilibiliUserId(cookie) !== context.mid ||
    credentialHash !== context.credentialHash
  ) {
    await enqueueRegistration(async () => {
      if ((await readBackgroundContext())?.sessionId === context.sessionId) {
        await writeBackgroundContext(null);
        await unregisterTask();
      }
    });
    return BackgroundTask.BackgroundTaskResult.Success;
  }
  const generation = bilibiliSession.getSnapshot().generation;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  let removeExpirationListener: (() => void) | undefined;
  const isAccountCurrent = () =>
    bilibiliSession.getSnapshot().phase === "ready" &&
    bilibiliSession.getSnapshot().generation === generation;
  const isRuntimeCurrent = () => !controller.signal.aborted && isAccountCurrent();
  const isCurrent = async () => {
    const active = await readBackgroundContext();
    return (
      isAccountCurrent() &&
      active?.sessionId === context.sessionId &&
      !active.expired &&
      active.followedMids.length === context.followedMids.length &&
      active.followedMids.every((mid, index) => mid === context.followedMids[index]) &&
      (await getStoredBilibiliCookie()) === cookie
    );
  };
  const backgroundRequest = async (url: string): Promise<unknown> => {
    if (!isRuntimeCurrent() || !(await isCurrent())) {
      throw new Error("后台更新会话已改变");
    }
    const data = await request(url, { cookie, signal: controller.signal, silentAuthErrors: true });
    if (!isRuntimeCurrent() || !(await isCurrent())) {
      throw new Error("后台更新会话已改变");
    }
    return data;
  };
  const owner: PollOwner = { mid: context.mid, followedMids: context.followedMids, isCurrent };
  try {
    if (process.env.EXPO_OS === "ios") {
      const expiration = BackgroundTask.addExpirationListener(() => controller.abort());
      removeExpirationListener = () => expiration.remove();
    }
    const [live, updates, nav] = await Promise.allSettled([
      fetchLiveUps(backgroundRequest),
      context.baseline
        ? fetchFollowingDynamicsUpdateCount(context.baseline, backgroundRequest, isRuntimeCurrent)
        : Promise.resolve(null),
      fetchFollowingDynamicsNavUpdates(backgroundRequest, isRuntimeCurrent, {
        readBaseline: context.baseline,
      }),
    ]);
    const authExpired = [live, updates, nav].some(
      (result) => result.status === "rejected" && isLoginRequiredError(result.reason),
    );
    if (authExpired && (await isCurrent())) {
      await enqueueRegistration(async () => {
        if (!(await isCurrent())) {
          return;
        }
        await writeBackgroundContext({ ...context, expired: true });
        await unregisterTask();
      });
      return BackgroundTask.BackgroundTaskResult.Success;
    }
    if (!(await isCurrent())) {
      return BackgroundTask.BackgroundTaskResult.Success;
    }
    // 每项独立保存；其中一个接口或持久化失败不妨碍另外两项。
    const writes = await Promise.allSettled([
      live.status === "fulfilled"
        ? saveLiveResult(owner, live.value, getPollResultTime(live.value))
        : Promise.resolve(),
      updates.status === "fulfilled" && updates.value
        ? saveUpdatesResult(
            owner,
            context.baseline,
            updates.value,
            getPollResultTime(updates.value),
          )
        : Promise.resolve(),
      nav.status === "fulfilled"
        ? saveNavResult(owner, nav.value, getPollResultTime(nav.value))
        : Promise.resolve(),
    ]);
    return [...writes, live, updates, nav].some((result) => result.status === "rejected")
      ? BackgroundTask.BackgroundTaskResult.Failed
      : BackgroundTask.BackgroundTaskResult.Success;
  } finally {
    clearTimeout(timeout);
    removeExpirationListener?.();
  }
}

if (isNativePollingSupported() && !TaskManager.isTaskDefined(BACKGROUND_UPDATES_TASK)) {
  TaskManager.defineTask(BACKGROUND_UPDATES_TASK, async ({ error }) => {
    if (error) {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
    runningTask ??= runBackgroundUpdates()
      .catch(() => BackgroundTask.BackgroundTaskResult.Failed)
      .finally(() => {
        runningTask = null;
      });
    return runningTask;
  });
}
