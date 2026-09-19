import { useSyncExternalStore } from "react";
import { useSWRConfig } from "swr";
import { bilibiliSession } from "../bilibili-session/session";
import { useBilibiliSessionState } from "../bilibili-session/useBilibiliSession";
import type { BilibiliAccount } from "../bilibili-session/types";
import { showToast } from "../../utils";
import { createDefaultSettings, userDataScope } from "./controller";
import { userData } from "./store";
import type { SettingKey, UserSettings } from "./types";

const defaults = createDefaultSettings();

export function useUserSettings() {
  const { account: session } = useBilibiliSessionState();
  const account = session && bilibiliSession.isCurrentAccount(session) ? session : null;
  const snapshot = useSyncExternalStore(userData.subscribe, userData.getSnapshot);
  const { mutate } = useSWRConfig();
  const scope = userDataScope(account);
  const active = snapshot.scope === scope && snapshot.generation === (account?.generation ?? null);

  function setSetting<K extends SettingKey>(
    key: K,
    value: UserSettings[K] | ((previous: UserSettings[K]) => UserSettings[K]),
  ) {
    try {
      userData.setValue(account, key, value);
      return true;
    } catch (error) {
      showToast(error instanceof Error ? error.message : "设置修改失败");
      return false;
    }
  }
  async function retry() {
    try {
      await userData.reload(account);
      if (account) {
        if (snapshot.authRequired) {
          const validated = await mutate<BilibiliAccount | null>("bilibili-session");
          if (
            !validated ||
            validated.mid !== account.mid ||
            !bilibiliSession.isCurrentAccount(account)
          ) {
            return;
          }
          userData.resume(account);
        }
        await mutate(["user-data", account.mid, account.generation]);
      } else {
        await userData.saveLocal();
      }
    } catch {
      showToast("设置尚未同步，请稍后重试");
    }
  }
  return {
    ...snapshot,
    scope,
    values: active ? snapshot.values : defaults,
    ready: active && snapshot.ready,
    error: active ? snapshot.error : null,
    pendingCount: active ? snapshot.pendingCount : 0,
    syncing: active && snapshot.syncing,
    isGuest: !account,
    setSetting,
    retry,
  };
}
