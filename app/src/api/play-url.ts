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
 * 收集可用的播放地址：主地址优先，其后是 B站分配的 CDN 备用镜像。
 * 同一个视频会分散在不同 CDN 上，单个镜像鉴权失败/抖动时按顺序回退。
 */
export function collectPlayUrls(url?: string | null, backupUrls?: string[] | null) {
  const urls = [url, ...(backupUrls ?? [])].filter((item): item is string => Boolean(item));
  return [...new Set(urls)];
}

/**
 * 原生播放器使用的播放地址，返回渐进式 mp4（单文件带音轨）。
 * 未登录时 B站最高只返回 720P，此时 quality 会是 64，调用方按返回的清晰度静默播放。
 * 返回主地址与各 CDN 备用镜像，播放失败时由调用方按顺序回退。
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
    urls: collectPlayUrls(durl?.url, durl?.backup_url),
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

/**
 * 可下载的视频文件信息。
 * urls 是主地址与 B站分配的 CDN 备用镜像，按顺序回退。
 */
export type VideoDownloadSource = {
  urls: string[];
  /** 服务端实际返回的清晰度，如 64(720P)、32(480P) */
  quality: number;
  /** 文件总字节数，服务端未返回时为 0 */
  size: number;
};

/**
 * 服务端没有返回可下载的渐进式地址（付费内容、接口限制等）。
 */
export class VideoDownloadUnsupportedError extends Error {
  constructor(message = "暂不支持下载该视频") {
    super(message);
    this.name = "VideoDownloadUnsupportedError";
  }
}

/**
 * 取下载地址：fnval=0 让服务端返回渐进式 mp4（音轨已封装在同一个文件里），
 * 下载后无需再做音视频合并；未登录时最高 720P。
 * 注意不能带 fnval 的 DASH 位，否则服务端只返回 dash、没有 durl。
 */
export async function getVideoDownloadSource(
  bvid: string,
  cid: number,
): Promise<VideoDownloadSource> {
  if (!bvid || !cid) {
    throw new VideoDownloadUnsupportedError();
  }

  const search = new URLSearchParams();
  // https://socialsisteryi.github.io/bilibili-API-collect/docs/video/videostream_url.html
  const query = {
    bvid,
    cid,
    type: "mp4",
    qn: 64,
    fnval: 0,
    fnver: 0,
    fourk: 1,
    try_look: 1,
    platform: "pc",
    high_quality: 1,
  };
  Object.entries(query).forEach(([k, v]) => {
    search.append(k, `${v}`);
  });

  const res = await request<Res>(`/x/player/wbi/playurl?${search}`);
  const durl = res.durl?.[0];
  const urls = collectPlayUrls(durl?.url, durl?.backup_url);
  if (!urls.length) {
    throw new VideoDownloadUnsupportedError();
  }
  return {
    urls,
    quality: res.quality,
    size: durl?.size ?? 0,
  };
}
