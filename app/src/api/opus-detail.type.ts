import type { DynamicImage } from "./dynamic-items.type";

/**
 * 专栏正文里的行内节点，来源为接口的 TEXT_NODE_TYPE_WORD/RICH/FORMULA/USER。
 */
export type ArticleInlineNode =
  | {
      kind: "text";
      text: string;
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      strikethrough?: boolean;
    }
  | { kind: "link"; text: string; url: string }
  | { kind: "emoji"; text: string; url: string }
  | { kind: "at"; text: string; mid: string | number | null }
  | { kind: "formula"; latex: string };

export type ArticleParagraph =
  | { kind: "text"; nodes: ArticleInlineNode[] }
  | { kind: "heading"; level: number; nodes: ArticleInlineNode[] }
  | { kind: "images"; images: DynamicImage[] }
  | { kind: "divider" };

export type DynamicArticle = {
  id: string;
  title: string;
  paragraphs: ArticleParagraph[];
};
