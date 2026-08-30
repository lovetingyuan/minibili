import { mutate } from "swr";
import { describe, expect, test, vi } from "vitest";

import type { UpInfo } from "../../types";
import { BilibiliSessionChangedError } from "../bilibili-session/controller";
import {
  applyRelationChange,
  createRelationMutationController,
  relationAccountKey,
} from "./mutations";

const account = { mid: "123", generation: 1 };
const up: UpInfo = { mid: 456, name: "UP", face: "", sign: "" };

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("shared relationship mutations", () => {
  test("blocks duplicate and concurrent actions across entry points until the request finishes", async () => {
    const controller = createRelationMutationController(() => true);
    const request = deferred<void>();
    const listener = vi.fn();
    const unsubscribe = controller.subscribe(listener);
    const first = controller.run(account, "456", () => request.promise);
    expect(controller.getSnapshot().get(relationAccountKey(account))).toBe("456");
    const duplicate = vi.fn(async () => {});
    await expect(controller.run(account, "456", duplicate)).rejects.toThrow("正在进行");
    await expect(controller.run(account, "789", duplicate)).rejects.toThrow("正在进行");
    expect(duplicate).not.toHaveBeenCalled();
    request.resolve();
    await first;
    expect(controller.getSnapshot().size).toBe(0);
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    await controller.run(account, "789", duplicate);
    expect(duplicate).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  test("releases the lock after a failed request without revalidating or changing cached data", async () => {
    const controller = createRelationMutationController(() => true);
    const key = ["relation-failure-test", account.mid];
    await mutate(key, [up], { revalidate: false });
    const revalidate = vi.fn(async () => {});
    await expect(
      controller.run(
        account,
        "456",
        () => mutate<UpInfo[]>(key, Promise.reject(new Error("denied")), { revalidate: false }),
        revalidate,
      ),
    ).rejects.toThrow("denied");
    expect(await mutate(key)).toEqual([up]);
    expect(revalidate).not.toHaveBeenCalled();
    expect(controller.getSnapshot().size).toBe(0);
  });

  test("does not report successful modification as failure when the subsequent sync fails", async () => {
    const controller = createRelationMutationController(() => true);
    const key = ["relation-sync-failure-test", account.mid];
    await mutate(key, [up], { revalidate: false });
    const revalidate = vi.fn(async () => {
      throw new Error("GET failed");
    });
    await expect(
      controller.run(
        account,
        "456",
        () =>
          mutate<UpInfo[]>(key, (current = []) => applyRelationChange(current, { up, act: 2 }), {
            revalidate: false,
          }),
        revalidate,
      ),
    ).resolves.toEqual([]);
    await Promise.resolve();
    expect(revalidate).toHaveBeenCalledOnce();
    expect(await mutate(key)).toEqual([]);
    expect(controller.getSnapshot().size).toBe(0);
  });

  test("does not let older cache work restore an unfollowed UP", async () => {
    const key = ["relation-race-test", account.mid];
    await mutate(key, [up], { revalidate: false });
    const oldRead = deferred<UpInfo[]>();
    const olderWork = mutate(key, oldRead.promise, { revalidate: false });
    await mutate<UpInfo[]>(key, (current = []) => applyRelationChange(current, { up, act: 2 }), {
      revalidate: false,
    });
    oldRead.resolve([up]);
    await olderWork;
    expect(await mutate(key)).toEqual([]);
  });

  test("rejects an expired session before starting an action", async () => {
    const controller = createRelationMutationController(() => false);
    const request = vi.fn(async () => {});
    await expect(controller.run(account, "456", request)).rejects.toBeInstanceOf(
      BilibiliSessionChangedError,
    );
    expect(request).not.toHaveBeenCalled();
  });

  test("ignores an old session result without releasing a new account's lock", async () => {
    let generation = 1;
    const controller = createRelationMutationController(
      (candidate) => candidate.generation === generation,
    );
    const firstRequest = deferred<void>();
    const secondRequest = deferred<void>();
    const revalidate = vi.fn(async () => {});
    const first = controller.run(account, "456", () => firstRequest.promise, revalidate);
    const rejected = expect(first).rejects.toBeInstanceOf(BilibiliSessionChangedError);
    generation = 2;
    const other = { mid: "789", generation };
    const second = controller.run(other, "456", () => secondRequest.promise);
    firstRequest.resolve();
    await rejected;
    expect(revalidate).not.toHaveBeenCalled();
    expect(controller.getSnapshot().get(relationAccountKey(other))).toBe("456");
    secondRequest.resolve();
    await second;
    expect(controller.getSnapshot().size).toBe(0);
  });

  test("updates membership by MID without losing pin or duplicating numeric/string IDs", () => {
    const pinned = { ...up, mid: "456", pin: 9 };
    expect(applyRelationChange([pinned], { up: { ...up, name: "new" }, act: 1 })).toEqual([
      { ...up, name: "new", pin: 9 },
    ]);
    expect(applyRelationChange([pinned], { up, act: 2 })).toEqual([]);
  });
});
