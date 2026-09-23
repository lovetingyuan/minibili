import useSWRImmutable from "swr/immutable";
import useSWRInfinite from "swr/infinite";

import {
  buildSpaceContentCountsUrl,
  dedupeSpaceItems,
  getSpaceOpusPageKey,
  getSpaceVideoPageKey,
  mapSpaceOpusItem,
  mapSpaceVideoItem,
  SPACE_VIDEO_PAGE_SIZE,
} from "./space-items.mapper";
import {
  SpaceContentCountsSchema,
  SpaceOpusPageSchema,
  SpaceVideoPageSchema,
} from "./space-items.schema";
import type { SpaceOpusPage, SpaceVideoPage } from "./space-items.schema";
import type { SpaceOwner } from "./space-items.types";
import { useEmoteMap } from "./emotes";
import request from "./fetcher";

async function fetchSpaceVideoPage(url: string) {
  return SpaceVideoPageSchema.parse(await request<unknown>(url));
}

async function fetchSpaceOpusPage(url: string) {
  return SpaceOpusPageSchema.parse(await request<unknown>(url));
}

export function useSpaceContentCounts(mid?: string | number) {
  const { data } = useSWRImmutable(
    mid ? buildSpaceContentCountsUrl(mid) : null,
    async (url: string) => SpaceContentCountsSchema.parse(await request<unknown>(url)),
  );

  return {
    videoCount: data?.video,
    opusCount: data?.opus,
  };
}

export function useSpaceVideoItems(owner: SpaceOwner) {
  const swr = useSWRInfinite<SpaceVideoPage, Error>(
    (pageIndex, previousPage) => getSpaceVideoPageKey(owner.mid, pageIndex, previousPage),
    fetchSpaceVideoPage,
    { revalidateFirstPage: true, shouldRetryOnError: false, dedupingInterval: 5 * 60 * 1000 },
  );
  const list = dedupeSpaceItems(
    (swr.data ?? []).flatMap((page) =>
      page.list.vlist.map((item) => mapSpaceVideoItem(item, owner)),
    ),
  );
  const lastPage = swr.data?.[swr.data.length - 1];
  const isReachingEnd = lastPage ? lastPage.list.vlist.length < SPACE_VIDEO_PAGE_SIZE : false;
  const isLoadingMore = Boolean(swr.data && swr.size > swr.data.length);

  async function refresh() {
    await swr.setSize(1);
    await swr.mutate();
  }

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
    isRefreshing: swr.isValidating && Boolean(swr.data) && !isLoadingMore,
    isReachingEnd,
    isLoadingMore,
    isLoading: swr.isLoading,
    isValidating: swr.isValidating,
    refresh,
    loadMore,
    retry: swr.mutate,
  };
}

export function useSpaceOpusItems(owner: SpaceOwner) {
  // 正文里的表情是纯文本标签，拿到名字到图片的映射后才能渲染成图片。
  const emoteMap = useEmoteMap();
  const swr = useSWRInfinite<SpaceOpusPage, Error>(
    (pageIndex, previousPage) => getSpaceOpusPageKey(owner.mid, pageIndex, previousPage),
    fetchSpaceOpusPage,
    { revalidateFirstPage: true, shouldRetryOnError: false, dedupingInterval: 5 * 60 * 1000 },
  );
  const list = dedupeSpaceItems(
    (swr.data ?? []).flatMap((page) =>
      page.items.map((item) => mapSpaceOpusItem(item, owner, emoteMap)),
    ),
  );
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
    } else if (!swr.isValidating && !isReachingEnd) {
      void swr.setSize((size) => size + 1);
    }
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
    retry: swr.mutate,
  };
}
