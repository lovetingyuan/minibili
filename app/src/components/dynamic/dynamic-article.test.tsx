import React from "react";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";

import type { DynamicArticle } from "@/api/opus-detail.type";

const mocks = vi.hoisted(() => ({ openURL: vi.fn() }));

vi.mock("react-native", () => ({
  Linking: { openURL: mocks.openURL },
  View: "View",
}));
vi.mock("@/constants/theme", () => import("../../constants/theme"));
vi.mock("@/utils", () => ({
  parseUrl: (url: string) => url,
}));
vi.mock("../InlineEmoji", () => ({ InlineEmoji: "InlineEmoji" }));
vi.mock("../UpName", () => ({ default: "UpName" }));
vi.mock("../styled/expo", () => ({ Image: "Image" }));
vi.mock("../styled/rneui", () => ({ Skeleton: "Skeleton", Text: "Text" }));
vi.mock("./dynamic-media", () => ({ DynamicImageGrid: "DynamicImageGrid" }));

import { DynamicArticleContent, DynamicArticleLoading } from "./dynamic-article";

type TestElement = ReactElement<Record<string, unknown>>;

function flatten(node: ReactNode): TestElement[] {
  const elements: TestElement[] = [];
  React.Children.forEach(node, (child) => {
    if (!React.isValidElement<Record<string, unknown>>(child)) {
      return;
    }
    if (typeof child.type === "function") {
      const Component = child.type as (props: Record<string, unknown>) => ReactNode;
      elements.push(...flatten(Component(child.props)));
      return;
    }
    elements.push(child);
    elements.push(...flatten(child.props.children as ReactNode));
  });
  return elements;
}

/** 行内节点被包在函数组件里，外层 Text 需要向前找最近的“子节点是元素”的 Text。 */
function findTextWrapper(elements: TestElement[], index: number) {
  for (let i = index - 1; i >= 0; i -= 1) {
    const element = elements[i];
    if (element.type === "Text" && React.isValidElement(element.props.children)) {
      return element;
    }
  }
  return undefined;
}

const article: DynamicArticle = {
  id: "1250152752385884176",
  title: "韩国国歌变成朝鲜国歌，日本降本增笑太魔幻了！",
  paragraphs: [
    { kind: "text", nodes: [{ kind: "text", text: "地球知识局", bold: true }] },
    { kind: "heading", level: 1, nodes: [{ kind: "text", text: "住宿or荒野求生？" }] },
    {
      kind: "text",
      nodes: [
        { kind: "text", text: "见" },
        { kind: "link", text: "原文", url: "https://www.bilibili.com/read/cv1" },
        { kind: "emoji", text: "[笑]", url: "https://i0.hdslb.com/emoji.png" },
        { kind: "at", text: "@某人", mid: 42 },
      ],
    },
    { kind: "images", images: [{ src: "a.jpg", width: 1270, height: 591, ratio: 1270 / 591 }] },
    { kind: "divider" },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

test("renders the article title and text paragraphs", () => {
  const elements = flatten(DynamicArticleContent({ article }));
  const title = elements.find(
    (element) => element.type === "Text" && element.props.children === article.title,
  );
  const bold = elements.find(
    (element) => element.type === "Text" && element.props.children === "地球知识局",
  );

  expect(title?.props.className).toContain("font-semibold");
  expect(bold?.props.className).toContain("font-bold");
});

test("renders headings with a larger bold style and dividers as a line", () => {
  const elements = flatten(DynamicArticleContent({ article }));
  const headingIndex = elements.findIndex(
    (element) => element.type === "Text" && element.props.children === "住宿or荒野求生？",
  );
  const heading = findTextWrapper(elements, headingIndex);
  const divider = elements.find(
    (element) => element.type === "View" && String(element.props.className).includes("h-px"),
  );

  expect(headingIndex).toBeGreaterThan(0);
  expect(heading?.type).toBe("Text");
  expect(String(heading?.props.className)).toContain("font-bold");
  expect(String(heading?.props.className)).toContain("text-xl");
  expect(divider).toBeDefined();
});

test("opens links and renders mentions and emoji inline", () => {
  const elements = flatten(DynamicArticleContent({ article }));
  const link = elements.find((element) => element.props.children === "原文");
  const mention = elements.find((element) => element.type === "UpName");
  const emoji = elements.find((element) => element.type === "InlineEmoji");

  expect(emoji?.props.url).toBe("https://i0.hdslb.com/emoji.png");
  expect(mention?.props.mid).toBe(42);

  if (!link) {
    throw new Error("Missing link node");
  }
  (link.props.onPress as () => void)();
  expect(mocks.openURL).toHaveBeenCalledWith("https://www.bilibili.com/read/cv1");
});

test("renders picture paragraphs through the shared image grid", () => {
  const elements = flatten(DynamicArticleContent({ article }));
  const grid = elements.find((element) => element.type === "DynamicImageGrid");
  const images = article.paragraphs.flatMap((paragraph) =>
    paragraph.kind === "images" ? paragraph.images : [],
  );

  expect(grid?.props.images).toEqual(images);
  expect(grid?.props.detail).toBe(true);
  expect(grid?.props.natural).toBe(true);
});

test("shows a loading placeholder for the folded article body", () => {
  const elements = flatten(DynamicArticleLoading());

  expect(elements.filter((element) => element.type === "Skeleton")).toHaveLength(3);
  expect(elements.some((element) => element.props.children === "正在加载全文")).toBe(true);
});
