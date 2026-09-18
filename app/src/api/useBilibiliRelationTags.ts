import { useEffect, useRef } from "react";
import useSWR, { useSWRConfig } from "swr";
import useSWRInfinite from "swr/infinite";

import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import { bilibiliSession } from "../features/bilibili-session/session";
import { useBilibiliSessionState } from "../features/bilibili-session/useBilibiliSession";
import {
  clearRelationTagMemberPages,
  removeRelationTagMemberFromCaches,
  revalidateRelationTagMembers,
} from "../features/bilibili-followings/relation-tag-members-cache";
import {
  getCachedData,
  syncRelationTagCounts,
} from "../features/bilibili-followings/relation-tag-counts";
import type { UpInfo } from "../types";
import fetcher from "./fetcher";
import { getBilibiliLoginCookie } from "./get-cookie";
import {
  createBilibiliRelationTag,
  deleteBilibiliRelationTag,
  fetchBilibiliRelationTagMembers,
  fetchBilibiliRelationTags,
  fetchBilibiliUpRelationTags,
  fetchAllBilibiliRelationTagMembers,
  getFollowGroupTags,
  getRelationTagMembersKey,
  getRelationTagsKey,
  getRelationUpTagsKey,
  getSpecialFollowUpsKey,
  RELATION_TAG_MEMBERS_PAGE_SIZE,
  RELATION_TAG_DEFAULT_ID,
  RELATION_TAG_SPECIAL_ID,
  RelationTagLoginRequiredError,
  RelationTagResultUnknownError,
  renameBilibiliRelationTag,
  setBilibiliUpRelationTags,
} from "./relation-tags";
import type {
  RelationTag,
  RelationTagAccount,
  RelationTagMembersKey,
  RelationTagMembersKeyLoader,
  RelationTagRequestDependencies,
} from "./relation-tags.types";

const relationTagOptions = {
  keepPreviousData: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  shouldRetryOnError: (error: Error) =>
    !(error instanceof BilibiliSessionChangedError || error instanceof RelationTagLoginRequiredError),
  errorRetryCount: 2,
};

const relationTagMutationDependencies: RelationTagRequestDependencies = {
  readCookie: getBilibiliLoginCookie,
  isCurrentAccount: (account: RelationTagAccount) => bilibiliSession.isCurrentAccount(account),
};

const RELATION_TAG_MEMBERS_REFRESH_DELAY = 1500;

function wait(delay: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, delay);
  });
}

function useRelationTagAccount() {
  const { account } = useBilibiliSessionState();
  return account && bilibiliSession.isCurrentAccount(account) ? account : null;
}

export function useBilibiliRelationTags() {
  const account = useRelationTagAccount();
  const response = useSWR<RelationTag[], Error>(
    account ? getRelationTagsKey(account) : null,
    () => {
      if (!account) {
        throw new Error("缺少当前账号");
      }
      return fetchBilibiliRelationTags(account, fetcher, () =>
        bilibiliSession.isCurrentAccount(account),
      );
    },
    relationTagOptions,
  );
  return { ...response, data: account ? response.data : undefined };
}

export function useBilibiliRelationTagMembers(tagid?: number, enabled = true) {
  const account = useRelationTagAccount();
  const pending = useRef(false);
  const active = Boolean(account && enabled && tagid !== undefined);
  const response = useSWRInfinite<UpInfo[], Error, RelationTagMembersKeyLoader>(
    (index, previous: UpInfo[] | null) =>
      active && account ? getRelationTagMembersKey(account, tagid, index, previous) : null,
    async ([, mid, generation, currentTagid, page]: RelationTagMembersKey) => {
      const current = { mid, generation };
      return fetchBilibiliRelationTagMembers(currentTagid, page, fetcher, () =>
        bilibiliSession.isCurrentAccount(current),
      );
    },
    { ...relationTagOptions, revalidateFirstPage: false, persistSize: false },
  );
  const { data, size, setSize, mutate, isLoading, isValidating, error } = response;

  // 切换分组时保留分页缓存，但从第一页重新展示。
  useEffect(() => {
    void setSize(1).catch(() => {});
  }, [account?.mid, account?.generation, tagid, setSize]);

  const pages = active ? (data?.slice(0, size) ?? []) : [];
  const seen = new Set<string>();
  const items: UpInfo[] = [];
  for (const page of pages) {
    for (const up of page) {
      const mid = String(up.mid);
      if (!seen.has(mid)) {
        seen.add(mid);
        items.push(up);
      }
    }
  }
  const lastPage = pages.at(-1);
  const hasMore = lastPage
    ? lastPage.length === RELATION_TAG_MEMBERS_PAGE_SIZE
    : false;
  const isLoadingMore = isLoading || (!error && size > pages.length && hasMore);

  async function loadMore() {
    if (
      !active ||
      pending.current ||
      isValidating ||
      isLoadingMore ||
      error ||
      !hasMore
    ) {
      return;
    }
    pending.current = true;
    try {
      await setSize((value) => value + 1);
    } finally {
      pending.current = false;
    }
  }

  async function refresh() {
    await setSize(1);
    await mutate();
  }

  return {
    ...response,
    items,
    hasMore,
    isLoadingMore,
    loadMore,
    refresh,
  };
}

export function useBilibiliUpRelationTags(mid?: string | number) {
  const account = useRelationTagAccount();
  const response = useSWR<number[], Error>(
    account && mid !== undefined ? getRelationUpTagsKey(account, mid) : null,
    () => {
      if (!account || mid === undefined) {
        throw new Error("缺少账号或 UP 信息");
      }
      return fetchBilibiliUpRelationTags(mid, fetcher, () =>
        bilibiliSession.isCurrentAccount(account),
      );
    },
    relationTagOptions,
  );
  return { ...response, data: account ? response.data : undefined };
}

/**
 * 「特别关注」成员集合：全部列表用它把特别关注的 UP 排到最前并高亮。
 * 与「特别关注」分组页共用同一份 B站 数据源，但这里一次性取全。
 */
export function useBilibiliSpecialFollowUps() {
  const account = useRelationTagAccount();
  const response = useSWR<Set<string>, Error>(
    account ? getSpecialFollowUpsKey(account) : null,
    async () => {
      if (!account) {
        throw new Error("缺少当前账号");
      }
      const members = await fetchAllBilibiliRelationTagMembers(
        RELATION_TAG_SPECIAL_ID,
        fetcher,
        () => bilibiliSession.isCurrentAccount(account),
      );
      return new Set(members.map((member) => String(member.mid)));
    },
    { ...relationTagOptions, dedupingInterval: 5 * 60 * 1000 },
  );
  return { ...response, data: account ? response.data : undefined };
}

/**
 * 分组的写操作。写成功后统一刷新分组列表；结果不确定时先刷新再抛错，
 * 避免用户重复提交。
 */
export function useRelationTagActions() {
  const account = useRelationTagAccount();
  const { mutate: mutateCache, cache } = useSWRConfig();
  const pending = useRef(new Set<string>());

  function assertAccount() {
    if (!account || !bilibiliSession.isCurrentAccount(account)) {
      throw new BilibiliSessionChangedError();
    }
    return account;
  }

  // 刷新失败不影响已经成功的写操作，页面仍可下拉重试
  async function refreshTags(current: RelationTagAccount) {
    return mutateCache<RelationTag[]>(getRelationTagsKey(current)).catch(() => undefined);
  }

  // 拿不到分组列表时退回本次选择的分组，至少保证这些分组的成员列表会重新拉取
  function toGroupTagIds(tags: RelationTag[] | undefined, fallback: readonly number[]) {
    return tags ? getFollowGroupTags(tags).map((tag) => tag.tagid) : fallback;
  }

  // 结果不确定时只能普通刷新：分组列表刷新失败就退回本次选择的分组
  async function refreshChangedGroups(current: RelationTagAccount, tagids: readonly number[]) {
    const tags = await refreshTags(current);
    await revalidateRelationTagMembers(mutateCache, current, toGroupTagIds(tags, tagids));
  }

  // 设置分组会改变「特别关注」成员，需要让全部列表的排序与高亮跟着更新
  async function revalidateSpecialFollowUps(current: RelationTagAccount) {
    await mutateCache(getSpecialFollowUpsKey(current), undefined, { revalidate: true }).catch(
      () => {},
    );
  }

  async function updateSpecialFollowUps(
    current: RelationTagAccount,
    mid: string | number,
    tagids: readonly number[],
  ) {
    const key = getSpecialFollowUpsKey(current);
    const members = getCachedData<Set<string>>(cache, key);
    if (!members) {
      await revalidateSpecialFollowUps(current);
      return;
    }
    const next = new Set(members);
    if (tagids.includes(RELATION_TAG_SPECIAL_ID)) {
      next.add(String(mid));
    } else {
      next.delete(String(mid));
    }
    await mutateCache(key, next, { revalidate: false }).catch(() => {});
  }

  function revalidateRemovedGroupsLater(
    current: RelationTagAccount,
    mid: string | number,
    removedTagids: readonly number[],
  ) {
    void wait(RELATION_TAG_MEMBERS_REFRESH_DELAY)
      .then(async () => {
        if (!bilibiliSession.isCurrentAccount(current)) {
          return;
        }
        const latestTagids = getCachedData<number[]>(cache, getRelationUpTagsKey(current, mid));
        const latestTagidSet = latestTagids ? new Set(latestTagids) : null;
        const stillRemoved = latestTagidSet
          ? removedTagids.filter((tagid) => !latestTagidSet.has(tagid))
          : removedTagids;
        if (!stillRemoved.length) {
          return;
        }
        await revalidateRelationTagMembers(mutateCache, current, stillRemoved);
        // 服务端仍可能返回短暂的旧数据，已确认移出的成员不能重新出现在列表中。
        await removeRelationTagMemberFromCaches(mutateCache, current, stillRemoved, mid);
      })
      .catch(() => {});
  }

  async function run<T>(key: string, work: (current: RelationTagAccount) => Promise<T>) {
    const current = assertAccount();
    const pendingKey = `${current.mid}:${current.generation}:${key}`;
    if (pending.current.has(pendingKey)) {
      throw new Error("操作正在进行，请稍候");
    }
    pending.current.add(pendingKey);
    try {
      return await work(current);
    } finally {
      pending.current.delete(pendingKey);
    }
  }

  function createTag(name: string) {
    return run("create", async (current) => {
      try {
        const created = await createBilibiliRelationTag(
          { account: current, name },
          relationTagMutationDependencies,
        );
        await refreshTags(current);
        return created;
      } catch (cause) {
        if (!(cause instanceof RelationTagResultUnknownError)) {
          throw cause;
        }
        await refreshTags(current);
        throw new RelationTagResultUnknownError(
          `${cause.message}，已刷新分组列表，请确认结果后再操作`,
        );
      }
    });
  }

  function renameTag(tagid: number, name: string) {
    return run(`rename:${tagid}`, async (current) => {
      try {
        await renameBilibiliRelationTag(
          { account: current, tagid, name },
          relationTagMutationDependencies,
        );
      } catch (cause) {
        if (!(cause instanceof RelationTagResultUnknownError)) {
          throw cause;
        }
        await refreshTags(current);
        throw new RelationTagResultUnknownError(
          `${cause.message}，已刷新分组列表，请确认结果后再操作`,
        );
      }
      await refreshTags(current);
    });
  }

  function deleteTag(tagid: number) {
    return run(`delete:${tagid}`, async (current) => {
      try {
        await deleteBilibiliRelationTag(
          { account: current, tagid },
          relationTagMutationDependencies,
        );
      } catch (cause) {
        if (!(cause instanceof RelationTagResultUnknownError)) {
          throw cause;
        }
        await refreshTags(current);
        throw new RelationTagResultUnknownError(
          `${cause.message}，已刷新分组列表，请确认结果后再操作`,
        );
      }
      // 已删除的分组不再缓存在列表里
      await clearRelationTagMemberPages(mutateCache, current, [tagid]).catch(() => {});
      await refreshTags(current);
      // 该分组下的 UP 会回到默认分组，默认分组列表需要重新拉取
      await revalidateRelationTagMembers(mutateCache, current, [RELATION_TAG_DEFAULT_ID]);
    });
  }

  function setUpGroups(mid: string | number, tagids: number[]) {
    return run(`set-up:${mid}`, async (current) => {
      const previousTagids = getCachedData<number[]>(
        cache,
        getRelationUpTagsKey(current, mid),
      );
      try {
        await setBilibiliUpRelationTags(
          { account: current, mid, tagids },
          relationTagMutationDependencies,
        );
      } catch (cause) {
        if (!(cause instanceof RelationTagResultUnknownError)) {
          throw cause;
        }
        await refreshChangedGroups(current, tagids);
        await revalidateSpecialFollowUps(current);
        throw new RelationTagResultUnknownError(
          `${cause.message}，已刷新分组，请确认结果后再操作`,
        );
      }
      // 分组人数由 B站 异步统计，写成功后立刻拉取往往还是旧值，这里先本地更新再重试
      void syncRelationTagCounts(
        mutateCache,
        cache,
        current,
        mid,
        tagids,
        () => bilibiliSession.isCurrentAccount(current),
      );
      if (previousTagids) {
        // 用 Set 做写入前后的分组差异比较，避免在 filter 里反复线性查找
        const tagidSet = new Set(tagids);
        const previousTagidSet = new Set(previousTagids);
        const removedTagids = previousTagids.filter((tagid) => !tagidSet.has(tagid));
        const addedTagids = tagids.filter((tagid) => !previousTagidSet.has(tagid));
        await removeRelationTagMemberFromCaches(mutateCache, current, removedTagids, mid);
        await revalidateRelationTagMembers(mutateCache, current, addedTagids);
        revalidateRemovedGroupsLater(current, mid, removedTagids);
      } else {
        // 拿不到写入前的分组时无法安全地做本地增量更新，退回全量校验。
        await revalidateRelationTagMembers(
          mutateCache,
          current,
          toGroupTagIds(getCachedData<RelationTag[]>(cache, getRelationTagsKey(current)), tagids),
        );
      }
      await updateSpecialFollowUps(current, mid, tagids);
    });
  }

  return { createTag, renameTag, deleteTag, setUpGroups };
}
