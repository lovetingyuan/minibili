import useSWR from "swr";
import type { z } from "zod";

import request from "./fetcher";
import type { PlayUrlResponseSchema } from "./play-url.schema";

type Res = z.infer<typeof PlayUrlResponseSchema>;

/**
 * 只支持 B站的 720P(64) 与 1080P(80)
 */
export type VideoQuality = 64 | 80;

function createPlayUrlQuery(bvid: string, cid: number, qn: VideoQuality) {
  const search = new URLSearchParams();
  // https://socialsisteryi.github.io/bilibili-API-collect/docs/video/videostream_url.html
  Object.entries({
    bvid,
    cid,
    type: "mp4",
    qn,
    fnval: 1,
    fnver: 0,
    fourk: 1,
    try_look: 1,
    platform: "pc",
    high_quality: 1,
  }).forEach(([k, v]) => {
    search.append(k, `${v}`);
  });
  return search;
}

/**
 * 原生播放器使用的播放地址，返回渐进式 mp4（单文件带音轨）。
 * 未登录时 B站最高只返回 720P，此时 quality 会是 64，调用方按返回的清晰度静默播放。
 */
export function useVideoPlayUrl(bvid: string, cid: number | undefined, qn: VideoQuality) {
  const search = bvid && cid ? createPlayUrlQuery(bvid, cid, qn) : null;

  const { data, error, mutate } = useSWR<Res>(
    search ? `/x/player/wbi/playurl?${search}` : null,
    (url) => request<Res>(url + "&_t=" + Date.now()),
    {
      // 播放地址是有时效的签名地址，只在切清晰度/切分P/手动重试时更新，避免重建播放器
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      errorRetryCount: 2,
      errorRetryInterval: 1000,
    },
  );

  const durl = data?.durl?.[0];
  return {
    uri: durl?.url || durl?.backup_url?.[0] || undefined,
    quality: data?.quality,
    error,
    retry: () => mutate(),
  };
}

export function useVideoMp4Url(bvid: string, cid?: number, highQuality?: boolean) {
  const search = new URLSearchParams();
  // https://socialsisteryi.github.io/bilibili-API-collect/docs/video/videostream_url.html
  if (bvid && cid) {
    const query = {
      bvid,
      cid,
      type: "mp4",
      qn: highQuality ? 64 : 32,
      fnval: 1,
      try_look: 1,
      platform: "pc",
      high_quality: highQuality ? 1 : 0,
    };
    Object.entries(query).forEach(([k, v]) => {
      search.append(k, `${v}`);
    });
  }

  const { data, error, mutate } = useSWR<Res>(
    bvid && cid ? `/x/player/wbi/playurl?${search}` : null,
    (url) => {
      return request<Res>(url + "&_t=" + Date.now());
    },
    {
      // dedupingInterval: 60 * 1000 * 1000,
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 0,
    },
  );
  let url = data?.durl ? data.durl[0]?.url || data.durl[0]?.backup_url?.[0] || "" : null;
  if (highQuality && url) {
    url += "&_high_quality=true";
  }
  return {
    videoUrl: url,
    error,
    retry: () => mutate(),
  };
}

export function getDownloadUrl(bvid: string, cid: number) {
  const search = new URLSearchParams();
  if (!bvid || !cid) {
    return;
  }
  // https://socialsisteryi.github.io/bilibili-API-collect/docs/video/videostream_url.html

  const query = {
    bvid,
    cid,
    type: "mp4",
    qn: 64,
    fnval: 4048,
    platform: "html5",
    high_quality: 1,
    try_look: 1,
  };
  Object.entries(query).forEach(([k, v]) => {
    search.append(k, `${v}`);
  });
  return request<Res>(`/x/player/wbi/playurl?${search}`).then((res) => {
    return res.durl?.[0]?.url;
  });
}
