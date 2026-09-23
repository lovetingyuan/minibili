import { OriginalDynamicItemSchema } from "./dynamic-items.schema";
import type {
  DynamicItemResponse,
  DynamicListResponse,
  OriginalDynamicItemResponse,
} from "./dynamic-items.schema";
import { HandledAdditionalTypeEnum, MajorTypeEnum } from "./dynamic-items.type";
import type {
  DynamicAdditional,
  DynamicContent,
  DynamicImage,
  DynamicItem,
} from "./dynamic-items.type";

function normalizeUrl(url: string) {
  const value = url.startsWith("//") ? `https:${url}` : url;
  return value.replace("http://", "https://");
}
const DYNAMIC_FEATURES = [
  "itemOpusStyle",
  "listOnlyfans",
  "opusBigCover",
  "onlyfansVote",
  "forwardListHidden",
  "decorationCard",
  "commentsNewVersion",
  "onlyfansAssetsV2",
  "ugcDelete",
  "onlyfansQaCard",
].join(",");

type RawDynamicItem = DynamicItemResponse | OriginalDynamicItemResponse;

function toNumber(value: string | number | null | undefined) {
  if (typeof value === "string" && value.endsWith("万")) {
    const count = Number.parseFloat(value.slice(0, -1));
    return Number.isFinite(count) ? Math.round(count * 10000) : 0;
  }
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
}

function normalizeText(value: string | null | undefined) {
  const text = value?.trim();
  return text && text !== "-" ? text : "";
}

function optionalUrl(value: string | null | undefined) {
  return value ? normalizeUrl(value) : undefined;
}

/** 失效的被转发动态会返回 `id_str: null`，这里统一按空 id 处理 */
function getDynamicId(item: RawDynamicItem) {
  return item.id_str == null ? "" : String(item.id_str);
}

/** 详情页地址；没有 id 时（已失效的原动态）不编造链接 */
function getDynamicUrl(item: RawDynamicItem, id: string) {
  const jumpUrl = optionalUrl(item.basic.jump_url);
  if (jumpUrl) {
    return jumpUrl;
  }
  return id ? `https://www.bilibili.com/opus/${id}` : "";
}

function normalizeImage(value: {
  url?: string;
  src?: string;
  width?: number;
  height?: number;
}): DynamicImage | null {
  const src = optionalUrl(value.url || value.src);
  if (!src) {
    return null;
  }
  const width = Math.max(1, value.width ?? 1);
  const height = Math.max(1, value.height ?? 1);
  return { src, width, height, ratio: width / height };
}

function normalizeImages(
  values: { url?: string; src?: string; width?: number; height?: number }[],
) {
  return values.map(normalizeImage).filter((image): image is DynamicImage => image !== null);
}

function normalizeAdditional(item: RawDynamicItem): DynamicAdditional | null {
  const additional = item.modules.module_dynamic.additional;
  if (!additional) {
    return null;
  }

  if (additional.type === HandledAdditionalTypeEnum.ADDITIONAL_TYPE_RESERVE) {
    const reserve = additional.reserve;
    return reserve
      ? {
          head: "预约",
          title: reserve.title ?? "预约活动",
          description: [normalizeText(reserve.desc1?.text), normalizeText(reserve.desc2?.text)]
            .filter(Boolean)
            .join(" · "),
          url: optionalUrl(reserve.button?.jump_url || reserve.jump_url),
          actionLabel: reserve.button?.text,
        }
      : null;
  }
  if (additional.type === HandledAdditionalTypeEnum.ADDITIONAL_TYPE_UGC) {
    const ugc = additional.ugc;
    return ugc
      ? {
          head: "视频",
          title: ugc.title ?? "关联视频",
          description: normalizeText(ugc.desc_second),
          cover: optionalUrl(ugc.cover),
          url: optionalUrl(ugc.jump_url),
        }
      : null;
  }
  if (additional.type === HandledAdditionalTypeEnum.ADDITIONAL_TYPE_COMMON) {
    const common = additional.common;
    return common
      ? {
          head: common.head_text ?? "相关内容",
          title: common.title ?? "相关内容",
          description: [normalizeText(common.desc1), normalizeText(common.desc2)]
            .filter(Boolean)
            .join(" · "),
          cover: optionalUrl(common.cover),
          url: optionalUrl(common.button?.jump_url || common.jump_url),
          actionLabel: common.button?.text,
        }
      : null;
  }
  if (additional.type === HandledAdditionalTypeEnum.ADDITIONAL_TYPE_GOODS) {
    const goods = additional.goods;
    const first = goods?.items?.[0];
    return goods
      ? {
          head: goods.head_text ?? "商品",
          title: first?.name ?? "相关商品",
          description: [normalizeText(first?.brief), normalizeText(first?.price)]
            .filter(Boolean)
            .join(" · "),
          cover: optionalUrl(first?.cover),
          url: optionalUrl(first?.jump_url || goods.jump_url),
        }
      : null;
  }
  if (additional.type === HandledAdditionalTypeEnum.ADDITIONAL_TYPE_VOTE) {
    const vote = additional.vote;
    return vote
      ? {
          head: "投票",
          title: vote.desc ?? "参与投票",
          description: vote.join_num ? `${vote.join_num} 人参与` : "",
        }
      : null;
  }
  if (additional.type === HandledAdditionalTypeEnum.ADDITIONAL_TYPE_UPOWER_LOTTERY) {
    const lottery = additional.upower_lottery;
    const description = typeof lottery?.desc === "string" ? lottery.desc : lottery?.desc?.text;
    return lottery
      ? {
          head: "抽奖",
          title: lottery.title ?? "抽奖活动",
          description: normalizeText(description),
          url: optionalUrl(
            lottery.jump_url ||
              (typeof lottery.desc === "object" ? lottery.desc?.jump_url : undefined),
          ),
        }
      : null;
  }
  return {
    head: "相关内容",
    title: "查看动态中的附加内容",
    description: "",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeLiveRecommendation(content: string | undefined): DynamicContent | null {
  if (!content) {
    return null;
  }
  try {
    const value: unknown = JSON.parse(content);
    if (!isRecord(value) || !isRecord(value.live_play_info)) {
      return null;
    }
    const info = value.live_play_info;
    const title = typeof info.title === "string" ? info.title : "直播间";
    const area = typeof info.area_name === "string" ? info.area_name : "";
    const live = info.live_status === 1 ? "正在直播" : "直播结束";
    return {
      kind: "link",
      title,
      description: [area, live].filter(Boolean).join(" · "),
      cover: typeof info.cover === "string" ? optionalUrl(info.cover) : undefined,
      url: typeof info.link === "string" ? optionalUrl(info.link) : undefined,
      label: "直播",
    };
  } catch {
    return null;
  }
}

function normalizeContent(item: RawDynamicItem): DynamicContent {
  const major = item.modules.module_dynamic.major;
  if (!major) {
    return { kind: "text" };
  }
  if (major.type === MajorTypeEnum.MAJOR_TYPE_ARCHIVE && major.archive) {
    const archive = major.archive;
    return {
      kind: "video",
      aid: archive.aid ?? item.basic.rid_str ?? "",
      bvid: archive.bvid ?? "",
      cover: optionalUrl(archive.cover) ?? "",
      title: archive.title ?? "视频",
      description: normalizeText(archive.desc),
      duration: archive.duration_text ?? "",
      play: toNumber(archive.stat?.play),
      danmaku: toNumber(archive.stat?.danmaku),
    };
  }
  if (major.type === MajorTypeEnum.MAJOR_TYPE_OPUS && major.opus) {
    const images = normalizeImages(major.opus.pics);
    if (item.type === "DYNAMIC_TYPE_ARTICLE") {
      return {
        kind: "article",
        title: major.opus.title ?? "专栏",
        description: normalizeText(major.opus.summary.text),
        cover: images[0]?.src,
        url: optionalUrl(major.opus.jump_url) ?? getDynamicUrl(item, getDynamicId(item)),
        hasMore: major.opus.summary.has_more === true,
      };
    }
    return images.length ? { kind: "images", images } : { kind: "text" };
  }
  if (major.type === MajorTypeEnum.MAJOR_TYPE_DRAW && major.draw) {
    return { kind: "images", images: normalizeImages(major.draw.items) };
  }
  if (major.type === MajorTypeEnum.MAJOR_TYPE_ARTICLE && major.article) {
    return {
      kind: "article",
      title: major.article.title ?? "专栏",
      description: normalizeText(major.article.desc),
      cover: optionalUrl(major.article.covers?.[0]),
      url: optionalUrl(major.article.jump_url) ?? getDynamicUrl(item, getDynamicId(item)),
      hasMore: true,
    };
  }
  if (major.type === MajorTypeEnum.MAJOR_TYPE_COMMON && major.common) {
    const common = major.common;
    return {
      kind: "link",
      title: common.title ?? "相关内容",
      description: normalizeText(common.desc),
      cover: optionalUrl(common.cover),
      url: optionalUrl(common.jump_url),
      label: common.badge?.text || common.label,
    };
  }
  if (major.type === MajorTypeEnum.MAJOR_TYPE_PGC && major.pgc) {
    return {
      kind: "link",
      title: major.pgc.title ?? "番剧",
      description: major.pgc.stat?.play ? `${major.pgc.stat.play} 播放` : "",
      cover: optionalUrl(major.pgc.cover),
      url: optionalUrl(major.pgc.jump_url),
      label: major.pgc.badge?.text,
    };
  }
  if (major.type === MajorTypeEnum.MAJOR_TYPE_MUSIC && major.music) {
    return {
      kind: "link",
      title: major.music.title ?? "音乐",
      description: normalizeText(major.music.label),
      cover: optionalUrl(major.music.cover),
      url: optionalUrl(major.music.jump_url),
      label: "音乐",
    };
  }
  if (major.type === MajorTypeEnum.MAJOR_TYPE_LIVE && major.live) {
    return {
      kind: "link",
      title: major.live.title ?? "直播",
      description: [normalizeText(major.live.desc_first), normalizeText(major.live.desc_second)]
        .filter(Boolean)
        .join(" · "),
      cover: optionalUrl(major.live.cover),
      url: optionalUrl(major.live.jump_url),
      label: major.live.badge?.text || "直播",
    };
  }
  if (major.type === MajorTypeEnum.MAJOR_TYPE_LIVE_RCMD) {
    return (
      normalizeLiveRecommendation(major.live_rcmd?.content) ?? {
        kind: "unavailable",
        message: "直播信息暂不可用",
      }
    );
  }
  if (major.type === MajorTypeEnum.MAJOR_TYPE_NONE) {
    return { kind: "unavailable", message: major.none?.tips ?? "原动态已失效" };
  }
  return { kind: "unavailable", message: "暂不支持显示此类动态" };
}

/**
 * 图文动态（OPUS）的标题和正文是两个独立字段，接口返回的正文不包含标题。
 * 专栏的标题由专栏卡片自己渲染，这里不重复取；正文已经以标题开头时也不重复渲染。
 */
function normalizeTitle(item: RawDynamicItem, text: string) {
  const major = item.modules.module_dynamic.major;
  if (major?.type !== MajorTypeEnum.MAJOR_TYPE_OPUS || !major.opus) {
    return "";
  }
  if (item.type === "DYNAMIC_TYPE_ARTICLE") {
    return "";
  }
  const title = normalizeText(major.opus.title);
  return title && !text.startsWith(title) ? title : "";
}

export function mapDynamicItem(item: RawDynamicItem): DynamicItem {
  const author = item.modules.module_author;
  const dynamic = item.modules.module_dynamic;
  const opus = dynamic.major?.opus;
  const desc = dynamic.desc;
  const summary = desc?.text ? desc : opus?.summary;
  const id = getDynamicId(item);
  const text = normalizeText(summary?.text);
  const original = OriginalDynamicItemSchema.safeParse("orig" in item ? item.orig : undefined);
  return {
    id,
    sourceType: item.type,
    author: { mid: author.mid, name: author.name, face: optionalUrl(author.face) ?? "" },
    date: author.pub_time,
    time: toNumber(author.pub_ts),
    pubAction: author.pub_action,
    top: item.modules.module_tag?.text === "置顶",
    title: normalizeTitle(item, text),
    text,
    richTextNodes: summary?.rich_text_nodes ?? [],
    topic: dynamic.topic
      ? { name: dynamic.topic.name, jump_url: optionalUrl(dynamic.topic.jump_url) ?? "" }
      : null,
    content: normalizeContent(item),
    additional: normalizeAdditional(item),
    commentId: String(item.basic.comment_id_str),
    commentType: item.basic.comment_type,
    stats: {
      comment: toNumber(item.modules.module_stat?.comment.count),
      like: toNumber(item.modules.module_stat?.like.count),
      forward: toNumber(item.modules.module_stat?.forward.count),
      liked: item.modules.module_stat?.like.status === true,
    },
    url: getDynamicUrl(item, id),
    original: original.success ? mapDynamicItem(original.data) : null,
  };
}

export function buildDynamicListUrl(mid: string | number, offset = "") {
  return (
    "/x/polymer/web-dynamic/v1/feed/space?" +
    new URLSearchParams({
      offset,
      host_mid: String(mid),
      timezone_offset: "-480",
      platform: "web",
      features: DYNAMIC_FEATURES,
    }).toString()
  );
}

export function getDynamicPageKey(
  mid: string | number | undefined,
  pageIndex: number,
  previousPage?: DynamicListResponse,
) {
  if (!mid || (previousPage && (!previousPage.has_more || !previousPage.items.length))) {
    return null;
  }
  return buildDynamicListUrl(mid, pageIndex ? (previousPage?.offset ?? "") : "");
}
