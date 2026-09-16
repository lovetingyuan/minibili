import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { ReplyItemType } from "@/api/comments";
import type { CommentItemProps } from "./comment.types";

const mocks = vi.hoisted(() => ({
  setRepliesInfo: vi.fn(),
  setOverlayButtons: vi.fn(),
  alert: vi.fn<(title: string, message?: string, actions?: AlertAction[]) => void>(),
}));

vi.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ push: vi.fn() }),
}));
vi.mock("react-native", () => ({
  Alert: { alert: mocks.alert },
  Pressable: "Pressable",
  View: "View",
}));
vi.mock("@/components/styled/rneui", () => ({
  Avatar: "Avatar",
  Text: "Text",
}));
vi.mock("@/constants/colors.tw", () => import("../constants/colors.tw"));
vi.mock("@/store", () => ({
  useStore: () => ({
    setRepliesInfo: mocks.setRepliesInfo,
    setOverlayButtons: mocks.setOverlayButtons,
  }),
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

import { Comment, CommentItem } from "./Comment";

type ElementProps = {
  children?: ReactNode;
  className?: string;
  accessibilityLabel?: string;
  disabled?: boolean;
  onLongPress?: () => void;
  onPress?: () => void;
};

type OverlayButton = { text: string; onPress: () => void };
type AlertAction = { text: string; onPress?: () => void };

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

function lastOverlayButtons() {
  return mocks.setOverlayButtons.mock.lastCall?.[0] as OverlayButton[] | undefined;
}

function openItemActions(props: CommentItemProps) {
  const item = CommentItem(props) as ReactElement<ElementProps>;
  expect(item.type).toBe("Pressable");
  item.props.onLongPress?.();
  const buttons = lastOverlayButtons();
  if (!buttons) throw new Error("Expected the long press to open the comment actions overlay");
  return buttons;
}

function findElement(
  element: ReactNode,
  match: (props: ElementProps) => boolean,
): ReactElement<ElementProps> | null {
  if (!element || typeof element !== "object" || !("props" in element)) return null;
  const node = element as ReactElement<ElementProps>;
  if (match(node.props)) return node;
  for (const child of children(node)) {
    const found = findElement(child, match);
    if (found) return found;
  }
  return null;
}

function deleteButtonOf(props: CommentItemProps) {
  return findElement(CommentItem(props), (nodeProps) => nodeProps.accessibilityLabel === "删除评论");
}

describe("Comment long press actions", () => {
  beforeEach(() => vi.clearAllMocks());

  test("long pressing a comment offers like, dislike and reply", () => {
    const buttons = openItemActions({
      comment: makeComment({ id: "11" }),
      onAttitude: vi.fn().mockResolvedValue(null),
      onReply: vi.fn(),
      isAttitudePending: () => false,
    });

    expect(buttons.map((button) => button.text)).toEqual(["点赞", "点踩", "回复"]);
  });

  test("labels the like and dislike actions as cancellations when already applied", () => {
    const liked = openItemActions({
      comment: makeComment({ id: "11", attitude: "like" }),
      onAttitude: vi.fn().mockResolvedValue(null),
      onReply: vi.fn(),
      isAttitudePending: () => false,
    });
    expect(liked.map((button) => button.text)).toEqual(["取消点赞", "点踩", "回复"]);

    const disliked = openItemActions({
      comment: makeComment({ id: "12", attitude: "dislike" }),
      onAttitude: vi.fn().mockResolvedValue(null),
      onReply: vi.fn(),
      isAttitudePending: () => false,
    });
    expect(disliked.map((button) => button.text)).toEqual(["点赞", "取消点踩", "回复"]);
  });

  test("the like and dislike actions report the current comment attitude", () => {
    const comment = makeComment({ id: "11" });
    const onAttitude = vi.fn().mockResolvedValue(null);
    const buttons = openItemActions({
      comment,
      onAttitude,
      onReply: vi.fn(),
      isAttitudePending: () => false,
    });

    buttons[0].onPress();
    expect(onAttitude).toHaveBeenLastCalledWith(comment, "like");

    buttons[1].onPress();
    expect(onAttitude).toHaveBeenLastCalledWith(comment, "dislike");
  });
});

test("renders a pinned comment as a tag", () => {
  const tag = findElement(
    CommentItem({
      comment: makeComment({ top: true }),
      onAttitude: vi.fn().mockResolvedValue(null),
      onReply: vi.fn(),
      isAttitudePending: () => false,
    }),
    (nodeProps) => nodeProps.accessibilityLabel === "置顶标签",
  );

  expect(tag?.type).toBe("View");
  expect(tag?.props.className).toContain("rounded");
  expect(tag?.props.className).toContain("bg-pink-50");
});

describe("Comment like count", () => {
  beforeEach(() => vi.clearAllMocks());

  type LikeCountProps = {
    bold?: boolean;
    likeActive?: boolean;
    likeText?: string;
  };

  function renderLikeCount(comment: ReplyItemType) {
    const item = CommentItem({
      comment,
      onAttitude: vi.fn().mockResolvedValue(null),
      onReply: vi.fn(),
      isAttitudePending: () => false,
    }) as ReactElement<ElementProps>;
    const [, body] = children(item) as ReactElement<ElementProps>[];
    const [text] = children(body) as ReactElement<LikeCountProps>[];
    return text.props;
  }

  test("renders the like count with a thumb character at the end of the body", () => {
    expect(renderLikeCount(makeComment({ like: 12 }))).toMatchObject({
      likeText: "👍12",
      likeActive: false,
      bold: false,
    });
  });

  test("marks the count as liked and appends the UP suffix when the UP also liked", () => {
    expect(
      renderLikeCount(makeComment({ like: 123, attitude: "like", creatorLiked: true })),
    ).toMatchObject({
      likeText: "👍123+UP",
      likeActive: true,
      bold: true,
    });
  });

  test("appends a thumbs down when the comment is disliked", () => {
    expect(renderLikeCount(makeComment({ like: 12, attitude: "dislike" }))).toMatchObject({
      likeText: "👍12👎",
      likeActive: false,
      bold: false,
    });
    expect(renderLikeCount(makeComment({ like: 0, attitude: "dislike" }))).toMatchObject({
      likeText: "👎",
    });
  });

  test("does not render a count when the comment has no likes", () => {
    expect(renderLikeCount(makeComment({ like: 0 })).likeText).toBe("");
    expect(renderLikeCount(makeComment({ like: 0, creatorLiked: true })).likeText).toBe("");
  });

  test("keeps the comment body flush with the avatar", () => {
    const item = CommentItem({
      comment: makeComment(),
      onAttitude: vi.fn().mockResolvedValue(null),
      onReply: vi.fn(),
      isAttitudePending: () => false,
    }) as ReactElement<ElementProps>;
    const [, body] = children(item) as ReactElement<{ className?: string }>[];

    expect(body.type).toBe("View");
    expect(body.props.className ?? "").not.toContain("pl-");
  });
});

describe("Comment reply entry intent", () => {
  beforeEach(() => vi.clearAllMocks());

  test("replying to a root comment from the long press menu requests composer focus", () => {
    const comment = makeComment({ rcount: 1, replies: [makeComment({ id: "11", root: "10" })] });
    const tree = Comment({
      comment,
      sourceUrl: "https://www.bilibili.com/video/BV1TEST",
      onAttitude: vi.fn().mockResolvedValue(null),
      isAttitudePending: () => false,
    }) as ReactElement<ElementProps>;
    const [rootItem] = children(tree) as ReactElement<CommentItemProps>[];

    const buttons = openItemActions(rootItem.props);
    buttons.find((button) => button.text === "回复")?.onPress();

    expect(mocks.setRepliesInfo).toHaveBeenCalledWith(
      expect.objectContaining({ replyTarget: comment, focusComposer: true }),
    );
  });

  test("replying to a previewed reply from the long press menu requests composer focus", () => {
    const reply = makeComment({ id: "11", root: "10" });
    const comment = makeComment({ rcount: 1, replies: [reply] });
    const tree = Comment({
      comment,
      sourceUrl: "https://www.bilibili.com/video/BV1TEST",
      onAttitude: vi.fn().mockResolvedValue(null),
      isAttitudePending: () => false,
    }) as ReactElement<ElementProps>;
    const [, replyGroup] = children(tree) as ReactElement<ElementProps>[];
    const [replies] = children(replyGroup) as ReactElement<CommentItemProps>[][];
    const [replyItem] = replies;

    const buttons = openItemActions(replyItem.props);
    buttons.find((button) => button.text === "回复")?.onPress();

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

describe("Comment card layout", () => {
  beforeEach(() => vi.clearAllMocks());

  function renderComment(comment = makeComment()) {
    return Comment({
      comment,
      sourceUrl: "https://www.bilibili.com/video/BV1TEST",
      onAttitude: vi.fn().mockResolvedValue(null),
      isAttitudePending: () => false,
    }) as ReactElement<ElementProps>;
  }

  test("renders each comment as an inset card instead of a bordered row", () => {
    const tree = renderComment();

    expect(tree.type).toBe("View");
    expect(tree.props.className).toContain("rounded-2xl");
    expect(tree.props.className).toContain("bg-white");
    expect(tree.props.className).not.toContain("border-b");
  });

  test("keeps the previewed replies visually separated inside the card", () => {
    const comment = makeComment({ rcount: 1, replies: [makeComment({ id: "11", root: "10" })] });
    const tree = renderComment(comment);
    const [, replyGroup] = children(tree) as ReactElement<ElementProps>[];

    expect(replyGroup.type).toBe("View");
    expect(replyGroup.props.className).toContain("bg-neutral-100");
  });

  test("makes the more-replies row full width with left-aligned text", () => {
    const comment = makeComment({ rcount: 3, replies: [makeComment({ id: "11", root: "10" })] });
    const tree = renderComment(comment);
    const [, replyGroup] = children(tree) as ReactElement<ElementProps>[];
    const viewAll = children(replyGroup).find(
      (child) => (child as ReactElement).type === "Pressable",
    ) as ReactElement<ElementProps>;

    expect(viewAll.props.className).not.toContain("self-start");
    expect(viewAll.props.className).toContain("active:bg-neutral-400/20");
    expect(viewAll.props.className).not.toContain("items-center");
  });
});

describe("Comment creator liked highlight", () => {
  beforeEach(() => vi.clearAllMocks());

  type BodyNodeProps = { creatorLiked?: boolean };

  function renderBody(comment: ReplyItemType) {
    const item = CommentItem({
      comment,
      onAttitude: vi.fn().mockResolvedValue(null),
      onReply: vi.fn(),
      isAttitudePending: () => false,
    }) as ReactElement<ElementProps>;
    const [, body] = children(item) as ReactElement<ElementProps>[];
    return children(body);
  }

  test("asks the body to highlight itself when the UP liked the comment", () => {
    const [text] = renderBody(makeComment({ creatorLiked: true })) as ReactElement<BodyNodeProps>[];

    expect(text.type).toBe("CommentText");
    expect(text.props.creatorLiked).toBe(true);
  });

  test("no longer renders the UP 主觉得很赞 label inside the body", () => {
    const body = renderBody(makeComment({ creatorLiked: true }));

    expect(body).toHaveLength(1);
  });
});

describe("Comment delete entry", () => {
  beforeEach(() => vi.clearAllMocks());

  function makeProps(overrides: Partial<CommentItemProps> = {}): CommentItemProps {
    return {
      comment: makeComment({ id: "11", mid: "999", time: "2026-09-01 12:00", location: "上海" }),
      onAttitude: vi.fn().mockResolvedValue(null),
      onReply: vi.fn(),
      isAttitudePending: () => false,
      ...overrides,
    };
  }

  test("offers delete for own comments and confirms before deleting", () => {
    const onDelete = vi.fn();
    const props = makeProps({ onDelete, viewerMid: "999" });
    const button = deleteButtonOf(props);

    expect(button).not.toBeNull();
    button?.props.onPress?.();
    expect(mocks.alert).toHaveBeenCalledOnce();
    const [title, message, actions] = mocks.alert.mock.calls[0];
    expect(title).toBe("删除评论");
    expect(message).toContain("删除评论后");
    expect(actions?.map((action) => action.text)).toEqual(["取消", "确定"]);
    actions?.[1]?.onPress?.();
    expect(onDelete).toHaveBeenCalledWith(props.comment);
  });

  test("hides delete for other users' comments", () => {
    expect(deleteButtonOf(makeProps({ onDelete: vi.fn(), viewerMid: "123" }))).toBeNull();
  });

  test("hides delete when the caller does not provide a delete handler", () => {
    expect(deleteButtonOf(makeProps({ viewerMid: "999" }))).toBeNull();
  });

  test("disables delete while the request is in flight", () => {
    const button = deleteButtonOf(
      makeProps({ onDelete: vi.fn(), viewerMid: "999", isDeletePending: (id) => id === "11" }),
    );

    expect(button?.props.disabled).toBe(true);
  });
});
