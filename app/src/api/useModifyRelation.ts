import { useSyncExternalStore } from "react";
import useSWRMutation from "swr/mutation";

import {
  applyRelationChange,
  createRelationMutationController,
  relationAccountKey,
} from "../features/bilibili-followings/mutations";
import { useFollowingsState } from "../features/bilibili-followings/useFollowingsState";
import { bilibiliSession } from "../features/bilibili-session/session";
import type { UpInfo } from "../types";
import { getBilibiliLoginCookie } from "./get-cookie";
import type { FollowingsKey } from "./followings.types";
import { modifyBilibiliRelation, RelationLoginRequiredError } from "./modify-relation";
import type { RelationAccount, RelationChange } from "./modify-relation.types";

const mutations = createRelationMutationController(bilibiliSession.isCurrentAccount);

export function useModifyRelation() {
  const state = useFollowingsState();
  const pending = useSyncExternalStore(mutations.subscribe, mutations.getSnapshot);
  const { trigger, error } = useSWRMutation<
    RelationChange,
    Error,
    FollowingsKey | null,
    RelationChange & { account: RelationAccount },
    UpInfo[]
  >(
    state.key,
    (_key, { arg }) =>
      modifyBilibiliRelation(arg.account, arg, {
        readCookie: getBilibiliLoginCookie,
        isCurrentAccount: bilibiliSession.isCurrentAccount,
      }),
    {
      revalidate: false,
      populateCache: (change, current = []) => applyRelationChange(current, change),
    },
  );

  async function submit(change: RelationChange) {
    const account = state.currentAccount;
    if (!account) {
      throw new RelationLoginRequiredError("请先登录 B站");
    }
    if (!state.isReady) {
      throw new Error("请先完成 B站关注列表同步");
    }
    return mutations.run(
      account,
      change.up.mid.toString(),
      () => trigger({ ...change, account }),
      () => state.mutate(),
    );
  }

  const pendingMid = state.currentAccount
    ? pending.get(relationAccountKey(state.currentAccount))
    : undefined;
  return {
    follow: (up: UpInfo) => submit({ up, act: 1 }),
    unfollow: (up: UpInfo) => submit({ up, act: 2 }),
    isMutating: pendingMid !== undefined,
    pendingMid,
    error,
    isPreparing:
      state.control.phase !== "ready" ||
      (state.account === undefined && !state.sessionError) ||
      Boolean(state.currentAccount && !state.isReady && !state.error),
    isReady: state.isReady,
    account: state.account,
  };
}
