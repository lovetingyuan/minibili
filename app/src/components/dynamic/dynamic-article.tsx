import { clsx } from "clsx";
import { Linking, View } from "react-native";

import type { ArticleInlineNode, ArticleParagraph, DynamicArticle } from "@/api/opus-detail.type";
import { theme } from "@/constants/theme";
import { parseUrl } from "@/utils";

import { InlineEmoji } from "../InlineEmoji";
import { Image } from "../styled/expo";
import { Skeleton, Text } from "../styled/rneui";
import UpName from "../UpName";
import { DynamicImageGrid } from "./dynamic-media";

const INLINE_FONT_SIZE = 16;
const EMOJI_SIZE = 20;
const FORMULA_HEIGHT = 20;
const FORMULA_MIN_WIDTH = 24;
const FORMULA_MAX_WIDTH = 180;
const FORMULA_WIDTH_PER_CHAR = 9;

const FORMULA_URL = "https://api.bilibili.com/x/web-frontend/mathjax/tex?formula=";

function ArticleFormula(props: { latex: string }) {
  // mathjax 图片返回原始尺寸，行内无法测量宽度，按公式长度粗略估计
  const width = Math.min(
    FORMULA_MAX_WIDTH,
    Math.max(FORMULA_MIN_WIDTH, props.latex.length * FORMULA_WIDTH_PER_CHAR),
  );
  return (
    <Image
      contentFit="contain"
      source={{ uri: `${FORMULA_URL}${encodeURIComponent(props.latex)}` }}
      style={{ height: FORMULA_HEIGHT, width }}
    />
  );
}

function ArticleInlineNodes(props: { nodes: ArticleInlineNode[] }) {
  return (
    <>
      {props.nodes.map((node, index) => {
        const key = `${index}-${node.kind}`;
        if (node.kind === "emoji") {
          return (
            <InlineEmoji key={key} url={node.url} size={EMOJI_SIZE} fontSize={INLINE_FONT_SIZE} />
          );
        }
        if (node.kind === "formula") {
          return <ArticleFormula key={key} latex={node.latex} />;
        }
        if (node.kind === "link") {
          return (
            <Text
              key={key}
              className={clsx(theme.primary.text, "underline")}
              onPress={() => {
                void Linking.openURL(parseUrl(node.url));
              }}
            >
              {node.text}
            </Text>
          );
        }
        if (node.kind === "at") {
          if (node.mid === null) {
            return (
              <Text key={key} className={theme.primary.text}>
                {node.text}
              </Text>
            );
          }
          return (
            <UpName key={key} mid={node.mid} className={theme.primary.text}>
              {node.text}
            </UpName>
          );
        }
        const className = clsx(
          node.bold && "font-bold",
          node.italic && "italic",
          node.underline && "underline",
          node.strikethrough && "line-through",
        );
        return (
          <Text key={key} className={className || undefined}>
            {node.text}
          </Text>
        );
      })}
    </>
  );
}

function headingClassName(level: number) {
  if (level <= 1) {
    return "mb-3 text-xl font-bold leading-7";
  }
  if (level === 2) {
    return "mb-3 text-lg font-bold leading-7";
  }
  return "mb-3 text-base font-bold leading-6";
}

function ArticleParagraphView(props: { paragraph: ArticleParagraph; selectable?: boolean }) {
  const { paragraph, selectable } = props;
  if (paragraph.kind === "divider") {
    return <View className="mb-3 h-px bg-slate-200 dark:bg-slate-800" />;
  }
  if (paragraph.kind === "images") {
    return <DynamicImageGrid images={paragraph.images} detail natural />;
  }
  if (paragraph.kind === "heading") {
    return (
      <Text selectable={selectable} className={headingClassName(paragraph.level)}>
        <ArticleInlineNodes nodes={paragraph.nodes} />
      </Text>
    );
  }
  return (
    <Text selectable={selectable} className="mb-3 text-base leading-6">
      <ArticleInlineNodes nodes={paragraph.nodes} />
    </Text>
  );
}

export function DynamicArticleContent(props: { article: DynamicArticle; selectable?: boolean }) {
  return (
    <View>
      {props.article.title ? (
        <Text selectable={props.selectable} className="mb-3 text-lg font-semibold leading-7">
          {props.article.title}
        </Text>
      ) : null}
      {props.article.paragraphs.map((paragraph, index) => (
        <ArticleParagraphView key={index} paragraph={paragraph} selectable={props.selectable} />
      ))}
    </View>
  );
}

export function DynamicArticleLoading() {
  return (
    <View className="gap-3">
      <Skeleton animation="wave" width="92%" height={16} />
      <Skeleton animation="wave" width="86%" height={16} />
      <Skeleton animation="wave" width="64%" height={16} />
      <Text className={`text-xs ${theme.text.muted} mb-3`}>正在加载全文</Text>
    </View>
  );
}
