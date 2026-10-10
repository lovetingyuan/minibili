import { requestUserOpen } from "../../api/user-data";
import { BilibiliSessionChangedError } from "../bilibili-session/controller";
import { bilibiliSession } from "../bilibili-session/session";
import { userDataRequestDependencies } from "./store";
import type { UserDataAccount } from "./types";

// 模块状态跨组件重挂载保留；新进程和新的登录 generation 都会重新登记。
let account: UserDataAccount | null = null;
let completedKey: string | null = null;
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
  if (completedKey === key) {
    return Promise.resolve();
  }
  if (inFlight) {
    return inFlight;
  }
  const currentController = new AbortController();
  controller = currentController;
  const task = requestUserOpen(expected, currentController.signal, userDataRequestDependencies)
    .then(() => {
      if (!currentController.signal.aborted && bilibiliSession.isCurrentAccount(expected)) {
        completedKey = key;
      }
    })
    .finally(() => {
      if (controller === currentController) {
        controller = null;
        inFlight = null;
      }
    });
  inFlight = task;
  return task;
}

export const userOpen = { activate, record };
