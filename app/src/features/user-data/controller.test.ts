import { describe, expect, test, vi } from "vitest";
import type { JsonValue, SyncResult } from "../../../../shared/user-data";
import { RanksConfig } from "../../constants";
import { BilibiliSessionChangedError } from "../bilibili-session/controller";
import { createDefaultSettings, createUserDataController } from "./controller";
import { UserDataUnauthorizedError } from "./errors";
import type { UserDataAccount, UserDataDependencies } from "./types";

const alice = { mid: "123", generation: 1 };
const bob = { mid: "456", generation: 2 };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

function setup() {
  const local = new Map<string, string>();
  const cloud = new Map<string, Record<string, JsonValue>>();
  let current: UserDataAccount | null = alice;
  const dependencies: UserDataDependencies = {
    read: vi.fn(async (key) => local.get(key) ?? null),
    write: vi.fn(async (key, value) => {
      local.set(key, value);
    }),
    isCurrentAccount: (account) =>
      account.mid === current?.mid && account.generation === current.generation,
    sync: vi.fn<UserDataDependencies["sync"]>(async (account, operations) => {
      const data = { ...cloud.get(account.mid), ...operations.set };
      cloud.set(account.mid, data);
      return { success: true, uid: account.mid, result: data };
    }),
  };
  return {
    local,
    cloud,
    dependencies,
    store: createUserDataController(dependencies),
    changeAccount(next: UserDataAccount | null) {
      current = next;
    },
  };
}

describe("user settings sync", () => {
  test("uploads only the changed setting and restores it on another device", async () => {
    const { store, dependencies, cloud } = setup();
    await store.activate(alice);
    store.setValue(alice, "$blackTags", { 睡前: "睡前", 学习: "学习" });
    await store.sync(alice);
    expect(cloud.get(alice.mid)?.$blackTags).toEqual({ 睡前: "睡前", 学习: "学习" });
    expect(vi.mocked(dependencies.sync).mock.calls[0][1].set).toEqual({
      $blackTags: { 睡前: "睡前", 学习: "学习" },
    });
    const otherDisk = new Map<string, string>();
    const other = createUserDataController({
      ...dependencies,
      read: async (key) => otherDisk.get(key) ?? null,
      write: async (key, value) => {
        otherDisk.set(key, value);
      },
    });
    await other.activate(alice);
    await other.sync(alice);
    expect(other.getSnapshot().values.$blackTags).toEqual({ 睡前: "睡前", 学习: "学习" });
    expect(vi.mocked(dependencies.sync).mock.calls[1][1].set).toBeUndefined();
    const restarted = createUserDataController(dependencies);
    await restarted.activate(alice);
    expect(restarted.getSnapshot().values.$blackTags).toEqual({ 睡前: "睡前", 学习: "学习" });
  });

  test("offline clearing of a setting survives restart and explicitly clears the cloud value", async () => {
    const { store, dependencies, cloud } = setup();
    cloud.set(alice.mid, { $blackTags: { 睡前: "睡前" } });
    await store.activate(alice);
    await store.sync(alice);
    store.setValue(alice, "$blackTags", {});
    vi.mocked(dependencies.sync).mockRejectedValueOnce(new Error("offline"));
    await expect(store.sync(alice)).rejects.toThrow("offline");
    const restarted = createUserDataController(dependencies);
    await restarted.activate(alice);
    expect(restarted.getSnapshot().values.$blackTags).toEqual({});
    expect(restarted.getSnapshot().pendingCount).toBe(1);
    await restarted.sync(alice);
    expect(vi.mocked(dependencies.sync).mock.lastCall?.[1].set).toEqual({ $blackTags: {} });
    expect(cloud.get(alice.mid)?.$blackTags).toEqual({});
    expect(restarted.getSnapshot().pendingCount).toBe(0);
  });

  test("a stale response cannot undo setting changes made during an upload", async () => {
    const { store, dependencies, cloud } = setup();
    await store.activate(alice);
    store.setValue(alice, "$blackTags", { 学习: "学习" });
    const response = deferred<SyncResult>();
    vi.mocked(dependencies.sync).mockReturnValueOnce(response.promise);
    const sync = store.sync(alice);
    await vi.waitFor(() => expect(dependencies.sync).toHaveBeenCalledTimes(1));
    store.setValue(alice, "$blackTags", { 音乐: "音乐" });
    response.resolve({ success: true, uid: alice.mid, result: { $blackTags: { 学习: "学习" } } });
    await sync;
    expect(store.getSnapshot().values.$blackTags).toEqual({ 音乐: "音乐" });
    expect(cloud.get(alice.mid)?.$blackTags).toEqual({ 音乐: "音乐" });
  });

  test("account changes ignore late setting responses and retain each account's pending changes", async () => {
    const { store, dependencies, cloud, changeAccount } = setup();
    cloud.set(bob.mid, { $blackTags: { 舞蹈: "舞蹈" } });
    await store.activate(alice);
    store.setValue(alice, "$blackTags", { 音乐: "音乐" });
    const response = deferred<SyncResult>();
    vi.mocked(dependencies.sync).mockReturnValueOnce(response.promise);
    const sync = store.sync(alice);
    const rejected = expect(sync).rejects.toBeInstanceOf(BilibiliSessionChangedError);
    await vi.waitFor(() => expect(dependencies.sync).toHaveBeenCalledTimes(1));
    changeAccount(bob);
    await store.activate(bob);
    await store.sync(bob);
    response.resolve({ success: true, uid: alice.mid, result: { $blackTags: { 学习: "学习" } } });
    await rejected;
    expect(store.getSnapshot().values.$blackTags).toEqual({ 舞蹈: "舞蹈" });
    expect(vi.mocked(dependencies.sync).mock.calls[1][1].set).toBeUndefined();
    changeAccount(alice);
    await store.activate(alice);
    expect(store.getSnapshot().values.$blackTags).toEqual({ 音乐: "音乐" });
    expect(store.getSnapshot().pendingCount).toBe(1);
  });
});

describe("account scoped user data", () => {
  test("guest settings stay local and are never copied into a new account", async () => {
    const { store, dependencies, local, changeAccount } = setup();
    changeAccount(null);
    await store.activate(null);
    store.setValue(null, "$blackTags", { 游戏: "游戏" });
    await store.flushLocal();
    expect(dependencies.sync).not.toHaveBeenCalled();
    expect(store.getSnapshot().pendingCount).toBe(0);
    expect(local.has("UserData:guest")).toBe(true);
    changeAccount(alice);
    await store.activate(alice);
    expect(store.getSnapshot().values.$blackTags).toEqual({});
    await store.sync(alice);
    expect(dependencies.sync).toHaveBeenCalledWith(
      alice,
      { get: ["$blackTags", "$videoCatesList"] },
      expect.any(AbortSignal),
    );
    changeAccount(null);
    await store.activate(null);
    expect(store.getSnapshot().values.$blackTags).toEqual({ 游戏: "游戏" });
  });

  test("downloads existing cloud settings without uploading defaults or untouched keys", async () => {
    const { store, cloud, dependencies } = setup();
    cloud.set(alice.mid, { $blackTags: { 游戏: "游戏" }, future: "preserved" });
    await store.activate(alice);
    await store.sync(alice);
    expect(store.getSnapshot().values.$blackTags).toEqual({ 游戏: "游戏" });
    store.setValue(alice, "$videoCatesList", [...RanksConfig].reverse());
    await store.sync(alice);
    expect(vi.mocked(dependencies.sync).mock.calls[1][1].set).toEqual({
      $videoCatesList: store.getSnapshot().values.$videoCatesList,
    });
    expect(cloud.get(alice.mid)?.future).toBe("preserved");
  });

  test("network failures preserve dirty settings across restart and re-login", async () => {
    const { store, dependencies, local } = setup();
    await store.activate(alice);
    store.setValue(alice, "$blackTags", { 本地: "本地" });
    vi.mocked(dependencies.sync).mockRejectedValueOnce(new Error("offline"));
    await expect(store.sync(alice)).rejects.toThrow("offline");
    expect(store.getSnapshot().pendingCount).toBe(1);
    expect(JSON.parse(local.get("UserData:uid:123")!).pendingKeys).toEqual(["$blackTags"]);
    const restarted = createUserDataController(dependencies);
    await restarted.activate(alice);
    await restarted.sync(alice);
    expect(restarted.getSnapshot().values.$blackTags).toEqual({ 本地: "本地" });
    expect(restarted.getSnapshot().pendingCount).toBe(0);
  });

  test("edits during an in-flight save survive the older response and are sent next", async () => {
    const { store, dependencies } = setup();
    await store.activate(alice);
    store.setValue(alice, "$blackTags", { first: "first" });
    const response = deferred<SyncResult>();
    vi.mocked(dependencies.sync).mockReturnValueOnce(response.promise);
    const sync = store.sync(alice);
    await vi.waitFor(() => expect(dependencies.sync).toHaveBeenCalledTimes(1));
    store.setValue(alice, "$blackTags", { newest: "newest" });
    response.resolve({ success: true, uid: alice.mid, result: { $blackTags: { first: "first" } } });
    await sync;
    expect(store.getSnapshot().values.$blackTags).toEqual({ newest: "newest" });
    expect(store.getSnapshot().pendingCount).toBe(0);
    expect(vi.mocked(dependencies.sync).mock.calls[1][1].set).toEqual({
      $blackTags: { newest: "newest" },
    });
  });

  test("edits while the first cloud read is pending are not overwritten", async () => {
    const { store, dependencies } = setup();
    await store.activate(alice);
    const response = deferred<SyncResult>();
    vi.mocked(dependencies.sync).mockReturnValueOnce(response.promise);
    const sync = store.sync(alice);
    await vi.waitFor(() => expect(dependencies.sync).toHaveBeenCalledTimes(1));
    store.setValue(alice, "$blackTags", { local: "local" });
    response.resolve({
      success: true,
      uid: alice.mid,
      result: { $blackTags: { remote: "remote" } },
    });
    await sync;
    expect(store.getSnapshot().values.$blackTags).toEqual({ local: "local" });
  });

  test("logout aborts the old request and ignores a late response without losing its pending data", async () => {
    const { store, dependencies, changeAccount } = setup();
    await store.activate(alice);
    store.setValue(alice, "$blackTags", { alice: "alice" });
    const response = deferred<SyncResult>();
    vi.mocked(dependencies.sync).mockReturnValueOnce(response.promise);
    const sync = store.sync(alice);
    const rejected = expect(sync).rejects.toBeInstanceOf(BilibiliSessionChangedError);
    await vi.waitFor(() => expect(dependencies.sync).toHaveBeenCalledTimes(1));
    changeAccount(null);
    await store.activate(null);
    expect(vi.mocked(dependencies.sync).mock.calls[0][2].aborted).toBe(true);
    response.resolve({
      success: true,
      uid: alice.mid,
      result: { $blackTags: { leaked: "leaked" } },
    });
    await rejected;
    expect(store.getSnapshot().values.$blackTags).toEqual({});
    changeAccount(alice);
    await store.activate(alice);
    expect(store.getSnapshot().values.$blackTags).toEqual({ alice: "alice" });
    expect(store.getSnapshot().pendingCount).toBe(1);
  });

  test("switching accounts cannot flush the previous account's pending changes", async () => {
    const { store, dependencies, changeAccount } = setup();
    await store.activate(alice);
    store.setValue(alice, "$blackTags", { alice: "alice" });
    changeAccount(bob);
    await store.activate(bob);
    expect(store.getSnapshot().values.$blackTags).toEqual({});
    await store.sync(bob);
    expect(vi.mocked(dependencies.sync).mock.calls[0][1].set).toBeUndefined();
    expect(() => store.setValue(alice, "$blackTags", {})).toThrow(BilibiliSessionChangedError);
  });

  test("stale disk hydration cannot replace the next account's settings", async () => {
    const { store, dependencies, changeAccount } = setup();
    const disk = deferred<string | null>();
    vi.mocked(dependencies.read).mockReturnValueOnce(disk.promise);
    const load = store.activate(alice);
    const rejected = expect(load).rejects.toBeInstanceOf(BilibiliSessionChangedError);
    await vi.waitFor(() => expect(dependencies.read).toHaveBeenCalledTimes(1));
    changeAccount(bob);
    await store.activate(bob);
    disk.resolve(JSON.stringify({ values: { $blackTags: { alice: "alice" } }, pendingKeys: [] }));
    await rejected;
    expect(store.getSnapshot().scope).toBe("uid:456");
    expect(store.getSnapshot().values.$blackTags).toEqual({});
  });

  test("401 pauses requests until a successful session revalidation explicitly resumes them", async () => {
    const { store, dependencies } = setup();
    await store.activate(alice);
    store.setValue(alice, "$blackTags", { local: "local" });
    vi.mocked(dependencies.sync).mockRejectedValueOnce(new UserDataUnauthorizedError());
    await expect(store.sync(alice)).rejects.toBeInstanceOf(UserDataUnauthorizedError);
    await expect(store.sync(alice)).rejects.toBeInstanceOf(UserDataUnauthorizedError);
    expect(dependencies.sync).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().pendingCount).toBe(1);
    store.resume(alice);
    await store.sync(alice);
    expect(store.getSnapshot().pendingCount).toBe(0);
  });

  test("generation changes block reads and edits even before the UI switches scopes", async () => {
    const { store, dependencies, changeAccount } = setup();
    await store.activate(alice);
    changeAccount({ ...alice, generation: 2 });
    await expect(store.sync(alice)).rejects.toBeInstanceOf(BilibiliSessionChangedError);
    expect(() => store.setValue(alice, "$blackTags", {})).toThrow(BilibiliSessionChangedError);
    expect(dependencies.sync).not.toHaveBeenCalled();
  });

  test("stale activation and retry callbacks cannot reset the next account", async () => {
    const { store, changeAccount } = setup();
    await store.activate(alice);
    changeAccount(bob);
    await store.activate(bob);
    await expect(store.activate(alice)).rejects.toBeInstanceOf(BilibiliSessionChangedError);
    expect(() => store.reload(alice)).toThrow(BilibiliSessionChangedError);
    expect(() => store.reload(null)).toThrow(BilibiliSessionChangedError);
    expect(store.getSnapshot().scope).toBe("uid:456");
    expect(store.getSnapshot().ready).toBe(true);
  });

  test("rejects a response for a different UID without updating data", async () => {
    const { store, dependencies } = setup();
    await store.activate(alice);
    vi.mocked(dependencies.sync).mockResolvedValueOnce({
      success: true,
      uid: bob.mid,
      result: { $blackTags: { wrong: "wrong" } },
    });
    await expect(store.sync(alice)).rejects.toBeInstanceOf(BilibiliSessionChangedError);
    expect(store.getSnapshot().values).toEqual(createDefaultSettings());
  });

  test("local failures can be retried without uploading unpersisted edits", async () => {
    const { store, dependencies } = setup();
    await store.activate(alice);
    vi.mocked(dependencies.write).mockRejectedValue(new Error("disk full"));
    store.setValue(alice, "$blackTags", { local: "local" });
    await expect(store.sync(alice)).rejects.toThrow("disk full");
    expect(dependencies.sync).not.toHaveBeenCalled();
    expect(store.getSnapshot().pendingCount).toBe(1);
    vi.mocked(dependencies.write).mockResolvedValue(undefined);
    await store.sync(alice);
    expect(store.getSnapshot().error).toBeNull();
  });
});
