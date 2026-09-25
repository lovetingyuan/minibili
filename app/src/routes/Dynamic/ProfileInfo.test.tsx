import React from "react";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { PROFILE_INFO_COLLAPSED_LINES } from "./profile-info.helpers";
import type { ProfileInfoLinesField } from "./profile-info.helpers";
import type { ProfileInfoProps, ProfileInfoRowProps } from "./ProfileInfo.types";

/**
 * 用"按调用顺序分配槽位"的 useState 替身驱动组件：
 * 每次顶层渲染重置下标，槽位跨渲染保留，这样才能在模拟 onTextLayout 之后重新渲染断言。
 */
const mocks = vi.hoisted(() => ({
  index: 0,
  slots: [] as unknown[],
}));

vi.mock("react", async (importOriginal) => {
  const original = await importOriginal<typeof import("react")>();
  return {
    ...original,
    useState: (initial: unknown) => {
      const index = mocks.index++;
      if (!(index in mocks.slots)) {
        mocks.slots[index] = initial;
      }
      return [
        mocks.slots[index],
        (update: unknown) => {
          const current = mocks.slots[index];
          mocks.slots[index] =
            typeof update === "function"
              ? (update as (value: unknown) => unknown)(current)
              : update;
        },
      ];
    },
  };
});
vi.mock("react-native", () => ({ Pressable: "Pressable", View: "View" }));
vi.mock("@/components/styled/rneui", () => ({ Text: "Text" }));
vi.mock("@/constants/theme", () => import("../../constants/theme"));

import ProfileInfo from "./ProfileInfo";

type TextLayoutEvent = { nativeEvent: { lines: { text: string }[] } };

type TestElementProps = {
  accessibilityElementsHidden?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: string;
  accessible?: boolean;
  children?: ReactNode;
  className?: string;
  importantForAccessibility?: string;
  numberOfLines?: number;
  onPress?: () => void;
  onTextLayout?: (event: TextLayoutEvent) => void;
  pointerEvents?: string;
  selectable?: boolean;
};

type TestElement = ReactElement<TestElementProps>;
type RowElement = ReactElement<ProfileInfoRowProps>;

type RenderedRow = {
  action?: TestElement;
  element: RowElement;
  measuring: TestElement;
  visible: TestElement;
};

type Rendered = {
  button?: TestElement;
  rows: RenderedRow[];
};

function text(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (!React.isValidElement<{ children?: ReactNode }>(node)) {
    return "";
  }
  return React.Children.toArray(node.props.children).map(text).join("");
}

function childrenOf(node: ReactNode): TestElement[] {
  return React.Children.toArray(node).filter(React.isValidElement) as TestElement[];
}

function renderBlock(props: ProfileInfoProps): TestElement | null {
  mocks.index = 0;
  const profile = ProfileInfo(props);
  if (!React.isValidElement<{ children?: ReactNode }>(profile)) {
    return null;
  }
  return profile as TestElement;
}

function renderRow(element: RowElement): RenderedRow {
  if (typeof element.type !== "function") {
    throw new Error("Expected a row component");
  }
  const render = element.type as (props: ProfileInfoRowProps) => TestElement;
  const rendered = childrenOf(render(element.props).props.children);
  const texts = rendered.filter((child) => child.type === "Text");
  const visible = texts.find((child) => !child.props.onTextLayout);
  const measuring = texts.find((child) => child.props.onTextLayout);
  if (!visible || !measuring) {
    throw new Error("Expected one visible text and one measuring text");
  }
  return {
    action: rendered.find((child) => child.type === "Pressable"),
    element,
    measuring,
    visible,
  };
}

function renderProfile(props: ProfileInfoProps): Rendered {
  const block = renderBlock(props);
  if (!block) {
    throw new Error("Expected a rendered profile block");
  }
  const rows = childrenOf(block.props.children) as RowElement[];
  const renderedRows = rows.map(renderRow);
  return {
    button: renderedRows.map((row) => row.action).find((action) => action !== undefined),
    rows: renderedRows,
  };
}

/** 模拟一次文本排版回调，行数就是原生返回的 lines.length */
function measure(rendered: Rendered, field: ProfileInfoLinesField, lines: number) {
  const row = rendered.rows.find((item) => item.element.props.field === field);
  if (!row) {
    throw new Error(`Expected a row for field ${field}`);
  }
  const onTextLayout = row.measuring.props.onTextLayout;
  if (!onTextLayout) {
    throw new Error("Expected a measuring text");
  }
  onTextLayout({ nativeEvent: { lines: Array.from({ length: lines }, () => ({ text: "行" })) } });
}

const bothFields = { officialDescription: "认证介绍", sign: "个人签名" };

describe("dynamic profile info", () => {
  beforeEach(() => {
    mocks.index = 0;
    mocks.slots = [];
  });

  test("hides the entire block when both fields are empty", () => {
    expect(renderBlock({ officialDescription: "  ", sign: "" })).toBeNull();
  });

  test("两个字段折叠时都限制为一行", () => {
    const rendered = renderProfile(bothFields);

    expect(rendered.rows.map((row) => text(row.visible))).toEqual([
      "UP主介绍　认证介绍",
      "个人签名　个人签名",
    ]);
    for (const row of rendered.rows) {
      expect(row.visible.props).toMatchObject({
        numberOfLines: PROFILE_INFO_COLLAPSED_LINES,
        selectable: false,
      });
    }
  });

  test("测量副本不受行数限制、不参与手势与朗读", () => {
    const rendered = renderProfile(bothFields);

    for (const row of rendered.rows) {
      expect(row.measuring.props).toMatchObject({
        accessibilityElementsHidden: true,
        accessible: false,
        importantForAccessibility: "no-hide-descendants",
        pointerEvents: "none",
      });
      expect(row.measuring.props.numberOfLines).toBeUndefined();
      expect(row.measuring.props.className).toContain("absolute");
      expect(row.measuring.props.className).toContain("opacity-0");
      expect(row.measuring.props.className).toContain("left-0");
      expect(row.measuring.props.className).toContain("right-0");
      // 量的是和可见文本完全一致的文案，否则换行位置对不上
      expect(text(row.measuring)).toBe(text(row.visible));
    }
  });

  test("一行放得下时不显示详情按钮", () => {
    const measured = renderProfile(bothFields);
    measure(measured, "official", 1);
    measure(measured, "sign", 1);
    const rendered = renderProfile(bothFields);

    expect(rendered.button).toBeUndefined();
    expect(rendered.rows.map((row) => row.action)).toEqual([undefined, undefined]);
    for (const row of rendered.rows) {
      expect(row.visible.props.numberOfLines).toBe(PROFILE_INFO_COLLAPSED_LINES);
    }
  });

  test("超过一行时在最后一个非空字段行尾显示详情按钮", () => {
    const measured = renderProfile(bothFields);
    measure(measured, "official", 3);
    measure(measured, "sign", 2);
    const rendered = renderProfile(bothFields);

    expect(rendered.rows[0].action).toBeUndefined();
    expect(text(rendered.button)).toBe("详情");
    expect(rendered.button?.props).toMatchObject({
      accessibilityLabel: "查看UP主资料详情",
      accessibilityRole: "button",
    });
    for (const row of rendered.rows) {
      expect(row.visible.props).toMatchObject({
        numberOfLines: PROFILE_INFO_COLLAPSED_LINES,
        selectable: false,
      });
    }
  });

  test("只有介绍超行时按钮依然只放在签名行，点击后两行一起展开", () => {
    let rendered = renderProfile(bothFields);
    measure(rendered, "official", 2);
    rendered = renderProfile(bothFields);

    expect(rendered.rows[0].action).toBeUndefined();
    expect(text(rendered.button)).toBe("详情");

    rendered.button?.props.onPress?.();
    rendered = renderProfile(bothFields);

    for (const row of rendered.rows) {
      expect(row.visible.props.numberOfLines).toBeUndefined();
      expect(row.visible.props.selectable).toBe(true);
    }
    expect(text(rendered.button)).toBe("收起");
    expect(rendered.button?.props.accessibilityLabel).toBe("收起UP主资料");

    rendered.button?.props.onPress?.();
    rendered = renderProfile(bothFields);

    expect(text(rendered.button)).toBe("详情");
    expect(rendered.rows[0].visible.props.numberOfLines).toBe(PROFILE_INFO_COLLAPSED_LINES);
  });

  test("变宽后行数回落到一行以内时按钮消失并重新折叠", () => {
    let rendered = renderProfile(bothFields);
    measure(rendered, "sign", 5);
    rendered = renderProfile(bothFields);
    expect(text(rendered.button)).toBe("详情");

    measure(rendered, "sign", 1);
    rendered = renderProfile(bothFields);

    expect(rendered.button).toBeUndefined();
    expect(rendered.rows[1].visible.props.numberOfLines).toBe(PROFILE_INFO_COLLAPSED_LINES);
  });

  test.each<[{ officialDescription: string } | { sign: string }, ProfileInfoLinesField]>([
    [{ officialDescription: "很长的认证介绍" }, "official"],
    [{ sign: "很长的个人签名" }, "sign"],
  ])("只有一个字段时超行才显示按钮", (props, field) => {
    let rendered = renderProfile(props);
    expect(rendered.button).toBeUndefined();

    measure(rendered, field, 1);
    rendered = renderProfile(props);
    expect(rendered.button).toBeUndefined();

    measure(rendered, field, 2);
    rendered = renderProfile(props);

    expect(rendered.rows).toHaveLength(1);
    expect(text(rendered.button)).toBe("详情");
  });
});
