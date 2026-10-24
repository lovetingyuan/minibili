import { useEffect, useId, useRef, useState } from "react";
import { useSWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";

import { enqueueToast } from "@/features/toast/toast-store";

import type {
  CommentPageUrlLoader,
  CommentPagesUpdater,
  CommentPaginationKey,
  CommentPaginationSession,
} from "./comment-pagination.types";

/** 评论接口的游标可能依赖请求顺序，阅读期间只请求尚未加载的页。 */
export function useCommentPagination<Page>(
  getPageUrl: CommentPageUrlLoader<Page>,
  fetchPage: (url: string) => Promise<Page>,
) {
  const listId = useId();
  const firstUrl = getPageUrl(0, null);
  const [session, setSession] = useState({ firstUrl, revision: 0 });
  const [refreshingGeneration, setRefreshingGeneration] = useState<string | null>(null);
  const pending = useRef(new Map<string, Promise<unknown>>());
  const pageRequests = useRef(new Map<string, Promise<Page>>());
  const refreshes = useRef(new Map<string, Promise<void>>());
  const { mutate: mutateCache } = useSWRConfig();

  const activeSession =
    session.firstUrl === firstUrl ? session : { firstUrl, revision: session.revision + 1 };
  if (activeSession !== session) {
    setSession(activeSession);
  }
  const currentSession = useRef<CommentPaginationSession | null>(activeSession);
  useEffect(() => {
    currentSession.current = activeSession;
    return () => {
      currentSession.current = null;
    };
  }, [activeSession]);

  const generation = `${listId}:${activeSession.revision}`;
  function getKey(index: number, previous: Page | null): CommentPaginationKey | null {
    const url = getPageUrl(index, previous);
    return url ? [url, index, generation] : null;
  }

  const { data, error, size, setSize, isLoading, isValidating } = useSWRInfinite<
    Page,
    Error,
    typeof getKey
  >(
    getKey,
    async ([url]) => {
      const task = fetchPage(url);
      pageRequests.current.set(generation, task);
      try {
        return await task;
      } finally {
        if (pageRequests.current.get(generation) === task) {
          pageRequests.current.delete(generation);
        }
      }
    },
    {
      revalidateFirstPage: false,
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      persistSize: false,
      parallel: false,
      // 重复游标不一定幂等，失败由用户重试，避免后台请求改变分页会话。
      shouldRetryOnError: false,
    },
  );

  async function requestSize(nextSize: number) {
    if (
      currentSession.current !== activeSession ||
      pending.current.has(generation) ||
      refreshes.current.has(generation)
    ) {
      return;
    }
    const task = Promise.resolve().then(() =>
      currentSession.current === activeSession ? setSize(nextSize) : undefined,
    );
    pending.current.set(generation, task);
    try {
      await task;
    } catch {
      // SWR 保留错误和已加载内容，页脚提供同一页的重试入口。
    } finally {
      pending.current.delete(generation);
    }
  }

  async function update(isPageEnd: boolean) {
    if (isLoading || isValidating || error || isPageEnd || !data?.length || data.length < size) {
      return;
    }
    await requestSize(size + 1);
  }

  async function retry() {
    if (!isValidating) {
      await requestSize(size);
    }
  }

  function refresh(): Promise<void> {
    const existing = refreshes.current.get(generation);
    if (existing) {
      return existing;
    }
    if (!firstUrl || currentSession.current !== activeSession) {
      return Promise.resolve();
    }
    setRefreshingGeneration(generation);
    const task = (async () => {
      try {
        await pending.current.get(generation)?.catch(() => {});
        await pageRequests.current.get(generation)?.catch(() => {});
        const page = await fetchPage(firstUrl);
        if (currentSession.current !== activeSession) {
          return;
        }
        const nextSession = { firstUrl, revision: activeSession.revision + 1 };
        const key: CommentPaginationKey = [firstUrl, 0, `${listId}:${nextSession.revision}`];
        // 先填好新会话的单页和列表缓存，再切换，失败不会清空正在阅读的内容。
        await mutateCache(key, page, { revalidate: false });
        await mutateCache(
          unstable_serialize(() => key),
          [page],
          { revalidate: false },
        );
        currentSession.current = nextSession;
        setSession(nextSession);
      } catch (error) {
        if (currentSession.current === activeSession) {
          enqueueToast("刷新失败，请重试", false);
        }
        throw error;
      } finally {
        refreshes.current.delete(generation);
        setRefreshingGeneration((current) => (current === generation ? null : current));
      }
    })();
    refreshes.current.set(generation, task);
    return task;
  }

  async function mutatePages(updatePages: CommentPagesUpdater<Page>) {
    await refreshes.current.get(generation)?.catch(() => {});
    const current = currentSession.current;
    if (!current?.firstUrl || current.firstUrl !== firstUrl) {
      return;
    }
    const currentGeneration = `${listId}:${current.revision}`;
    const pageRequest = pageRequests.current.get(currentGeneration);
    if (pageRequest) {
      await pageRequest.catch(() => {});
    }
    while (pending.current.has(currentGeneration)) {
      await pending.current.get(currentGeneration)?.catch(() => {});
    }
    const firstKey: CommentPaginationKey = [current.firstUrl, 0, currentGeneration];
    const task = mutateCache<Page[]>(
      unstable_serialize(() => firstKey),
      async (pages) => {
        const next = updatePages(pages);
        if (!next) {
          return next;
        }
        let previous: Page | null = null;
        for (const [index, page] of next.entries()) {
          const url = getPageUrl(index, previous);
          if (url) {
            await mutateCache([url, index, currentGeneration], page, { revalidate: false });
          }
          previous = page;
        }
        return next;
      },
      { revalidate: false },
    );
    pending.current.set(currentGeneration, task);
    try {
      await task;
    } finally {
      pending.current.delete(currentGeneration);
    }
  }

  return {
    data,
    error,
    isLoading,
    isValidating: isValidating || refreshingGeneration === generation,
    update,
    retry,
    refresh,
    mutatePages,
  };
}
