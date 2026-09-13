import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { ReplyItemType } from "@/api/comments";
import type { CommentItemProps } from "./comment.types";

const mocks = vi.hoisted(() => ({
  setRepliesInfo: vi.fn(),
}));

vi.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ push: vi.fn() }),
}));
vi.mock("react-native", () => ({
  ActivityIndicator: "ActivityIndicator",
  Pressable: "Pressable",
  View: "View",
}));
vi.mock("@/components/styled/rneui", () => ({
  Avatar: "Avatar",
  Icon: "Icon",
  Text: "Text",
}));
vi.mock("@/constants/colors.tw", () => import("../constants/colors.tw"));
vi.mock("@/store", () => ({
  useStore: () => ({ setRepliesInfo: mocks.setRepliesInfo }),
}));
vi.mock("@/utils", () => ({
  getImagePixelSize: vi.fn(),
  parseImgUrl: (url: string) => url,
  parseNumber: String,
}));
vi.mock("./CommentContent", () => ({
  CommentImages: "CommentImages",
  CommentText: "CommentText",
}));
vi.mock("./UpName", () => ({ default: "UpName" }));

import { Comment } from "./Comment";

type ElementProps = {
  children?: ReactNode;
  onPress?: () => void;
};

function makeComment(overrides: Partial<ReplyItemType> = {}): ReplyItemType {
  return {
    message: [{ type: "text", text: "评论" }],
    images: [],
    name: "用户",
    mid: "1",
    face: "",
    sign: "",
    id: "10",
    oid: "20",
    root: "0",
    root_str: "0",
    rcount: 0,
    attitude: "none",
    creatorLiked: false,
    location: null,
    time: null,
    top: false,
    like: 0,
    sex: "保密",
    type: 1,
    replies: [],
    ...overrides,
  };
}

function children(element: ReactElement<ElementProps>) {
  return Array.isArray(element.props.children)
    ? element.props.children
    : [element.props.children].filter(Boolean);
}

describe("Comment reply entry intent", () => {
  beforeEach(() => vi.clearAllMocks());

  test("direct reply requests composer focus", () => {
    const reply = makeComment({ id: "11", root: "10" });
    const comment = makeComment({ rcount: 1, replies: [reply] });
    const tree = Comment({
      comment,
      sourceUrl: "https://www.bilibili.com/video/BV1TEST",
      onAttitude: vi.fn().mockResolvedValue(null),
      isAttitudePending: () => false,
    }) as ReactElement<ElementProps>;
    const [rootItem] = children(tree) as ReactElement<CommentItemProps>[];

    rootItem.props.onReply(reply);

    expect(mocks.setRepliesInfo).toHaveBeenCalledWith(
      expect.objectContaining({ replyTarget: reply, focusComposer: true }),
    );
  });

  test("view-all opens replies without focusing the composer", () => {
    const reply = makeComment({ id: "11", root: "10" });
    const comment = makeComment({ rcount: 1, replies: [reply] });
    const tree = Comment({
      comment,
      sourceUrl: "https://www.bilibili.com/video/BV1TEST",
      onAttitude: vi.fn().mockResolvedValue(null),
      isAttitudePending: () => false,
    }) as ReactElement<ElementProps>;
    const [, replyGroup] = children(tree) as ReactElement<ElementProps>[];
    const viewAll = children(replyGroup).find(
      (child) => (child as ReactElement).type === "Pressable",
    ) as ReactElement<ElementProps>;

    viewAll.props.onPress?.();

    expect(mocks.setRepliesInfo).toHaveBeenCalledWith(
      expect.objectContaining({ replyTarget: comment, focusComposer: false }),
    );
  });
});
