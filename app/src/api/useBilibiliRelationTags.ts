import { useEffect, useRef } from "react";
import useSWR, { useSWRConfig } from "swr";
import useSWRInfinite from "swr/infinite";

import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import { bilibiliSession } from "../features/bilibili-session/session";
import { useBilibiliSessionState } from "../features/bilibili-session/useBilibiliSession";
import type { UpInfo } from "../types";
import fetcher from "./fetcher";
import { getBilibiliLoginCookie } from "./get-cookie";
import {
  createBilibiliRelationTag,
  deleteBilibiliRelationTag,
  fetchBilibiliRelationTagMembers,
  fetchBilibiliRelationTags,
  fetchBilibiliUpRelationTags,
  getRelationTagMembersKey,
  getRelationTagsKey,
  getRelationUpTagsKey,
  RELATION_TAG_MEMBERS_PAGE_SIZE,
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

function useRelationTagAccount() {
  const { account } = useBilibiliSessionState();
  return account && bilibiliSession.isCurrentAccount(account) ? account : null;
}

function membersKeyMatcher(account: RelationTagAccount, tagids?: readonly number[]) {
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
 * 分组的写操作。写成功后统一刷新分组列表；结果不确定时先刷新再抛错，
 * 避免用户重复提交。
 */
export function useRelationTagActions() {
  const account = useRelationTagAccount();
  const { mutate: mutateCache } = useSWRConfig();
  const pending = useRef(new Set<string>());

  function assertAccount() {
    if (!account || !bilibiliSession.isCurrentAccount(account)) {
      throw new BilibiliSessionChangedError();
    }
    return account;
  }

  // 刷新失败不影响已经成功的写操作，页面仍可下拉重试
  async function refreshTags(current: RelationTagAccount) {
    await mutateCache(getRelationTagsKey(current)).catch(() => {});
  }

  async function revalidateMembers(current: RelationTagAccount, tagids?: readonly number[]) {
    await mutateCache(membersKeyMatcher(current, tagids), undefined, { revalidate: true }).catch(
      () => {},
    );
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
      await mutateCache(membersKeyMatcher(current, [tagid]), undefined, {
        revalidate: false,
      }).catch(() => {});
      await refreshTags(current);
    });
  }

  function setUpGroups(mid: string | number, tagids: number[]) {
    return run(`set-up:${mid}`, async (current) => {
      try {
        await setBilibiliUpRelationTags(
          { account: current, mid, tagids },
          relationTagMutationDependencies,
        );
      } catch (cause) {
        if (!(cause instanceof RelationTagResultUnknownError)) {
          throw cause;
        }
        await refreshTags(current);
        await revalidateMembers(current);
        throw new RelationTagResultUnknownError(
          `${cause.message}，已刷新分组，请确认结果后再操作`,
        );
      }
      await refreshTags(current);
      await revalidateMembers(current);
    });
  }

  return { createTag, renameTag, deleteTag, setUpGroups };
}
