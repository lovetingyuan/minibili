import React from "react";
import useSWRInfinite from "swr/infinite";
import type { z } from "zod";

import { enqueueToast } from "../features/toast";
import { useStore } from "../store";
import type { VideoItemResponseSchema } from "./hot-videos.schema";
import request from "./fetcher";

export type HotVideoResponse = z.infer<typeof VideoItemResponseSchema>;

export const getVideo = (item: HotVideoResponse) => {
  return {
    aid: item.aid,
    bvid: item.bvid,
    cid: item.cid,
    title: item.title,
    desc: item.desc,
    cover: item.pic,
    duration: item.duration,
    date: item.pubdate,
    name: item.owner.name,
    mid: item.owner.mid,
    face: item.owner.face,
    playNum: item.stat.view,
    shareNum: item.stat.share,
    likeNum: item.stat.like,
    commentNum: item.stat.reply,
    danmuNum: item.stat.danmaku,
    tag: item.tname,
    videosNum: item.videos,
    width: item.dimension.width,
    height: item.dimension.height,
  };
};

export type VideoItem = ReturnType<typeof getVideo>;

// https://api.bilibili.com/x/web-interface/popular?ps=20&pn=1

export function useHotVideos() {
  // 热门接口按请求顺序返回分页，换一个 _t 等于从头重新拉一遍列表
  const { hotVideosRevision, setHotVideosRevision } = useStore();
  const [pendingRevision, setPendingRevision] = React.useState<number | null>(null);
  const revision = pendingRevision ?? hotVideosRevision;
  const refreshingRevision = React.useRef<number | null>(null);
  const { data, mutate, size, setSize, isLoading, isValidating, error } = useSWRInfinite<{
    list: HotVideoResponse[];
    no_more: boolean;
  }>(
    (index) => {
      return `/x/web-interface/popular?ps=30&pn=${index + 1}&_t=${revision}`;
    },
    request,
    {
      keepPreviousData: true,
      revalidateIfStale: false,
      revalidateFirstPage: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      persistSize: false,
      parallel: false,
      onSuccess: () => finishRefresh(true),
      onError: () => finishRefresh(false),
      // 热门的请求结果并不是严格按照pn来返回的，而是跟请求顺序有关，
      // 比如请求第一页再请求第三页，这个第三页返回的数据其实是第二页
      // 所以此处不再验证首页，否则后续请求又是第二页了，而是直接按顺序请求下一页
    },
  );
  const isLoadingMore = isLoading || (size > 0 && !!data && typeof data[size - 1] === "undefined");
  const isReachingEnd = !!data && !!data[data.length - 1]?.no_more;
  const list = data?.flatMap((page) => page.list.map(getVideo)) ?? [];
  function finishRefresh(success: boolean) {
    if (refreshingRevision.current !== revision) {
      return;
    }
    refreshingRevision.current = null;
    if (success) {
      setHotVideosRevision((current) => Math.max(current, revision));
      enqueueToast("刷新成功", false);
    } else {
      // 恢复旧 key 后本次错误不会留在页面上，需在此提示刷新失败。
      enqueueToast("刷新失败", false);
    }
    setPendingRevision(null);
  }

  function refresh() {
    if (refreshingRevision.current !== null) {
      return;
    }
    const nextRevision = Math.max(Date.now(), revision + 1);
    refreshingRevision.current = nextRevision;
    setPendingRevision(nextRevision);
  }

  return {
    list,
    isRefreshing: pendingRevision !== null,
    isReachingEnd,
    loading: isLoadingMore,
    mutate,
    update: () => {
      if (refreshingRevision.current !== null || isValidating || isLoadingMore || isReachingEnd) {
        return;
      }
      setSize((current) => current + 1);
    },
    refresh,
    error,
  };
}
