import useSWR from "swr";

import { buildOpusDetailUrl, mapOpusDetail } from "./opus-detail.mapper";
import { OpusDetailResponseSchema } from "./opus-detail.schema";
import type { DynamicArticle } from "./opus-detail.type";
import request from "./fetcher";

async function fetchOpusDetail(url: string) {
  const response = await request<unknown>(url);
  return mapOpusDetail(OpusDetailResponseSchema.parse(response));
}

/**
 * 专栏文章的完整正文。`opusId` 为空时不发请求。
 * 接口失败或没有正文时 `data` 为 null，调用方回退到摘要卡片。
 */
export function useOpusDetail(opusId?: string | null) {
  const url = opusId ? buildOpusDetailUrl(opusId) : null;
  return useSWR<DynamicArticle | null, Error>(url, fetchOpusDetail, {
    shouldRetryOnError: false,
  });
}
