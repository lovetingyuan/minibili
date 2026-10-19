import AsyncStorage from "@react-native-async-storage/async-storage";
import { requestUserOpen } from "../../api/user-data";
import { BilibiliSessionChangedError } from "../bilibili-session/controller";
import { bilibiliSession } from "../bilibili-session/session";
import { userDataRequestDependencies } from "./store";
import type { UserDataAccount } from "./types";

const REPORT_INTERVAL = 24 * 60 * 60 * 1000;

// 模块状态跨组件重挂载保留；新进程和新的登录 generation 都会重新登记。
let account: UserDataAccount | null = null;
let completedKey: string | null = null;
let completedAt = 0;
let cacheWriteFailed = false;
let inFlight: Promise<void> | null = null;
let controller: AbortController | null = null;

function activate(next: UserDataAccount | null) {
  if (account?.mid === next?.mid && account?.generation === next?.generation) {
    return;
  }
  controller?.abort();
  controller = null;
  inFlight = null;
  account = next;
}

function record(expected: UserDataAccount): Promise<void> {
  if (!bilibiliSession.isCurrentAccount(expected)) {
    return Promise.reject(new BilibiliSessionChangedError());
  }
  activate(expected);
  const key = `${expected.mid}:${expected.generation}`;
  if (inFlight) {
    return inFlight;
  }
  const currentController = new AbortController();
  controller = currentController;
  const storageKey = `UserOpen:uid:${expected.mid}`;
  const task = (async () => {
    if (completedKey === key) {
      const cachedAt = await AsyncStorage.getItem(storageKey).catch(() => String(completedAt));
      if (currentController.signal.aborted || !bilibiliSession.isCurrentAccount(expected)) {
        throw new BilibiliSessionChangedError();
      }
      const reportedAt = cacheWriteFailed ? completedAt : Number(cachedAt);
      if (
        Number.isFinite(reportedAt) &&
        reportedAt > 0 &&
        Date.now() - reportedAt <= REPORT_INTERVAL
      ) {
        return;
      }
    }
    await requestUserOpen(expected, currentController.signal, userDataRequestDependencies);
    if (!currentController.signal.aborted && bilibiliSession.isCurrentAccount(expected)) {
      completedKey = key;
      completedAt = Date.now();
      cacheWriteFailed = false;
      await AsyncStorage.setItem(storageKey, String(completedAt)).catch(() => {
        // 落盘失败时，本次运行仍按内存中的成功时间去重。
        if (controller === currentController) {
          cacheWriteFailed = true;
        }
      });
    }
  })().finally(() => {
    if (controller === currentController) {
      controller = null;
      inFlight = null;
    }
  });
  inFlight = task;
  return task;
}

export const userOpen = { activate, record };
