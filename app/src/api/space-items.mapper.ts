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

export function mapSpaceOpusItem(item: SpaceOpusItemResponse, owner: SpaceOwner): DynamicItem {
  const id = String(item.opus_id);
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
    date: item.pub_time,
    time: 0,
    pubAction: "发布了图文",
    top: false,
    title: "",
    text: item.content.trim(),
    richTextNodes: [],
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
