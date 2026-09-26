import useSWRInfinite from "swr/infinite";

import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { stripEmTags } from "@/utils";

import { mapDynamicItem } from "./dynamic-items.mapper";
import { dedupeSpaceItems, mapSpaceVideoItem } from "./space-items.mapper";
import { SpaceVideoPageSchema } from "./space-items.schema";
import type { SpaceVideoPage } from "./space-items.schema";
import type { SpaceOwner } from "./space-items.types";
import { SpaceDynamicSearchPageSchema } from "./space-search.schema";
import type { SpaceDynamicSearchPage } from "./space-search.types";
import request from "./fetcher";

const SPACE_SEARCH_PAGE_SIZE = 20;
const DYNAMIC_SEARCH_FEATURES = [
  "itemOpusStyle",
  "listOnlyfans",
  "opusBigCover",
  "onlyfansVote",
  "forwardListHidden",
  "decorationCard",
].join(",");

function buildSpaceVideoSearchUrl(mid: string | number, keyword: string, page: number) {
  return (
    "/x/space/wbi/arc/search?" +
    new URLSearchParams({
      pn: String(page),
      ps: String(SPACE_SEARCH_PAGE_SIZE),
      tid: "0",
      special_type: "",
      order: "pubdate",
      mid: String(mid),
      index: "0",
      keyword,
      order_avoided: "true",
      platform: "web",
    }).toString()
  );
}

function buildSpaceDynamicSearchUrl(
  mid: string | number,
  keyword: string,
  page: number,
  offset = "",
) {
  return (
    "/x/polymer/web-dynamic/v1/feed/space/search?" +
    new URLSearchParams({
      host_mid: String(mid),
      page: String(page),
      offset,
      keyword,
      features: DYNAMIC_SEARCH_FEATURES,
    }).toString()
  );
}

async function fetchSpaceVideoSearchPage(url: string): Promise<SpaceVideoPage> {
  return SpaceVideoPageSchema.parse(await request<unknown>(url));
}

async function fetchSpaceDynamicSearchPage(url: string): Promise<SpaceDynamicSearchPage> {
  return SpaceDynamicSearchPageSchema.parse(await request<unknown>(url));
}

export function useSpaceVideoSearchItems(owner: SpaceOwner, keyword: string) {
  const swr = useSWRInfinite<SpaceVideoPage, Error>(
    (pageIndex, previousPage) => {
      if (!keyword || (previousPage && previousPage.list.vlist.length < SPACE_SEARCH_PAGE_SIZE)) {
        return null;
      }
      return buildSpaceVideoSearchUrl(owner.mid, keyword, pageIndex + 1);
    },
    fetchSpaceVideoSearchPage,
    { revalidateFirstPage: false, shouldRetryOnError: false, dedupingInterval: 5 * 60 * 1000 },
  );
  const list = dedupeSpaceItems(
    (swr.data ?? []).flatMap((page) =>
      page.list.vlist.map((item) =>
        mapSpaceVideoItem(
          {
            ...item,
            title: stripEmTags(item.title),
            description: stripEmTags(item.description),
          },
          owner,
        ),
      ),
    ),
  );
  const lastPage = swr.data?.[swr.data.length - 1];
  const isReachingEnd = lastPage ? lastPage.list.vlist.length < SPACE_SEARCH_PAGE_SIZE : false;
  const isLoadingMore = Boolean(swr.data && swr.size > swr.data.length);
  const pullToRefresh = usePullToRefresh(async () => {
    await swr.setSize(1);
    await swr.mutate();
  });

  function loadMore() {
    if (swr.error) {
      void swr.mutate();
    } else if (!swr.isValidating && !isReachingEnd) {
      void swr.setSize((size) => size + 1);
    }
  }

  return {
    list,
    error: swr.error,
    isRefreshing: pullToRefresh.refreshing,
    isReachingEnd,
    isLoadingMore,
    isLoading: swr.isLoading,
    isValidating: swr.isValidating,
    refresh: pullToRefresh.onRefresh,
    loadMore,
    retry: swr.mutate,
  };
}

export function useSpaceDynamicSearchItems(owner: SpaceOwner, keyword: string) {
  const swr = useSWRInfinite<SpaceDynamicSearchPage, Error>(
    (pageIndex, previousPage) => {
      if (!keyword || (previousPage && (!previousPage.has_more || !previousPage.items.length))) {
        return null;
      }
      return buildSpaceDynamicSearchUrl(
        owner.mid,
        keyword,
        pageIndex + 1,
        pageIndex ? (previousPage?.offset ?? "") : "",
      );
    },
    fetchSpaceDynamicSearchPage,
    { revalidateFirstPage: false, shouldRetryOnError: false, dedupingInterval: 5 * 60 * 1000 },
  );
  const list = dedupeSpaceItems((swr.data ?? []).flatMap((page) => page.items.map(mapDynamicItem)));
  const lastPage = swr.data?.[swr.data.length - 1];
  const isReachingEnd = lastPage ? !lastPage.has_more || !lastPage.items.length : false;
  const isLoadingMore = Boolean(swr.data && swr.size > swr.data.length);
  const pullToRefresh = usePullToRefresh(async () => {
    await swr.setSize(1);
    await swr.mutate();
  });

  function loadMore() {
    if (swr.error) {
      void swr.mutate();
    } else if (!swr.isValidating && !isReachingEnd) {
      void swr.setSize((size) => size + 1);
    }
  }

  return {
    list,
    error: swr.error,
    isRefreshing: pullToRefresh.refreshing,
    isReachingEnd,
    isLoadingMore,
    isLoading: swr.isLoading,
    isValidating: swr.isValidating,
    refresh: pullToRefresh.onRefresh,
    loadMore,
    retry: swr.mutate,
  };
}
