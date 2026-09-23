import type { RichTextNode } from "./dynamic-items.schema";
import { HandledRichTextType } from "./dynamic-items.type";
import type { DynamicItem } from "./dynamic-items.type";
import type {
  SpaceOpusItemResponse,
  SpaceOpusPage,
  SpaceVideoItemResponse,
  SpaceVideoPage,
} from "./space-items.schema";
import type { SpaceOwner } from "./space-items.types";

export const SPACE_VIDEO_PAGE_SIZE = 40;

export function buildSpaceContentCountsUrl(mid: string | number) {
  return `/x/space/navnum?mid=${encodeURIComponent(String(mid))}`;
}

function parseUrl(url: string) {
  const normalizedUrl = url.startsWith("//") ? `https:${url}` : url;
  return normalizedUrl.startsWith("http://")
    ? `https://${normalizedUrl.slice("http://".length)}`
    : normalizedUrl;
}

export function dedupeSpaceItems(items: DynamicItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

function toNumber(value: string | number | null | undefined) {
  if (typeof value === "string" && value.endsWith("万")) {
    const count = Number.parseFloat(value.slice(0, -1));
    return Number.isFinite(count) ? Math.round(count * 10000) : 0;
  }
  const count = Number(value ?? 0);
  return Number.isFinite(count) ? count : 0;
}

function sameMid(left: string | number, right: string | number) {
  return String(left) === String(right);
}

export function buildSpaceVideoUrl(mid: string | number, page: number) {
  return (
    "/x/space/wbi/arc/search?" +
    new URLSearchParams({
      pn: String(page),
      ps: String(SPACE_VIDEO_PAGE_SIZE),
      tid: "0",
      special_type: "",
      order: "pubdate",
      mid: String(mid),
      index: "0",
      keyword: "",
      order_avoided: "true",
      platform: "web",
    }).toString()
  );
}

export function getSpaceVideoPageKey(
  mid: string | number | undefined,
  pageIndex: number,
  previousPage?: SpaceVideoPage,
) {
  if (!mid || (previousPage && previousPage.list.vlist.length < SPACE_VIDEO_PAGE_SIZE)) {
    return null;
  }
  return buildSpaceVideoUrl(mid, pageIndex + 1);
}

export function mapSpaceVideoItem(item: SpaceVideoItemResponse, owner: SpaceOwner): DynamicItem {
  const id = String(item.aid);
  const authorIsOwner = sameMid(item.mid, owner.mid);
  return {
    id,
    sourceType: "DYNAMIC_TYPE_AV",
    author: {
      mid: item.mid,
      name: item.author || (authorIsOwner ? owner.name : ""),
      face: authorIsOwner ? owner.face : "",
    },
    date: "",
    time: toNumber(item.created),
    pubAction: authorIsOwner ? "投稿了视频" : "合作投稿",
    top: false,
    title: "",
    text: "",
    richTextNodes: [],
    topic: null,
    content: {
      kind: "video",
      aid: item.aid,
      bvid: item.bvid,
      cover: parseUrl(item.pic),
      title: item.title,
      description: item.description,
      duration: item.length,
      play: toNumber(item.play),
      danmaku: toNumber(item.video_review),
    },
    additional: null,
    commentId: id,
    commentType: 1,
    stats: {
      comment: toNumber(item.comment),
      like: 0,
      forward: 0,
    },
    url: `https://www.bilibili.com/video/${encodeURIComponent(item.bvid)}`,
    original: null,
  };
}

export function buildSpaceOpusUrl(mid: string | number, page: number, offset = "") {
  return (
    "/x/polymer/web-dynamic/v1/opus/feed/space?" +
    new URLSearchParams({
      host_mid: String(mid),
      page: String(page),
      offset,
      type: "all",
    }).toString()
  );
}

export function getSpaceOpusPageKey(
  mid: string | number | undefined,
  pageIndex: number,
  previousPage?: SpaceOpusPage,
) {
  if (!mid || (previousPage && (!previousPage.has_more || !previousPage.items.length))) {
    return null;
  }
  return buildSpaceOpusUrl(mid, pageIndex + 1, pageIndex ? (previousPage?.offset ?? "") : "");
}

/** opus_id 雪花 ID 的起始时间：2017-07-01 00:00 (+08:00)，单位秒。 */
const OPUS_ID_EPOCH_SECONDS = 1498838400;

/**
 * 图文接口 (/x/polymer/web-dynamic/v1/opus/feed/space) 的 pub_time 恒为空字符串，
 * 只能从 opus_id 的高 32 位反推发布时间。
 */
export function parseOpusPubTs(opusId: string | number) {
  const value = String(opusId);
  if (!/^\d+$/.test(value)) {
    return 0;
  }
  // 高 32 位为 0 说明这不是真实 opus_id（真实 id 都是 19 位），宁可不显示时间。
  const seconds = BigInt(value) >> 32n;
  return seconds > 0n ? Number(seconds) + OPUS_ID_EPOCH_SECONDS : 0;
}

/** 正文里的表情是 `[名字]`，名字最长不会超过这个长度，用来避免把普通方括号文本吃进去。 */
const EMOJI_TOKEN_PATTERN = /(\[[^[\]]{1,40}\])/g;

/**
 * 图文接口 (`/x/polymer/web-dynamic/v1/opus/feed/space`) 只返回纯文本正文，
 * 表情混在文字里是 `[大哭]` 这样的标签，图片地址只能靠表情包的名字映射补齐。
 * 映射里没有的标签（UP 主专属、收藏集表情）保持原样，交给渲染层按普通文本显示。
 */
export function splitEmoteRichTextNodes(
  text: string,
  emoteMap?: Map<string, string>,
): RichTextNode[] {
  const nodes: RichTextNode[] = [];
  // 连续的普通文字合并回一个节点，没有表情时结果与原来的纯文本一致。
  let pending = "";

  function flushPending() {
    if (!pending) {
      return;
    }
    nodes.push({ type: HandledRichTextType.RICH_TEXT_NODE_TYPE_TEXT, text: pending });
    pending = "";
  }

  for (const part of text.split(EMOJI_TOKEN_PATTERN)) {
    const iconUrl = part ? emoteMap?.get(part) : undefined;
    if (iconUrl) {
      flushPending();
      nodes.push({
        type: HandledRichTextType.RICH_TEXT_NODE_TYPE_EMOJI,
        text: part,
        orig_text: part,
        emoji: { icon_url: iconUrl, text: part },
      });
      continue;
    }
    pending += part;
  }
  flushPending();
  return nodes;
}

/** 与 parseDate 的日期部分一致，但只到「日」，跨年时才补年份。 */
function formatOpusDate(timestamp: number) {
  if (!timestamp) {
    return "";
  }
  const date = new Date(timestamp * 1000);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const year = date.getFullYear();
  return year === new Date().getFullYear() ? `${month}-${day}` : `${year}-${month}-${day}`;
}

export function mapSpaceOpusItem(
  item: SpaceOpusItemResponse,
  owner: SpaceOwner,
  emoteMap?: Map<string, string>,
): DynamicItem {
  const id = String(item.opus_id);
  const pubTs = parseOpusPubTs(item.opus_id);
  const text = item.content.trim();
  const cover = item.cover
    ? {
        src: parseUrl(item.cover.url),
        width: Math.max(1, item.cover.width),
        height: Math.max(1, item.cover.height),
        ratio: Math.max(1, item.cover.width) / Math.max(1, item.cover.height),
      }
    : null;
  return {
    id,
    sourceType: cover ? "DYNAMIC_TYPE_DRAW" : "DYNAMIC_TYPE_WORD",
    author: owner,
    // 图文接口的 pub_time 恒为空，发布时间只能从 opus_id 推算，且只显示到「日」。
    date: formatOpusDate(pubTs),
    time: pubTs,
    pubAction: "发布了图文",
    top: false,
    title: "",
    text,
    richTextNodes: splitEmoteRichTextNodes(text, emoteMap),
    topic: null,
    content: cover ? { kind: "images", images: [cover] } : { kind: "text" },
    additional: null,
    commentId: id,
    commentType: cover ? 11 : 17,
    stats: {
      comment: 0,
      like: toNumber(item.stat.like),
      forward: 0,
    },
    url: item.jump_url ? parseUrl(item.jump_url) : `https://www.bilibili.com/opus/${id}`,
    original: null,
  };
}
