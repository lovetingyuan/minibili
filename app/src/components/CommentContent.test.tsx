import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { CommentImage, CommentMessageContent } from "@/api/comments.types";
import { colors } from "@/constants/colors.tw";

const mocks = vi.hoisted(() => ({
  setCurrentImageIndex: vi.fn(),
  setImagesList: vi.fn(),
}));

vi.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ push: vi.fn() }),
}));
vi.mock("expo-clipboard", () => ({ setStringAsync: vi.fn() }));
vi.mock("react-native", () => ({
  Linking: { openURL: vi.fn() },
  Pressable: "Pressable",
  View: "View",
}));
vi.mock("@/components/styled/expo", () => ({ Image: "Image" }));
vi.mock("@/components/styled/rneui", () => ({ Icon: "Icon", Text: "Text" }));
vi.mock("@/constants/colors.tw", () => import("../constants/colors.tw"));
vi.mock("@/store", () => ({
  useStore: () => ({
    setCurrentImageIndex: mocks.setCurrentImageIndex,
    setImagesList: mocks.setImagesList,
  }),
}));
vi.mock("@/utils", () => ({
  getImagePixelSize: vi.fn(),
  parseImgUrl: (url: string) => url,
  showToast: vi.fn(),
}));
vi.mock("./UpName", () => ({ default: "UpName" }));

import { CommentImages, CommentText } from "./CommentContent";
import { InlineEmoji } from "./InlineEmoji";

type ImageEntryProps = {
  accessibilityLabel?: string;
  children?: ReactNode;
  onPress?: () => void;
};

function makeImages(count: number): CommentImage[] {
  return Array.from({ length: count }, (_, index) => ({
    src: `${index}.jpg`,
    width: 100,
    height: 100,
    ratio: 1,
  }));
}

describe("CommentImages", () => {
  beforeEach(() => vi.clearAllMocks());

  test("does not render an entry when the comment has no images", () => {
    expect(CommentImages({ images: [] })).toBeNull();
  });

  test.each([1, 3])("renders one inline image-count entry for %i image(s)", (count) => {
    const images = makeImages(count);
    const entry = CommentImages({ images }) as ReactElement<ImageEntryProps>;

    expect(entry.type).toBe("Text");
    expect(entry.props.accessibilityLabel).toBe(`查看评论中的 ${count} 张图片`);
    expect(String(entry.props.children)).toContain(`${count} 张图片`);

    entry.props.onPress?.();

    expect(mocks.setCurrentImageIndex).toHaveBeenCalledWith(0);
    expect(mocks.setImagesList).toHaveBeenCalledWith(images);
  });
});

describe("CommentText emoji alignment", () => {
  beforeEach(() => vi.clearAllMocks());

  test("aligns comment emoji with the 15px comment text", () => {
    const text = CommentText({
      idStr: "1",
      images: [],
      nodes: [{ type: "emoji", url: "//i0.hdslb.com/emoji.png" }],
    }) as ReactElement<{ children: ReactElement<{ fontSize: number; size: number }>[][] }>;
    const [emoji] = text.props.children[0];

    expect(emoji.type).toBe(InlineEmoji);
    expect(emoji.props).toMatchObject({
      url: "//i0.hdslb.com/emoji.png",
      size: 18,
      fontSize: 15,
    });
  });
});

describe("CommentText like count", () => {
  beforeEach(() => vi.clearAllMocks());

  type LikeCountProps = { children?: ReactNode; className?: string };

  function lastChild(likeProps: {
    likeText?: string;
    likeActive?: boolean;
    likePending?: boolean;
  }) {
    const text = CommentText({
      idStr: "1",
      images: [],
      nodes: [{ type: "text", text: "评论" }],
      ...likeProps,
    }) as ReactElement<{ children: ReactNode[] }>;
    return text.props.children.at(-1) as ReactElement<LikeCountProps> | null;
  }

  type BodyProps = { className?: string };

  function bodyClassName(likeProps: { bold?: boolean }) {
    const text = CommentText({
      idStr: "1",
      images: [],
      nodes: [{ type: "text", text: "评论" }],
      ...likeProps,
    }) as ReactElement<BodyProps>;
    return text.props.className ?? "";
  }

  test("appends the like count at the end of the comment body", () => {
    const count = lastChild({ likeText: "👍12" }) as ReactElement<LikeCountProps>;

    expect(count.type).toBe("Text");
    expect(count.props.className).toContain(colors.primary.text);
    expect(count.props.children).toContain("👍12");
  });

  test("highlights the like count when the comment is liked", () => {
    const count = lastChild({
      likeText: "👍12",
      likeActive: true,
    }) as ReactElement<LikeCountProps>;

    expect(count.props.className).toContain(colors.commentLike.text);
  });

  test("dims the like count while the attitude request is pending", () => {
    const count = lastChild({
      likeText: "👍12",
      likePending: true,
    }) as ReactElement<LikeCountProps>;

    expect(count.props.className).toContain("opacity-60");
  });

  test("does not append anything when the comment has no likes", () => {
    expect(lastChild({ likeText: "" })).toBeNull();
    expect(lastChild({})).toBeNull();
  });

  test("keeps the like count at normal weight for a bold body", () => {
    const count = lastChild({
      likeText: "👍12",
      likeActive: true,
    }) as ReactElement<LikeCountProps>;

    expect(count.props.className).toContain("font-normal");
  });

  test("leaves a wider gap between the body and the like count", () => {
    const count = lastChild({ likeText: "👍12" }) as ReactElement<LikeCountProps>;

    expect(String(count.props.children)).toBe("\u2003👍12");
  });

  test("bolds the comment body when the comment is liked", () => {
    expect(bodyClassName({ bold: true })).toContain("font-bold");
    expect(bodyClassName({})).not.toContain("font-bold");
  });

  function renderedNodes(nodes: CommentMessageContent, bold: boolean) {
    const text = CommentText({
      idStr: "1",
      images: [],
      nodes,
      bold,
    }) as ReactElement<{ children: [ReactElement<{ className?: string }>[], ...unknown[]] }>;
    return text.props.children[0];
  }

  const BOLD_NODES: CommentMessageContent = [
    { type: "text", text: "评论" },
    { type: "at", text: "@某人", mid: 1 },
    { type: "url", url: "https://example.com" },
    { type: "vote", text: "投票", url: "https://example.com" },
    { type: "av", text: "视频", url: "https://example.com/BV1TEST" },
  ];

  test("applies the bold weight to every text node so Android keeps the weight", () => {
    // RNEUI 的 Text 会给每个节点加默认 fontWeight，父级字重不会被子节点继承
    const classNames = renderedNodes(BOLD_NODES, true).map((node) => node.props.className ?? "");

    expect(classNames).toHaveLength(BOLD_NODES.length);
    expect(classNames.filter((className) => className.includes("font-bold"))).toHaveLength(
      BOLD_NODES.length,
    );
  });

  test("keeps the text nodes at the default weight for a normal body", () => {
    const classNames = renderedNodes(BOLD_NODES, false).map((node) => node.props.className ?? "");

    expect(classNames.filter((className) => className.includes("font-bold"))).toHaveLength(0);
  });
});

describe("CommentText creator liked highlight", () => {
  beforeEach(() => vi.clearAllMocks());

  const NODES: CommentMessageContent = [
    { type: "text", text: "评论" },
    { type: "at", text: "@某人", mid: 1 },
  ];

  function renderText(creatorLiked: boolean) {
    const text = CommentText({
      idStr: "1",
      images: [],
      nodes: NODES,
      creatorLiked,
    }) as ReactElement<{
      className?: string;
      children: [ReactElement<{ className?: string }>[], ...unknown[]];
    }>;
    return { bodyClassName: text.props.className ?? "", nodes: text.props.children[0] };
  }

  test("paints the comment body with the theme pink when the UP liked it", () => {
    const { bodyClassName, nodes } = renderText(true);

    expect(bodyClassName).toContain(colors.secondary.text);
    expect(nodes[0].props.className).toContain(colors.secondary.text);
  });

  test("keeps the accent color of mentions inside a highlighted body", () => {
    const { nodes } = renderText(true);

    expect(nodes[1].props.className).toContain(colors.primary.text);
  });

  test("leaves the body color untouched when the UP did not like the comment", () => {
    const { bodyClassName, nodes } = renderText(false);

    expect(bodyClassName).not.toContain(colors.secondary.text);
    expect(nodes[0].props.className).not.toContain(colors.secondary.text);
  });
});
