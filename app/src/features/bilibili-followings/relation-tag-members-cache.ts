import type { ScopedMutator } from "swr";
import { unstable_serialize } from "swr/infinite";

import { getRelationTagMembersKey } from "../../api/relation-tags";
import type { RelationTagAccount } from "../../api/relation-tags.types";

function memberPagesMatcher(account: RelationTagAccount, tagids?: readonly number[]) {
  return (key: unknown) => {
    if (!Array.isArray(key) || key[0] !== "bilibili-relation-tag-members") {
      return false;
    }
    if (key[1] !== account.mid || key[2] !== account.generation) {
      return false;
    }
    return !tagids || tagids.includes(key[3] as number);
  };
}

/**
 * 分组成员列表（useSWRInfinite）的聚合 key：挂载中的列表只订阅它，
 * 单独改动分页 key 不会触发任何重新请求。
 */
export function getRelationTagMembersInfiniteKey(account: RelationTagAccount, tagid: number) {
  return unstable_serialize(() => getRelationTagMembersKey(account, tagid, 0, null));
}

/** 清掉分页缓存：列表配置了 revalidateFirstPage: false，不清就会复用旧分页。 */
export function clearRelationTagMemberPages(
  mutate: ScopedMutator,
  account: RelationTagAccount,
  tagids: readonly number[],
) {
  return mutate(memberPagesMatcher(account, tagids), undefined, { revalidate: false });
}

/**
 * 分组写操作会改变分组成员：先清分页缓存，再重新校验聚合 key，
 * 挂载中的分组列表才会真正拉取新数据。
 */
export async function revalidateRelationTagMembers(
  mutate: ScopedMutator,
  account: RelationTagAccount,
  tagids: readonly number[],
) {
  if (!tagids.length) {
    return;
  }
  await clearRelationTagMemberPages(mutate, account, tagids).catch(() => {});
  await Promise.allSettled(
    tagids.map((tagid) => mutate(getRelationTagMembersInfiniteKey(account, tagid))),
  );
}
