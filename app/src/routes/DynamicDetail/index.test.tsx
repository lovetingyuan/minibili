import React from "react";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { DynamicItem } from "@/api/dynamic-items.type";
import type { DynamicArticle } from "@/api/opus-detail.type";

const mocks = vi.hoisted(() => ({
  articleId: null as string | null,
  article: {
    data: null as DynamicArticle | null | undefined,
    isLoading: false,
    mutate: vi.fn(),
  },
  detail: {
    data: undefined as DynamicItem | undefined,
    error: undefined as Error | undefined,
    isLoading: false,
    isValidating: false,
    mutate: vi.fn(),
  },
}));

vi.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ setOptions: vi.fn() }),
}));
vi.mock("react-native", () => ({
  ActivityIndicator: "ActivityIndicator",
  RefreshControl: "RefreshControl",
  ScrollView: "ScrollView",
  View: "View",
}));
vi.mock("@/api/dynamic-items", () => ({ useDynamicDetail: () => mocks.detail }));
vi.mock("@/api/opus-detail", () => ({
  useOpusDetail: (opusId: string | null) => {
    mocks.articleId = opusId;
    return mocks.article;
  },
}));
vi.mock("@/components/Comment", () => ({ default: "CommentList" }));
vi.mock("@/components/dynamic/dynamic-card", () => ({ DynamicCard: "DynamicCard" }));
vi.mock("@/components/styled/rneui", () => ({ Button: "Button", Text: "Text" }));
vi.mock("@/components/UpName", () => ({ default: "UpName" }));
vi.mock("@/constants/theme", () => import("../../constants/theme"));
vi.mock("@/hooks/useUpdateNavigationOptions", () => ({ default: vi.fn() }));
vi.mock("./HeaderRight", () => ({ default: "HeaderRight" }));

import DynamicDetailPage from "./index";

const detailItem = {
  id: "1250152752385884176",
  sourceType: "DYNAMIC_TYPE_ARTICLE",
  author: { mid: "100785033", name: "地球知识局", face: "" },
  date: "2026年09月20日 21:51",
  time: 1789912270,
  pubAction: "投稿了文章",
  top: false,
  title: "",
  text: "折叠摘要",
  richTextNodes: [],
  topic: null,
  content: {
    kind: "article",
    title: "韩国国歌变成朝鲜国歌",
    description: "折叠摘要",
    cover: "cover.jpg",
    url: "https://www.bilibili.com/opus/1250152752385884176",
    hasMore: true,
  },
  additional: null,
  commentId: "0",
  commentType: 12,
  stats: { comment: 0, like: 0, forward: 0 },
  url: "https://www.bilibili.com/opus/1250152752385884176",
  original: null,
} satisfies DynamicItem;

const article: DynamicArticle = {
  id: "1250152752385884176",
  title: "韩国国歌变成朝鲜国歌",
  paragraphs: [{ kind: "text", nodes: [{ kind: "text", text: "全文第一段" }] }],
};

function render() {
  return DynamicDetailPage({
    route: {
      key: "DynamicDetail-1",
      name: "DynamicDetail",
      params: {
        dynamicId: detailItem.id,
        title: "韩国国歌变成朝鲜国歌",
        user: { mid: "100785033", name: "地球知识局" },
      },
    },
    navigation: {},
  } as unknown as Parameters<typeof DynamicDetailPage>[0]);
}

function findCard(node: ReactNode): ReactElement<Record<string, unknown>> | undefined {
  for (const child of React.Children.toArray(node)) {
    if (!React.isValidElement<Record<string, unknown>>(child)) {
      continue;
    }
    if (child.type === "DynamicCard") {
      return child;
    }
    const nested = findCard(child.props.children as ReactNode);
    if (nested) {
      return nested;
    }
  }
  return undefined;
}

describe("dynamic detail page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.articleId = null;
    mocks.detail.data = detailItem;
    mocks.detail.error = undefined;
    mocks.detail.isLoading = false;
    mocks.detail.isValidating = false;
    mocks.article.data = article;
    mocks.article.isLoading = false;
  });

  test("loads the full article body for column articles", () => {
    const card = findCard(render());

    expect(mocks.articleId).toBe(detailItem.id);
    expect(card?.props.article).toBe(article);
    expect(card?.props.articleLoading).toBe(false);
    expect(card?.props.detail).toBe(true);
  });

  test("shows the loading state while the full article body is fetching", () => {
    mocks.article.data = undefined;
    mocks.article.isLoading = true;

    const card = findCard(render());

    expect(card?.props.article).toBeUndefined();
    expect(card?.props.articleLoading).toBe(true);
  });

  test("falls back to the folded summary when the full article body fails", () => {
    mocks.article.data = null;

    const card = findCard(render());

    expect(card?.props.article).toBeUndefined();
    expect(card?.props.articleLoading).toBe(false);
  });

  test("does not request the full article body for other dynamics", () => {
    mocks.detail.data = {
      ...detailItem,
      sourceType: "DYNAMIC_TYPE_WORD",
      content: { kind: "text" },
    };

    const card = findCard(render());

    expect(mocks.articleId).toBeNull();
    expect(card?.props.article).toBeUndefined();
    expect(card?.props.articleLoading).toBe(false);
  });
});
