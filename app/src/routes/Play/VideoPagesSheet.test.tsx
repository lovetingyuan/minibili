import type { ReactElement, ReactNode } from "react";
import { expect, test, vi } from "vitest";

import type { VideoInfo } from "@/api/video-info";

vi.mock("react", async () => {
  const mocked = {
    ...(await vi.importActual<typeof import("react")>("react")),
    useEffect: vi.fn(),
    useRef: (value: unknown) => ({ current: value }),
  };
  // 组件用 React.useRef 访问 hooks，默认导出也要换成打桩后的命名空间
  return { ...mocked, default: mocked };
});
vi.mock("react-native", () => ({
  Pressable: "Pressable",
  useWindowDimensions: () => ({ height: 1000, width: 400 }),
  View: "View",
}));
vi.mock("@/components/styled/bottom-sheet", () => ({ BottomSheet: "BottomSheet" }));
vi.mock("@/components/styled/rneui", () => ({ FlashList: "FlashList", Text: "Text" }));
vi.mock("@/components/ThemedIcon", () => ({ ThemedIcon: "ThemedIcon" }));
vi.mock("lucide-react-native", () => ({ Check: "Check", X: "X" }));
vi.mock("@/constants/colors.tw", () => import("../../constants/colors.tw"));
vi.mock("@/utils", () => ({ parseDuration: (duration: number) => `${duration}s` }));

import VideoPagesSheet from "./VideoPagesSheet";
import { getVideoPagesSheetHeight } from "./video-pages-sheet.helpers";

type ElementProps = {
  accessibilityLabel?: string;
  backdropOpacity?: number;
  onPress?: () => void;
  renderItem?: (input: { item: VideoInfo["pages"][number] }) => ReactElement<ElementProps>;
  snapPoints?: number[];
  visible?: boolean;
};

function createPage(page: number): VideoInfo["pages"][number] {
  return {
    width: 1920,
    height: 1080,
    duration: 60 * page,
    cover: "",
    title: `P${page} 标题`,
    page,
    cid: 1000 + page,
  };
}

function findElement(
  value: ReactNode,
  match: (element: ReactElement<ElementProps>) => boolean,
): ReactElement<ElementProps> | null {
  if (!value || typeof value !== "object" || !("props" in value)) {
    return null;
  }
  const element = value as ReactElement<ElementProps>;
  if (match(element)) {
    return element;
  }
  const children = Array.isArray(element.props.children)
    ? element.props.children
    : [element.props.children];
  for (const child of children) {
    const found = findElement(child, match);
    if (found) {
      return found;
    }
  }
  return null;
}

test("uses the computed height for the shared sheet and closes after picking a page", () => {
  const onClose = vi.fn();
  const onSelectPage = vi.fn();
  const pages = [createPage(1), createPage(2), createPage(3)];
  const tree = VideoPagesSheet({
    currentPage: 2,
    pages,
    visible: true,
    onClose,
    onSelectPage,
  }) as ReactElement<ElementProps>;

  expect(tree.type).toBe("BottomSheet");
  expect(tree.props.visible).toBe(true);
  expect(tree.props.snapPoints).toEqual([getVideoPagesSheetHeight(1000, 3)]);
  expect(tree.props.backdropOpacity).toBe(0.35);

  const closeButton = findElement(
    tree,
    (element) => element.props.accessibilityLabel === "关闭分P列表",
  );
  closeButton?.props.onPress?.();
  expect(onClose).toHaveBeenCalledTimes(1);

  const list = findElement(tree, (element) => element.type === "FlashList");
  const row = list?.props.renderItem?.({ item: pages[2] });
  row?.props.onPress?.();
  expect(onSelectPage).toHaveBeenCalledWith(3);
  expect(onClose).toHaveBeenCalledTimes(2);
});
