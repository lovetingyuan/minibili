import type { RelationAccount, RelationChange } from "../../api/modify-relation.types";
import type { UpInfo } from "../../types";
import { BilibiliSessionChangedError } from "../bilibili-session/controller";

export function relationAccountKey(account: RelationAccount) {
  return account.mid + ":" + account.generation;
}

export function applyRelationChange(ups: UpInfo[], change: RelationChange) {
  // 拉黑后的关注关系由 B站重新同步，不能把拉黑误当作关注。
  if (change.act === 5) {
    return ups;
  }
  const mid = change.up.mid.toString();
  const remaining = ups.filter((up) => up.mid.toString() !== mid);
  if (change.act === 2) {
    return remaining;
  }
  const existing = ups.find((up) => up.mid.toString() === mid);
  return [{ ...existing, ...change.up }, ...remaining];
}

// SWR mutation 的 isMutating 不在组件间共享，使用同步锁防止多个入口重复提交。
export function createRelationMutationController(
  isCurrentAccount: (account: RelationAccount) => boolean,
) {
  let pending: ReadonlyMap<string, string> = new Map();
  const listeners = new Set<() => void>();
  function publish(next: ReadonlyMap<string, string>) {
    pending = next;
    listeners.forEach((listener) => listener());
  }
  return {
    getSnapshot: () => pending,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    async run<T>(
      account: RelationAccount,
      mid: string,
      work: () => Promise<T>,
      revalidate?: () => Promise<unknown>,
    ): Promise<T> {
      if (!isCurrentAccount(account)) {
        throw new BilibiliSessionChangedError();
      }
      const key = relationAccountKey(account);
      if (pending.has(key)) {
        throw new Error("关系操作正在进行，请稍候");
      }
      publish(new Map(pending).set(key, mid));
      try {
        const result = await work();
        if (!isCurrentAccount(account)) {
          throw new BilibiliSessionChangedError();
        }
        // GET 的失败单独通过 SWR 列表错误展示，不改变已经成功的 POST 结果。
        if (revalidate) {
          void Promise.resolve()
            .then(() => {
              if (isCurrentAccount(account)) {
                return revalidate();
              }
            })
            .catch(() => {});
        }
        return result;
      } finally {
        const next = new Map(pending);
        next.delete(key);
        publish(next);
      }
    },
  };
}
