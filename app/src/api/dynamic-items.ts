import useSWR from "swr";
import useSWRInfinite from "swr/infinite";

import { buildDynamicListUrl, getDynamicPageKey, mapDynamicItem } from "./dynamic-items.mapper";
import { DynamicDetailResponseSchema, DynamicListResponseSchema } from "./dynamic-items.schema";
import type { DynamicListResponse } from "./dynamic-items.schema";
import type { DynamicItem } from "./dynamic-items.type";
import request from "./fetcher";

async function fetchDynamicPage(url: string) {
  const response = await request<unknown>(url);
  return DynamicListResponseSchema.parse(response);
}

export function useDynamicItems(mid?: string | number) {
  const swr = useSWRInfinite<DynamicListResponse, Error>(
    (pageIndex, previousPage) => getDynamicPageKey(mid, pageIndex, previousPage),
    fetchDynamicPage,
    {
      revalidateFirstPage: true,
      shouldRetryOnError: false,
      dedupingInterval: 5 * 60 * 1000,
    },
  );
  const rawItems = swr.data?.flatMap((page) => page.items) ?? [];
  const seen = new Set<string>();
  const list = rawItems.reduce<DynamicItem[]>((items, rawItem) => {
    const item = mapDynamicItem(rawItem);
    if (!seen.has(item.id)) {
      seen.add(item.id);
      items.push(item);
    }
    return items;
  }, []);
  const lastPage = swr.data?.[swr.data.length - 1];
  const isReachingEnd = lastPage ? !lastPage.has_more || !lastPage.items.length : false;
  const isLoadingMore = Boolean(swr.data && swr.size > swr.data.length);

  async function refresh() {
    await swr.setSize(1);
    await swr.mutate();
  }

  function loadMore() {
    if (swr.error) {
      void swr.mutate();
      return;
    }
    if (!swr.isValidating && !isReachingEnd) {
      void swr.setSize((size) => size + 1);
    }
  }

  async function retry() {
    await swr.mutate();
  }

  return {
    list,
    error: swr.error,
    isRefreshing: swr.isValidating && Boolean(swr.data) && !isLoadingMore,
    isReachingEnd,
    isLoadingMore,
    isLoading: swr.isLoading,
    isValidating: swr.isValidating,
    refresh,
    loadMore,
    retry,
  };
}

export function useDynamicDetail(dynamicId?: string) {
  const url = dynamicId
    ? `/x/polymer/web-dynamic/v1/detail?id=${encodeURIComponent(dynamicId)}&features=itemOpusStyle`
    : null;
  return useSWR<DynamicItem, Error>(
    url,
    async (requestUrl: string) => {
      const response = await request<unknown>(requestUrl);
      return mapDynamicItem(DynamicDetailResponseSchema.parse(response).item);
    },
    { shouldRetryOnError: false },
  );
}

export function checkSingleUpUpdate(mid: string | number) {
  return fetchDynamicPage(buildDynamicListUrl(mid)).then((data) => {
    let latestTime = 0;
    let latestId = "";
    data.items.forEach((item) => {
      if (item.type === "DYNAMIC_TYPE_LIVE_RCMD") {
        return;
      }
      const pubTime = Number(item.modules.module_author.pub_ts);
      if (Number.isFinite(pubTime) && pubTime > latestTime) {
        latestTime = pubTime;
        latestId = String(item.id_str);
      }
    });
    return latestId;
  });
}
