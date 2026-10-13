import type { WatchLaterAccount } from "../../api/watch-later.types";
import { createFavoriteMutations, favoriteMutationKey } from "../bilibili-favorites/mutations";
import { bilibiliSession } from "../bilibili-session/session";

const pendingMessage = "稍后再看操作正在进行，请稍候";
const mutations = createFavoriteMutations(bilibiliSession.isCurrentAccount, pendingMessage);

function hasPending(account: WatchLaterAccount) {
  const prefix = favoriteMutationKey(account, "");
  return [...mutations.getSnapshot()].some((key) => key.startsWith(prefix));
}

export const watchLaterMutations = {
  subscribe: mutations.subscribe,
  getSnapshot: mutations.getSnapshot,
  hasPending,
  run<T>(account: WatchLaterAccount, aid: string, work: () => Promise<T>) {
    if (mutations.getSnapshot().has(favoriteMutationKey(account, "clear"))) {
      return Promise.reject(new Error(pendingMessage));
    }
    return mutations.run(account, aid, work);
  },
  // 清除锁覆盖整个账号，并持续到列表同步结束。
  runClear<T>(account: WatchLaterAccount, work: () => Promise<T>) {
    if (hasPending(account)) {
      return Promise.reject(new Error(pendingMessage));
    }
    return mutations.run(account, "clear", work);
  },
};
