import type { JsonValue, SyncOperations } from "../../../../shared/user-data";
import { BilibiliSessionChangedError } from "../bilibili-session/controller";
import { UserDataUnauthorizedError } from "./errors";
import { LocalUserDataSchema, UserSettingsSchema } from "./settings.schema";
import type {
  SettingKey,
  UserDataAccount,
  UserDataDependencies,
  UserDataSnapshot,
  UserSettings,
} from "./types";

const settingKeys = Object.keys(UserSettingsSchema.shape) as SettingKey[];
export const createDefaultSettings = () => UserSettingsSchema.parse({});
export const userDataScope = (account: UserDataAccount | null) =>
  account ? `uid:${account.mid}` : "guest";
const localKey = (scope: string) => `UserData:${scope}`;

export function createUserDataController(dependencies: UserDataDependencies) {
  let snapshot: UserDataSnapshot = {
    scope: "guest",
    generation: null,
    values: createDefaultSettings(),
    ready: false,
    syncing: false,
    authRequired: false,
    pendingCount: 0,
    revision: 0,
    error: null,
  };
  let account: UserDataAccount | null = null;
  let epoch = 0;
  let pending = new Map<SettingKey, number>();
  let writeQueue: Promise<void> = Promise.resolve();
  let hydration: Promise<void> | null = null;
  let inFlight: Promise<void> | null = null;
  let abortController: AbortController | null = null;
  const listeners = new Set<() => void>();

  function publish(change: Partial<UserDataSnapshot>) {
    snapshot = { ...snapshot, ...change, pendingCount: pending.size };
    listeners.forEach((listener) => listener());
  }
  function matches(expected: UserDataAccount | null) {
    return (
      snapshot.scope === userDataScope(expected) &&
      snapshot.generation === (expected?.generation ?? null)
    );
  }
  function assertCurrent(expected: UserDataAccount | null, expectedEpoch = epoch) {
    if (
      epoch !== expectedEpoch ||
      !matches(expected) ||
      (expected && !dependencies.isCurrentAccount(expected))
    ) {
      throw new BilibiliSessionChangedError();
    }
  }
  function persist() {
    const currentEpoch = epoch;
    const key = localKey(snapshot.scope);
    const data = JSON.stringify({ values: snapshot.values, pendingKeys: [...pending.keys()] });
    writeQueue = writeQueue.catch(() => {}).then(() => dependencies.write(key, data));
    void writeQueue.catch(() => {
      if (epoch === currentEpoch) publish({ error: new Error("设置未能保存到本机，请重试") });
    });
    return writeQueue;
  }

  function activate(next: UserDataAccount | null): Promise<void> {
    if (next && !dependencies.isCurrentAccount(next)) {
      return Promise.reject(new BilibiliSessionChangedError());
    }
    if (matches(next) && (snapshot.ready || hydration)) return hydration ?? Promise.resolve();
    if (!matches(next)) {
      epoch += 1;
      abortController?.abort();
      abortController = null;
      inFlight = null;
      hydration = null;
      account = next;
      pending = new Map();
      publish({
        scope: userDataScope(next),
        generation: next?.generation ?? null,
        values: createDefaultSettings(),
        ready: false,
        syncing: false,
        authRequired: false,
        revision: 0,
        error: null,
      });
    }
    const currentEpoch = epoch;
    const task = (async () => {
      // 等前一次会话的本地写入结束，避免重新登录同一 UID 时读到旧缓存。
      await writeQueue.catch(() => {});
      assertCurrent(next, currentEpoch);
      const raw = await dependencies.read(localKey(userDataScope(next)));
      assertCurrent(next, currentEpoch);
      let values = createDefaultSettings();
      let pendingKeys: string[] = [];
      if (raw) {
        try {
          const parsed = LocalUserDataSchema.parse(JSON.parse(raw));
          values = parsed.values;
          pendingKeys = parsed.pendingKeys;
        } catch {
          // 不迁移旧格式；损坏的本地设置恢复默认值。
        }
      }
      pending = new Map(
        next ? settingKeys.filter((key) => pendingKeys.includes(key)).map((key) => [key, 1]) : [],
      );
      publish({ values, ready: true, revision: 1, error: null });
    })()
      .catch((error: unknown) => {
        if (epoch === currentEpoch && !(error instanceof BilibiliSessionChangedError)) {
          publish({ error: new Error("本地设置加载失败，请重试") });
        }
        throw error;
      })
      .finally(() => {
        if (epoch === currentEpoch) hydration = null;
      });
    hydration = task;
    return task;
  }

  function setValue<K extends SettingKey>(
    expected: UserDataAccount | null,
    key: K,
    value: UserSettings[K] | ((previous: UserSettings[K]) => UserSettings[K]),
  ) {
    assertCurrent(expected);
    if (!snapshot.ready) throw new Error("本地设置尚未加载，请稍后重试");
    const input = typeof value === "function" ? value(snapshot.values[key]) : value;
    const values = UserSettingsSchema.parse({ ...snapshot.values, [key]: input });
    const revision = snapshot.revision + 1;
    if (account) pending.set(key, revision);
    publish({ values, revision, error: null });
    void persist();
  }

  function sync(expected: UserDataAccount): Promise<void> {
    if (!matches(expected) || !dependencies.isCurrentAccount(expected))
      return Promise.reject(new BilibiliSessionChangedError());
    if (inFlight) return inFlight;
    const currentEpoch = epoch;
    const controller = new AbortController();
    abortController = controller;
    const task = (async () => {
      await activate(expected);
      assertCurrent(expected, currentEpoch);
      if (snapshot.authRequired) throw new UserDataUnauthorizedError();
      publish({ syncing: true, error: null });
      await persist();
      assertCurrent(expected, currentEpoch);
      // 每轮只发送快照中的脏 key；响应只确认对应版本，不清掉请求期间的新修改。
      do {
        const sent = new Map(pending);
        const set: Record<string, JsonValue> = {};
        for (const key of sent.keys()) set[key] = snapshot.values[key];
        const operations: SyncOperations = { get: [...settingKeys] };
        if (sent.size) operations.set = set;
        const response = await dependencies.sync(expected, operations, controller.signal);
        assertCurrent(expected, currentEpoch);
        if (controller.signal.aborted || response.uid !== expected.mid)
          throw new BilibiliSessionChangedError();
        const remote = UserSettingsSchema.parse(response.result);
        const values = { ...snapshot.values };
        for (const key of settingKeys) {
          if (pending.has(key) && pending.get(key) !== sent.get(key)) continue;
          pending.delete(key);
          // 用对象合并保留 key 与其值类型的关联，避免 union 索引写入。
          Object.assign(values, { [key]: remote[key] });
        }
        publish({ values, error: null });
        await persist();
        assertCurrent(expected, currentEpoch);
      } while (pending.size > 0);
    })()
      .catch((error: unknown) => {
        if (epoch === currentEpoch && !(error instanceof BilibiliSessionChangedError)) {
          publish({
            error: error instanceof Error ? error : new Error("设置同步失败，请稍后重试"),
            authRequired: error instanceof UserDataUnauthorizedError,
          });
        }
        throw error;
      })
      .finally(() => {
        if (epoch === currentEpoch) {
          inFlight = null;
          abortController = null;
          publish({ syncing: false });
        }
      });
    inFlight = task;
    return task;
  }

  return {
    activate,
    setValue,
    sync,
    reload(expected: UserDataAccount | null) {
      assertCurrent(expected);
      return activate(expected);
    },
    resume(expected: UserDataAccount) {
      assertCurrent(expected);
      publish({ authRequired: false });
    },
    flushLocal: () => writeQueue,
    async saveLocal() {
      const currentEpoch = epoch;
      await persist();
      if (epoch === currentEpoch) publish({ error: null });
    },
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
