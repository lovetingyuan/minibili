import useSWR from "swr";

import request from "./fetcher";
import { PlayResumeInfoSchema } from "./play-resume.schema";
import type { PlayResumeInfo } from "./play-resume.types";

/** 播放不足这么多毫秒不续播，避免刚打开就退出留下一次没意义的跳转 */
export const PLAY_RESUME_MIN_MS = 5000;

/** 播放位置查询的 SWR key，缺少 aid/cid 时返回 null（不发请求） */
export function getPlayResumeKey(aid: string | number | undefined, cid: number) {
  const id = typeof aid === "number" ? String(aid) : (aid ?? "").trim();
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(cid) || cid <= 0) {
    return null;
  }
  return `/x/player/wbi/v2?aid=${id}&cid=${cid}`;
}

/**
 * 续播位置（毫秒）。B站把最后播放位置存在服务端：
 * `last_play_cid` 不是当前分P（比如上次看的是别的分P），或者
 * `last_play_time <= 0`（看完后返回 -1000）时都从头播放。
 */
export function resolvePlayResumePositionMs(info: PlayResumeInfo | null | undefined, cid: number) {
  if (!info || info.last_play_cid !== cid) {
    return 0;
  }
  const positionMs = info.last_play_time;
  if (typeof positionMs !== "number" || !Number.isFinite(positionMs)) {
    return 0;
  }
  if (positionMs < PLAY_RESUME_MIN_MS) {
    return 0;
  }
  return Math.round(positionMs);
}

async function fetchPlayResumeInfo(url: string) {
  return PlayResumeInfoSchema.parse(await request(url));
}

/**
 * 进入播放页时取一次 B站记录的最后播放位置，播放器就绪后跳过去。
 * 请求失败、还没加载完（含缓存里的旧值）都返回 0，即从头播放。
 */
export function usePlayResumePosition(aid: string | number | undefined, cid: number) {
  const key = getPlayResumeKey(aid, cid);
  const { data, isValidating } = useSWR<PlayResumeInfo>(key, fetchPlayResumeInfo, {
    // 每次打开播放页都要拿最新位置，不能复用缓存，也不要在页面内重复请求
    dedupingInterval: 0,
    keepPreviousData: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
  if (!key || isValidating) {
    return 0;
  }
  return resolvePlayResumePositionMs(data, cid);
}
