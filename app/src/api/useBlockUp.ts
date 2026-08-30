import { useSyncExternalStore } from "react";
import { useSWRConfig } from "swr";
import useSWRMutation from "swr/mutation";

import { relationAccountKey } from "../features/bilibili-followings/mutations";
import { relationMutations } from "../features/bilibili-followings/relation-mutations";
import { bilibiliSession } from "../features/bilibili-session/session";
import { useBilibiliSessionState } from "../features/bilibili-session/useBilibiliSession";
import { getFollowingsKey } from "./followings";
import { getBilibiliLoginCookie } from "./get-cookie";
import { modifyBilibiliRelation } from "./modify-relation";
import type {
  BlockRelationChange,
  BlockRelationKey,
  RelationAccount,
} from "./modify-relation.types";

export function useBlockUp() {
  const { account, control, error } = useBilibiliSessionState();
  const { mutate } = useSWRConfig();
  const pending = useSyncExternalStore(relationMutations.subscribe, relationMutations.getSnapshot);
  const currentAccount = account && bilibiliSession.isCurrentAccount(account) ? account : null;
  const key: BlockRelationKey | null = currentAccount
    ? ["bilibili-block", currentAccount.mid, currentAccount.generation]
    : null;
  const { trigger } = useSWRMutation<
    BlockRelationChange,
    Error,
    BlockRelationKey | null,
    BlockRelationChange & { account: RelationAccount }
  >(
    key,
    (_key, { arg }) =>
      modifyBilibiliRelation(arg.account, arg, {
        readCookie: getBilibiliLoginCookie,
        isCurrentAccount: bilibiliSession.isCurrentAccount,
      }),
    { revalidate: false, populateCache: false },
  );

  // 使用确认框打开时的会话；过期会话在触发 SWR 请求前被共享锁拒绝。
  function block(up: BlockRelationChange["up"], confirmedAccount: RelationAccount) {
    return relationMutations.run(
      confirmedAccount,
      up.mid.toString(),
      () => trigger({ up, act: 5, account: confirmedAccount }),
      () => mutate(getFollowingsKey(confirmedAccount.mid, confirmedAccount.generation)),
    );
  }

  return {
    block,
    account: currentAccount,
    isPreparing: control.phase !== "ready" || (account === undefined && !error),
    isMutating: Boolean(currentAccount && pending.has(relationAccountKey(currentAccount))),
  };
}
