import useSWR from "swr";
import type { z } from "zod";

import request, { getApiErrorCode } from "./fetcher";
import type { PlayUrlResponseSchema } from "./play-url.schema";
import { DashPlayUrlResponseSchema } from "./play-url.schema";
import { createDashPlaySources, VIDEO_QUALITIES } from "./play-dash";
import type { VideoDownloadSource, VideoQuality, VideoStreamFormat } from "./play-url.types";

export type { VideoDownloadSource, VideoQuality } from "./play-url.types";

type Res = z.infer<typeof PlayUrlResponseSchema>;

function createPlayUrlQuery(
  bvid: string,
  cid: number,
  qn: VideoQuality,
  format: VideoStreamFormat,
) {
  const search = new URLSearchParams();
  // https://socialsisteryi.github.io/bilibili-API-collect/docs/video/videostream_url.html
  Object.entries({
    bvid,
    cid,
    ...(format === "mp4" ? { type: "mp4" } : {}),
    qn: format === "dash" ? 80 : qn,
    fnval: format === "dash" ? 16 : 1,
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
 * 服务端实际给到的可播时长（毫秒）。
 * 分段视频会拆成多个 durl，必须累加：只看 durl[0] 会把长视频误判成试看。
 */
export function sumPlayUrlDurationMs(durl?: readonly { length: number }[] | null) {
  if (!durl?.length) {
    return 0;
  }
  return durl.reduce(
    (total, item) => (Number.isFinite(item.length) ? total + item.length : total),
    0,
  );
}

/**
 * 重试也不会变好的错误码：稿件不可见、PGC 内容（番剧/影视不走 UGC 播放接口）、
 * 充电专属但 UP 主没有开放试看（87008）。这些直接展示提示，不再自动重试。
 */
const UNPLAYABLE_PLAY_URL_CODES = [-403, -404, 87008];

export function isUnplayablePlayUrlCode(code: number | null | undefined) {
  return typeof code === "number" && UNPLAYABLE_PLAY_URL_CODES.includes(code);
}

/**
 * Android 使用 DASH；其它平台保留渐进式 MP4。清晰度以实际下发的视频流为准。
 */
export function useVideoPlayUrl(
  bvid: string,
  cid: number | undefined,
  qn: VideoQuality,
  format: VideoStreamFormat = "mp4",
  sessionKey = "",
) {
  const search = bvid && cid ? createPlayUrlQuery(bvid, cid, qn, format) : null;

  const {
    data,
    error: playUrlError,
    mutate,
  } = useSWR<Res | z.infer<typeof DashPlayUrlResponseSchema>>(
    search ? [`/x/player/wbi/playurl?${search}`, sessionKey] : null,
    async ([url]) => {
      const response = await request<Res>(url + "&_t=" + Date.now());
      return format === "dash" ? DashPlayUrlResponseSchema.parse(response) : response;
    },
    {
      // DASH 一次取齐可用档位，切清晰度只重选本地清单；地址失效后由播放器显式刷新。
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      errorRetryCount: 2,
      errorRetryInterval: 1000,
      // 权限类错误重试不会变好，只会让受限视频多等两秒
      shouldRetryOnError: (error) => !isUnplayablePlayUrlCode(getApiErrorCode(error)),
    },
  );

  const progressive = data && "durl" in data ? data : undefined;
  const durl = progressive?.durl?.[0];
  const dashSources = createDashPlaySources(data && "dash" in data ? data.dash : undefined, qn);
  const mp4Quality = VIDEO_QUALITIES.find((quality) => quality === data?.quality);
  return {
    urls: format === "dash" ? dashSources.urls : collectPlayUrls(durl?.url, durl?.backup_url),
    quality: format === "dash" ? dashSources.quality : mp4Quality,
    availableQualities:
      format === "dash"
        ? dashSources.availableQualities
        : VIDEO_QUALITIES.filter((quality) => progressive?.accept_quality.includes(quality)),
    contentType: format === "dash" ? ("dash" as const) : ("progressive" as const),
    /** 实际可播时长（毫秒），明显短于视频总时长时说明只拿到了试看片段 */
    servedDurationMs:
      format === "dash" ? (data?.timelength ?? 0) : sumPlayUrlDurationMs(progressive?.durl),
    /**
     * 播放地址请求是否已经有结果（成功或失败）。
     * 没有结果时不能判定「不可播放」，否则请求期间每个视频都会闪一次加载失败。
     */
    hasResult: data !== undefined || Boolean(playUrlError),
    error: playUrlError,
    errorCode: getApiErrorCode(playUrlError),
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
 * 服务端没有返回可下载的渐进式地址（付费内容、接口限制等）。
 */
export class VideoDownloadUnsupportedError extends Error {
  constructor(message = "暂不支持下载该视频") {
    super(message);
    this.name = "VideoDownloadUnsupportedError";
  }
}

function createVideoDownloadUrl(bvid: string, cid: number, quality: VideoQuality) {
  const search = new URLSearchParams();
  // https://socialsisteryi.github.io/bilibili-API-collect/docs/video/videostream_url.html
  const query = {
    bvid,
    cid,
    type: "mp4",
    qn: quality,
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

  return `/x/player/wbi/playurl?${search}`;
}

function collectDownloadQualities(data?: Res) {
  const durl = data?.durl?.[0];
  return data && collectPlayUrls(durl?.url, durl?.backup_url).length
    ? VIDEO_QUALITIES.filter(
        (quality) => quality <= data.quality && data.accept_quality.includes(quality),
      )
    : [];
}

/** 只展示 MP4 下载接口实际提供的档位，DASH 的可播清晰度不代表可直接下载。 */
export function useVideoDownloadQualities(bvid: string, cid?: number, sessionKey = "") {
  const { data, error, isLoading, mutate } = useSWR<Res>(
    bvid && cid ? [createVideoDownloadUrl(bvid, cid, 80), sessionKey] : null,
    ([url]) => request<Res>(url),
    { revalidateOnFocus: false, revalidateOnReconnect: false, errorRetryCount: 0 },
  );
  return {
    qualities: collectDownloadQualities(data),
    isLoading,
    error,
    retry: async () => collectDownloadQualities(await mutate()),
  };
}

/** fnval=0 返回音视频已合并的 MP4；实际档位必须与用户选择一致。 */
export async function getVideoDownloadSource(
  bvid: string,
  cid: number,
  quality: VideoQuality = 64,
): Promise<VideoDownloadSource> {
  if (!bvid || !cid) {
    throw new VideoDownloadUnsupportedError();
  }
  const res = await request<Res>(createVideoDownloadUrl(bvid, cid, quality));
  const durl = res.durl?.[0];
  const urls = collectPlayUrls(durl?.url, durl?.backup_url);
  if (!urls.length || res.quality !== quality) {
    throw new VideoDownloadUnsupportedError();
  }
  return {
    urls,
    quality: res.quality,
    size: durl?.size ?? 0,
  };
}
