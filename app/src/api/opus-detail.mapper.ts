import type { DynamicImage } from "./dynamic-items.type";
import type { OpusDetailResponse, OpusParagraph, OpusTextNode } from "./opus-detail.schema";
import type { ArticleInlineNode, ArticleParagraph, DynamicArticle } from "./opus-detail.type";

const OPUS_DETAIL_FEATURES = [
  "onlyfansVote",
  "onlyfansOpusCard",
  "htmlNewStyle",
  "sunflowerStyle",
  "eva3CardOpus",
  "eva3CardVideo",
  "eva3CardComment",
  "eva3CardUser",
  "shareOpusNew",
].join(",");

function normalizeUrl(url: string) {
  const value = url.startsWith("//") ? `https:${url}` : url;
  return value.replace("http://", "https://");
}

function optionalUrl(value: string | null | undefined) {
  return value ? normalizeUrl(value) : undefined;
}

function toImage(value: {
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

function mapTextNode(node: OpusTextNode): ArticleInlineNode | null {
  if (node.type === "TEXT_NODE_TYPE_WORD") {
    const text = node.word?.words;
    if (!text) {
      return null;
    }
    return {
      kind: "text",
      text,
      bold: node.word?.style?.bold === true,
      italic: node.word?.style?.italic === true,
      underline: node.word?.style?.underline === true,
      strikethrough: node.word?.style?.strikethrough === true,
    };
  }
  if (node.type === "TEXT_NODE_TYPE_RICH") {
    const rich = node.rich;
    if (!rich) {
      return null;
    }
    const emojiUrl = optionalUrl(rich.emoji?.icon_url);
    if (emojiUrl) {
      return { kind: "emoji", text: rich.text || rich.emoji?.text || "", url: emojiUrl };
    }
    const text = rich.text;
    if (!text) {
      return null;
    }
    const url = optionalUrl(rich.jump_url);
    if (url) {
      return { kind: "link", text, url };
    }
    if (rich.type === "RICH_TEXT_NODE_TYPE_AT" || rich.type === "RICH_TEXT_NODE_TYPE_USER") {
      return { kind: "at", text, mid: rich.rid ?? null };
    }
    return { kind: "text", text };
  }
  if (node.type === "TEXT_NODE_TYPE_FORMULA") {
    const latex = node.formula?.latex_content;
    return latex ? { kind: "formula", latex } : null;
  }
  if (node.type === "TEXT_NODE_TYPE_USER") {
    const user = node.user;
    if (!user?.name) {
      return null;
    }
    return { kind: "at", text: `@${user.name}`, mid: user.mid ?? null };
  }
  return null;
}

function mapTextNodes(nodes: OpusTextNode[] | undefined) {
  return (nodes ?? []).map(mapTextNode).filter((node): node is ArticleInlineNode => node !== null);
}

function hasText(nodes: ArticleInlineNode[]) {
  return nodes.some((node) =>
    node.kind === "emoji" || node.kind === "formula" ? true : !!node.text,
  );
}

/** 引用、列表、代码等段落没有专门的渲染，能取到文本节点时按普通段落兜底。 */
function fallbackTextParagraphs(paragraph: OpusParagraph): ArticleParagraph[] {
  const candidates: ArticleInlineNode[][] = [];
  for (const child of paragraph.blockquote?.children ?? []) {
    candidates.push(mapTextNodes(child.text?.nodes));
  }
  for (const item of paragraph.list?.items ?? []) {
    candidates.push(mapTextNodes(item.nodes));
  }
  for (const child of paragraph.list?.children ?? []) {
    for (const item of child.children ?? []) {
      candidates.push(mapTextNodes(item.text?.nodes));
    }
  }
  const code = paragraph.code?.text ?? paragraph.code?.content;
  if (code) {
    candidates.push([{ kind: "text", text: code }]);
  }
  return candidates.filter(hasText).map((nodes): ArticleParagraph => ({ kind: "text", nodes }));
}

function mapParagraph(paragraph: OpusParagraph): ArticleParagraph[] {
  if (paragraph.para_type === 1) {
    const nodes = mapTextNodes(paragraph.text?.nodes);
    return hasText(nodes) ? [{ kind: "text", nodes }] : [];
  }
  if (paragraph.para_type === 2) {
    const images = (paragraph.pic?.pics ?? [])
      .map(toImage)
      .filter((image): image is DynamicImage => image !== null);
    return images.length ? [{ kind: "images", images }] : [];
  }
  if (paragraph.para_type === 3) {
    return [{ kind: "divider" }];
  }
  if (paragraph.para_type === 8) {
    const nodes = mapTextNodes(paragraph.heading?.nodes);
    return hasText(nodes)
      ? [{ kind: "heading", level: Math.max(1, paragraph.heading?.level ?? 1), nodes }]
      : [];
  }
  return fallbackTextParagraphs(paragraph);
}

/**
 * 把 opus/detail 的模块结构映射成可渲染的专栏全文。
 * 动态不存在（`item` 为空）或没有正文段落时返回 null，由调用方回退到摘要卡片。
 */
export function mapOpusDetail(response: OpusDetailResponse): DynamicArticle | null {
  const item = response.item;
  if (!item) {
    return null;
  }
  const modules = item.modules ?? [];
  const title = modules
    .find((module) => module.module_type === "MODULE_TYPE_TITLE")
    ?.module_title?.text?.trim();
  const paragraphs = (
    modules.find((module) => module.module_type === "MODULE_TYPE_CONTENT")?.module_content
      ?.paragraphs ?? []
  ).flatMap(mapParagraph);
  if (!paragraphs.length) {
    return null;
  }
  return {
    id: String(item.id_str),
    title: title ?? "",
    paragraphs,
  };
}

export function buildOpusDetailUrl(id: string) {
  return (
    "/x/polymer/web-dynamic/v1/opus/detail?" +
    new URLSearchParams({
      id,
      platform: "h5",
      timezone_offset: "-480",
      features: OPUS_DETAIL_FEATURES,
    }).toString()
  );
}
