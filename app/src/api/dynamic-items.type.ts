import type { RichTextNode } from "./dynamic-items.schema";

export enum HandledDynamicTypeEnum {
  DYNAMIC_TYPE_AV = "DYNAMIC_TYPE_AV",
  DYNAMIC_TYPE_DRAW = "DYNAMIC_TYPE_DRAW",
  DYNAMIC_TYPE_WORD = "DYNAMIC_TYPE_WORD",
  DYNAMIC_TYPE_ARTICLE = "DYNAMIC_TYPE_ARTICLE",
  DYNAMIC_TYPE_FORWARD = "DYNAMIC_TYPE_FORWARD",
  DYNAMIC_TYPE_MUSIC = "DYNAMIC_TYPE_MUSIC",
  DYNAMIC_TYPE_PGC = "DYNAMIC_TYPE_PGC",
  DYNAMIC_TYPE_LIVE_RCMD = "DYNAMIC_TYPE_LIVE_RCMD",
  DYNAMIC_TYPE_COMMON_SQUARE = "DYNAMIC_TYPE_COMMON_SQUARE",
}

export enum HandledAdditionalTypeEnum {
  ADDITIONAL_TYPE_RESERVE = "ADDITIONAL_TYPE_RESERVE",
  ADDITIONAL_TYPE_UGC = "ADDITIONAL_TYPE_UGC",
  ADDITIONAL_TYPE_COMMON = "ADDITIONAL_TYPE_COMMON",
  ADDITIONAL_TYPE_GOODS = "ADDITIONAL_TYPE_GOODS",
  ADDITIONAL_TYPE_VOTE = "ADDITIONAL_TYPE_VOTE",
  ADDITIONAL_TYPE_MATCH = "ADDITIONAL_TYPE_MATCH",
  ADDITIONAL_TYPE_UPOWER_LOTTERY = "ADDITIONAL_TYPE_UPOWER_LOTTERY",
}

export enum MajorTypeEnum {
  MAJOR_TYPE_ARCHIVE = "MAJOR_TYPE_ARCHIVE",
  MAJOR_TYPE_DRAW = "MAJOR_TYPE_DRAW",
  MAJOR_TYPE_ARTICLE = "MAJOR_TYPE_ARTICLE",
  MAJOR_TYPE_LIVE = "MAJOR_TYPE_LIVE",
  MAJOR_TYPE_WORD = "MAJOR_TYPE_WORD",
  MAJOR_TYPE_NONE = "MAJOR_TYPE_NONE",
  MAJOR_TYPE_MUSIC = "MAJOR_TYPE_MUSIC",
  MAJOR_TYPE_PGC = "MAJOR_TYPE_PGC",
  MAJOR_TYPE_COMMON = "MAJOR_TYPE_COMMON",
  MAJOR_TYPE_MEDIALIST = "MAJOR_TYPE_MEDIALIST",
  MAJOR_TYPE_LIVE_RCMD = "MAJOR_TYPE_LIVE_RCMD",
  MAJOR_TYPE_OPUS = "MAJOR_TYPE_OPUS",
}

export enum HandledRichTextType {
  RICH_TEXT_NODE_TYPE_TEXT = "RICH_TEXT_NODE_TYPE_TEXT",
  RICH_TEXT_NODE_TYPE_AT = "RICH_TEXT_NODE_TYPE_AT",
  RICH_TEXT_NODE_TYPE_WEB = "RICH_TEXT_NODE_TYPE_WEB",
  RICH_TEXT_NODE_TYPE_EMOJI = "RICH_TEXT_NODE_TYPE_EMOJI",
  RICH_TEXT_NODE_TYPE_TOPIC = "RICH_TEXT_NODE_TYPE_TOPIC",
  RICH_TEXT_NODE_TYPE_BV = "RICH_TEXT_NODE_TYPE_BV",
  RICH_TEXT_NODE_TYPE_GOODS = "RICH_TEXT_NODE_TYPE_GOODS",
  RICH_TEXT_NODE_TYPE_MAIL = "RICH_TEXT_NODE_TYPE_MAIL",
  RICH_TEXT_NODE_TYPE_VOTE = "RICH_TEXT_NODE_TYPE_VOTE",
  RICH_TEXT_NODE_TYPE_LOTTERY = "RICH_TEXT_NODE_TYPE_LOTTERY",
  RICH_TEXT_NODE_TYPE_OGV_SEASON = "RICH_TEXT_NODE_TYPE_OGV_SEASON",
  RICH_TEXT_NODE_TYPE_AV = "RICH_TEXT_NODE_TYPE_AV",
  RICH_TEXT_NODE_TYPE_OGV_EP = "RICH_TEXT_NODE_TYPE_OGV_EP",
  RICH_TEXT_NODE_TYPE_CV = "RICH_TEXT_NODE_TYPE_CV",
  RICH_TEXT_NODE_TYPE_VIEW_PICTURE = "RICH_TEXT_NODE_TYPE_VIEW_PICTURE",
}

export type DynamicImage = {
  src: string;
  width: number;
  height: number;
  ratio: number;
};

export type DynamicAuthor = {
  mid: string | number;
  name: string;
  face: string;
};

export type DynamicVideoContent = {
  kind: "video";
  aid: string | number;
  bvid: string;
  cover: string;
  title: string;
  description: string;
  duration: string;
  play: number;
  danmaku: number;
};

export type DynamicContent =
  | { kind: "text" }
  | { kind: "images"; images: DynamicImage[] }
  | DynamicVideoContent
  | {
      kind: "article";
      title: string;
      description: string;
      cover?: string;
      url: string;
      hasMore: boolean;
    }
  | {
      kind: "link";
      title: string;
      description: string;
      cover?: string;
      url?: string;
      label?: string;
    }
  | { kind: "unavailable"; message: string };

export type DynamicAdditional = {
  head: string;
  title: string;
  description: string;
  cover?: string;
  url?: string;
  actionLabel?: string;
};

export type DynamicItem = {
  id: string;
  sourceType: string;
  author: DynamicAuthor;
  date: string;
  time: number;
  pubAction: string;
  top: boolean;
  /** 图文动态（OPUS）的标题，正文里已经包含标题时为空字符串 */
  title: string;
  text: string;
  richTextNodes: RichTextNode[];
  topic: { name: string; jump_url: string } | null;
  content: DynamicContent;
  additional: DynamicAdditional | null;
  commentId: string;
  commentType: number;
  stats: { comment: number; like: number; forward: number; liked?: boolean };
  url: string;
  original: DynamicItem | null;
};
