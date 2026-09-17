import type { ReactElement, ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";

import type { ReplyItemType } from "@/api/comments.types";
import type { RepliesInfo } from "@/store/replies-info.type";

const mocks = vi.hoisted(() => ({
  repliesInfo: null as unknown,
  replies: null as unknown,
  setRepliesInfo: vi.fn(),
}));

vi.mock("react", async () => ({
  ...(await vi.importActual<typeof import("react")>("react")),
  useEffect: vi.fn(),
  useRef: (value: unknown) => ({ current: value }),
}));
vi.mock("@react-navigation/native", () => ({ useIsFocused: () => true }));
vi.mock("react-native", () => ({
  ActivityIndicator: "ActivityIndicator",
  Pressable: "Pressable",
  View: "View",
}));
vi.mock("@/api/replies", () => ({ useReplies: () => mocks.replies }));
vi.mock("@/components/styled/rneui", () => ({
  BottomSheet: "BottomSheet",
  FlashList: "FlashList",
  Icon: "Icon",
  Text: "Text",
}));
vi.mock("@/constants/colors.tw", () => import("../constants/colors.tw"));
vi.mock("@/hooks/useKeyboardHeight", () => ({ default: () => 0 }));
vi.mock("@/store", () => ({
  useStore: () => ({ repliesInfo: mocks.repliesInfo, setRepliesInfo: mocks.setRepliesInfo }),
}));
vi.mock("./Comment", () => ({ CommentItem: "CommentItem" }));
vi.mock("./ReplyComposer", () => ({ default: "ReplyComposer" }));

import ReplyList from "./ReplyList";

type ElementProps = {
  children?: ReactNode;
  className?: string;
  onDelete?: (target: ReplyItemType) => Promise<boolean>;
  renderItem?: (input: { item: ReplyItemType }) => ReactElement<ElementProps>;
  scrollViewProps?: { keyboardShouldPersistTaps?: string };
  viewerMid?: string;
};

function createReply(id: string, root: string | number, rcount = 0): ReplyItemType {
  return {
    message: [],
    images: [],
    name: `user-${id}`,
    mid: id,
    face: "",
    sign: "",
    id,
    oid: "1000",
    root,
    root_str: String(root),
    rcount,
    attitude: "none",
    creatorLiked: false,
    top: false,
    like: 0,
    sex: "保密",
    type: 1,
    replies: [],
  };
}

function findElement(
  value: ReactNode,
  match: (element: ReactElement<ElementProps>) => boolean,
): ReactElement<ElementProps> | null {
  if (!value || typeof value !== "object" || !("props" in value)) return null;
  const element = value as ReactElement<ElementProps>;
  if (match(element)) return element;
  const children = Array.isArray(element.props.children)
    ? element.props.children
    : [element.props.children];
  for (const child of children) {
    const found = findElement(child, match);
    if (found) return found;
  }
  return null;
}

beforeEach(() => {
  vi.clearAllMocks();
  const child = createReply("12", "10");
  const rootComment = { ...createReply("10", "0", 1), replies: [child] };
  mocks.repliesInfo = {
    oid: "1000",
    root: "10",
    type: 1,
    allCount: 1,
    rootComment,
    previewReplies: [child],
    addedReplies: [],
    sourceUrl: "https://www.bilibili.com/video/BV1TEST",
    replyTarget: rootComment,
    focusComposer: false,
  } satisfies RepliesInfo;
  mocks.replies = {
    data: { allCount: 1, replies: [child], root: rootComment },
    isLoading: false,
    isValidating: false,
    isPageEnd: true,
    error: undefined,
    patchAttitude: vi.fn(),
    prependReply: vi.fn(),
    removeReply: vi.fn(),
    refresh: vi.fn(),
    retry: vi.fn(),
    update: vi.fn(),
  };
});

test("keeps keyboard taps, increases row padding and wires own-reply deletion", async () => {
  const onDelete = vi.fn().mockResolvedValue(true);
  const tree = ReplyList({
    onAttitude: vi.fn().mockResolvedValue(null),
    onSubmitReply: vi.fn().mockResolvedValue(null),
    onDelete,
    viewerMid: "12",
    isAttitudePending: () => false,
    isReplyPending: () => false,
    isDeletePending: () => false,
  }) as ReactElement<ElementProps>;

  expect(tree.props.scrollViewProps?.keyboardShouldPersistTaps).toBe("handled");
  const list = findElement(tree, (element) => element.type === "FlashList");
  const child = (mocks.repliesInfo as RepliesInfo).previewReplies[0];
  const row = list?.props.renderItem?.({ item: child });
  expect(row?.props.className).toContain("px-6");
  const comment = findElement(row, (element) => element.type === "CommentItem");
  expect(comment?.props.viewerMid).toBe("12");

  await comment?.props.onDelete?.(child);

  expect(onDelete).toHaveBeenCalledWith(child);
  expect(
    (mocks.replies as { removeReply: ReturnType<typeof vi.fn> }).removeReply,
  ).toHaveBeenCalledWith(child.id);
  expect(mocks.setRepliesInfo).toHaveBeenCalledWith(
    expect.objectContaining({ allCount: 0, previewReplies: [] }),
  );
});
