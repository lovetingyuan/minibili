import useSWRImmutable from "swr/immutable";

import { EmotePackagesResponseSchema } from "./emotes.schema";
import type { EmotePackagesResponse } from "./emotes.schema";
import request from "./fetcher";

/**
 * 动态、图文正文里的表情在接口里是 `[名字]` 这样的纯文本，只有拿到「名字 → 图片」的映射才能渲染成图片。
 * 这里取 B 站默认表情包（小黄脸、小电视、颜文字等），覆盖绝大多数正文表情；
 * UP 主专属、收藏集表情包有几千个，只能等接口直接给出图片地址时才渲染。
 */
/** 默认表情包就是 1~25 号，其中缺失的 id 传上去也不会报错。 */
const DEFAULT_EMOTE_PACKAGE_ID_MAX = 25;

export function buildEmotePackagesUrl() {
  const ids = Array.from({ length: DEFAULT_EMOTE_PACKAGE_ID_MAX }, (_, index) => index + 1);
  return `/x/emote/package?business=dynamic&ids=${ids.join(",")}`;
}

function normalizeUrl(url: string) {
  const value = url.startsWith("//") ? `https:${url}` : url;
  return value.replace("http://", "https://");
}

/** 同一个表情可能出现在多个包里，先到先得，空字段直接跳过。 */
export function mapEmotePackages(response: EmotePackagesResponse) {
  const emotes = new Map<string, string>();
  for (const pack of response.packages ?? []) {
    for (const emote of pack.emote) {
      if (emote.text && emote.url && !emotes.has(emote.text)) {
        emotes.set(emote.text, normalizeUrl(emote.url));
      }
    }
  }
  return emotes;
}

async function fetchEmotePackages(url: string) {
  const response = await request<unknown>(url);
  return mapEmotePackages(EmotePackagesResponseSchema.parse(response));
}

/**
 * 表情包长期不变，`useSWRImmutable` 保证整个进程只请求一次。
 * 请求失败返回 undefined，调用方按纯文本兜底。
 */
export function useEmoteMap() {
  const { data } = useSWRImmutable(buildEmotePackagesUrl(), fetchEmotePackages, {
    shouldRetryOnError: false,
  });
  return data;
}
