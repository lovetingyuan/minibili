import React from "react";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  expanded: false,
  setExpanded: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
  const original = await importOriginal<typeof import("react")>();
  return {
    ...original,
    useState: () => [mocks.expanded, mocks.setExpanded],
  };
});
vi.mock("react-native", () => ({ Pressable: "Pressable", View: "View" }));
vi.mock("@/components/styled/rneui", () => ({ Text: "Text" }));
vi.mock("@/constants/theme", () => import("../../constants/theme"));

import ProfileInfo from "./ProfileInfo";

type TestElementProps = {
  accessibilityLabel?: string;
  accessibilityRole?: string;
  children?: ReactNode;
  numberOfLines?: number;
  onPress?: () => void;
  selectable?: boolean;
};

type TestElement = ReactElement<TestElementProps>;

function text(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (!React.isValidElement<{ children?: ReactNode }>(node)) {
    return "";
  }
  return React.Children.toArray(node.props.children).map(text).join("");
}

function renderFunction(element: TestElement): TestElement {
  if (typeof element.type !== "function") {
    throw new Error("Expected a function component");
  }
  const Component = element.type as (props: typeof element.props) => TestElement;
  return Component(element.props);
}

function renderProfile(officialDescription?: string, sign?: string) {
  const profile = ProfileInfo({ officialDescription, sign });
  if (!React.isValidElement<{ children?: ReactNode }>(profile)) {
    return null;
  }
  const children = React.Children.toArray(profile.props.children).filter(
    React.isValidElement,
  ) as TestElement[];
  const rows = children.filter((child) => typeof child.type === "function").map(renderFunction);
  return {
    rows,
    button: rows
      .flatMap((row) => React.Children.toArray(row.props.children) as TestElement[])
      .find((child) => child.type === "Pressable"),
  };
}

describe("dynamic profile info", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.expanded = false;
    mocks.setExpanded.mockImplementation((update: (current: boolean) => boolean) => {
      mocks.expanded = update(mocks.expanded);
    });
  });

  test("shows both fields collapsed to one line by default", () => {
    const rendered = renderProfile("很长的认证介绍", "很长的个人签名");

    expect(rendered?.rows.map(text)).toEqual([
      "UP主介绍　很长的认证介绍",
      "个人签名　很长的个人签名详情",
    ]);
    for (const row of rendered?.rows ?? []) {
      const [value] = React.Children.toArray(row.props.children) as TestElement[];
      expect(value.props).toMatchObject({ numberOfLines: 1, selectable: false });
    }
    expect(rendered?.button?.props).toMatchObject({
      accessibilityLabel: "查看UP主资料详情",
      accessibilityRole: "button",
    });
    expect(text(rendered?.button)).toBe("详情");
  });

  test("the details button expands the full text and becomes a collapse button", () => {
    const collapsed = renderProfile("认证UP主", "个人签名");
    collapsed?.button?.props.onPress?.();
    expect(mocks.expanded).toBe(true);

    const expanded = renderProfile("认证UP主", "个人签名");
    for (const row of expanded?.rows ?? []) {
      const [value] = React.Children.toArray(row.props.children) as TestElement[];
      expect(value.props.numberOfLines).toBeUndefined();
      expect(value.props.selectable).toBe(true);
    }
    expect(expanded?.button?.props.accessibilityLabel).toBe("收起UP主资料");
    expect(text(expanded?.button)).toBe("收起");

    expanded?.button?.props.onPress?.();
    expect(mocks.expanded).toBe(false);
  });

  test.each([
    ["认证UP主", undefined, "UP主介绍　认证UP主详情"],
    [undefined, "个人签名", "个人签名　个人签名详情"],
  ])("hides an empty row", (officialDescription, sign, expected) => {
    const rendered = renderProfile(officialDescription, sign);

    expect(rendered?.rows.map(text)).toEqual([expected]);
    expect(text(rendered?.button)).toBe("详情");
  });

  test("hides the entire block when both fields are empty", () => {
    expect(ProfileInfo({ officialDescription: "  ", sign: "" })).toBeNull();
  });
});
