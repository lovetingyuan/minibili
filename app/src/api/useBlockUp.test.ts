import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { RelationAccount, RelationChange } from "./modify-relation.types";
import type { Blacklist } from "./blacklist.types";

const state = vi.hoisted(() => ({
  account: { mid: "123", generation: 1 } as RelationAccount | null | undefined,
  generation: 1,
  followingsReady: true,
  mutate: vi
    .fn<
      (
        key: readonly unknown[],
        updater?: (current: Blacklist | undefined) => Blacklist,
        options?: { revalidate: boolean },
      ) => Promise<unknown>
    >()
    .mockResolvedValue(undefined),
  readCookie: vi.fn(async () => "SESSDATA=test; DedeUserID=123; bili_jct=csrf-test"),
  mutationConfig: vi.fn(),
}));

vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useSyncExternalStore: (_subscribe: unknown, getSnapshot: () => unknown) => getSnapshot(),
}));
vi.mock("swr", async (importOriginal) => ({
  ...(await importOriginal<typeof import("swr")>()),
  useSWRConfig: () => ({ mutate: state.mutate }),
}));
vi.mock("swr/mutation", () => ({
  default: (
    key: readonly unknown[] | null,
    fetcher: (
      key: readonly unknown[],
      options: { arg: RelationChange & { account: RelationAccount } },
    ) => Promise<RelationChange>,
    config: unknown,
  ) => {
    state.mutationConfig(key, config);
    return {
      trigger: (arg: RelationChange & { account: RelationAccount }) => {
        if (!key) {
          throw new Error("Missing mutation key");
        }
        return fetcher(key, { arg });
      },
    };
  },
}));
vi.mock("../features/bilibili-session/session", () => ({
  bilibiliSession: {
    isCurrentAccount: (account: RelationAccount) => account.generation === state.generation,
  },
}));
vi.mock("../features/bilibili-session/useBilibiliSession", () => ({
  useBilibiliSessionState: () => ({ account: state.account, control: { phase: "ready" } }),
}));
vi.mock("../features/bilibili-followings/useFollowingsState", () => ({
  useFollowingsState: () => ({
    account: state.account,
    currentAccount: state.account,
    key: ["bilibili-followings", "123", 1],
    isReady: state.followingsReady,
    control: { phase: "ready" },
    mutate: state.mutate,
  }),
}));
vi.mock("./get-cookie", () => ({ getBilibiliLoginCookie: state.readCookie }));

import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import { useBlockUp } from "./useBlockUp";
import { useModifyRelation } from "./useModifyRelation";

const account = { mid: "123", generation: 1 };
const up = { mid: 456, name: "测试 UP", face: "", sign: "" };

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.clearAllMocks();
  state.account = account;
  state.generation = 1;
  state.followingsReady = true;
  state.mutate.mockResolvedValue(undefined);
  vi.stubGlobal(
    "fetch",
    vi.fn<typeof fetch>().mockImplementation(async () => Response.json({ code: 0 })),
  );
});
afterEach(() => vi.unstubAllGlobals());

describe("block UP mutation", () => {
  test("blocks without following sync and immediately updates the account's blacklist", async () => {
    state.followingsReady = false;
    const mutation = useBlockUp();
    expect(mutation.isPreparing).toBe(false);
    await mutation.block(up, account);
    expect(state.mutationConfig).toHaveBeenCalledWith(["bilibili-block", "123", 1], {
      revalidate: false,
      populateCache: false,
    });
    expect(new URLSearchParams(String(vi.mocked(fetch).mock.calls[0][1]?.body)).get("act")).toBe(
      "5",
    );
    expect(state.mutate).toHaveBeenCalledWith(["bilibili-followings", "123", 1]);
    expect(state.mutate).toHaveBeenCalledWith(
      ["bilibili-blacklist", "123", 1],
      expect.any(Function),
      { revalidate: true },
    );
    const update = state.mutate.mock.calls[0][1];
    const otherUp = { ...up, mid: 789 };
    const previous = new Map([["789", otherUp]]);
    expect(update?.(previous)).toEqual(
      new Map([
        ["789", otherUp],
        ["456", up],
      ]),
    );
    expect(previous).toEqual(new Map([["789", otherUp]]));
    expect(update?.(undefined)).toEqual(new Map([["456", up]]));
    const existing = { ...up, face: "avatar.jpg", sign: "已有简介" };
    // 拉黑入口仅提供 UID 和名称时，也不能丢掉缓存中的头像、简介。
    expect(update?.(new Map([["456", existing]]))?.get("456")).toEqual(existing);
  });

  test.each(["block", "follow"] as const)(
    "shares a lock across hooks when %s starts first",
    async (firstAction) => {
      const response = deferred<Response>();
      vi.mocked(fetch).mockReturnValue(response.promise);
      const block = useBlockUp();
      const follow = useModifyRelation();
      const first = firstAction === "block" ? block.block(up, account) : follow.follow(up);
      expect(useBlockUp().isMutating).toBe(true);
      expect(useModifyRelation().isMutating).toBe(true);
      await expect(block.block(up, account)).rejects.toThrow("正在进行");
      await expect(follow.follow({ ...up, mid: 789 })).rejects.toThrow("正在进行");
      response.resolve(Response.json({ code: 0 }));
      await first;
      expect(fetch).toHaveBeenCalledOnce();
      expect(useBlockUp().isMutating).toBe(false);
    },
  );

  test("rejects an account changed during confirmation before reading credentials", async () => {
    const mutation = useBlockUp();
    state.generation = 2;
    await expect(mutation.block(up, account)).rejects.toBeInstanceOf(BilibiliSessionChangedError);
    expect(state.readCookie).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    expect(state.mutate).not.toHaveBeenCalled();
  });

  test("discards a response from an old session without refreshing the new account", async () => {
    const response = deferred<Response>();
    vi.mocked(fetch).mockReturnValue(response.promise);
    const result = useBlockUp().block(up, account);
    const rejected = expect(result).rejects.toBeInstanceOf(BilibiliSessionChangedError);
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    state.generation = 2;
    response.resolve(Response.json({ code: 0 }));
    await rejected;
    expect(state.mutate).not.toHaveBeenCalled();
  });

  test("does not turn a failed followings refresh into a failed block", async () => {
    state.mutate.mockRejectedValue(new Error("GET failed"));
    await expect(useBlockUp().block(up, account)).resolves.toMatchObject({ up, act: 5 });
    expect(state.mutate).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledOnce();
  });

  test("never refreshes on a failed POST and releases the lock for another action", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({ code: -352, message: "操作被拒绝" }));
    await expect(useBlockUp().block(up, account)).rejects.toThrow("拉黑操作失败");
    expect(state.mutate).not.toHaveBeenCalled();
    expect(useBlockUp().isMutating).toBe(false);
    await useModifyRelation().follow(up);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
