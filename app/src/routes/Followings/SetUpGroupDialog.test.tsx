import React from "react";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";
import type { RelationTag } from "@/api/relation-tags.types";
import type { UpInfo } from "@/types";

const mocks = vi.hoisted(() => {
  class RelationTagLoginRequiredError extends Error {}
  return {
    RelationTagLoginRequiredError,
    state: [] as unknown[],
    refs: [] as { current: unknown }[],
    stateIndex: 0,
    refIndex: 0,
    effects: [] as (() => void)[],
    current: {
      data: undefined as number[] | undefined,
      error: undefined as Error | undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn().mockResolvedValue(undefined),
    },
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    onLoginRequired: vi.fn(),
  };
});

vi.mock("react", async (importOriginal) => {
  const original = await importOriginal<typeof import("react")>();
  const originalDefault = (original as unknown as { default?: object }).default;
  function useState(initial: unknown) {
    const index = mocks.stateIndex++;
    mocks.state[index] ??= initial;
    return [
      mocks.state[index],
      (value: unknown) => {
        mocks.state[index] =
          typeof value === "function"
            ? (value as (previous: unknown) => unknown)(mocks.state[index])
            : value;
      },
    ];
  }
  function useEffect(effect: () => void) {
    mocks.effects.push(effect);
  }
  function useRef(initial: unknown) {
    const index = mocks.refIndex++;
    mocks.refs[index] ??= { current: initial };
    return mocks.refs[index];
  }
  return {
    ...original,
    default: { ...originalDefault, useState, useEffect, useRef },
    useState,
    useEffect,
    useRef,
  };
});
vi.mock("@/api/relation-tags", () => ({
  RelationTagLoginRequiredError: mocks.RelationTagLoginRequiredError,
}));
vi.mock("@/api/useBilibiliRelationTags", () => ({
  useBilibiliUpRelationTags: () => mocks.current,
}));
vi.mock("react-native", () => ({
  ActivityIndicator: "ActivityIndicator",
  ScrollView: "ScrollView",
  View: "View",
}));
vi.mock("@/components/styled/rneui", () => ({
  Button: "Button",
  CheckBox: "CheckBox",
  Text: "Text",
  Dialog: Object.assign(
    (props: { children?: ReactNode }) => props.children,
    { Title: "DialogTitle", Actions: "DialogActions", Button: "DialogButton" },
  ),
}));
vi.mock("@/constants/colors.tw", () => import("../../constants/colors.tw"));

import SetUpGroupDialog from "./SetUpGroupDialog";

type ElementProps = {
  children?: ReactNode;
  title?: string;
  checked?: boolean;
  disabled?: boolean;
  onPress?: () => void;
};

function elements(node: ReactNode): ReactElement<ElementProps>[] {
  const result: ReactElement<ElementProps>[] = [];
  React.Children.forEach(node, (child) => {
    if (React.isValidElement<ElementProps>(child)) {
      result.push(child, ...elements(child.props.children));
    }
  });
  return result;
}

const up: UpInfo = { mid: 10, name: "UP", face: "", sign: "" };
const groups: RelationTag[] = [
  { tagid: -10, name: "特别关注", count: 1, tip: "" },
  { tagid: 446542, name: "考研", count: 2, tip: "" },
];

function render() {
  mocks.stateIndex = 0;
  mocks.refIndex = 0;
  return elements(
    SetUpGroupDialog({
      up,
      groups,
      onClose: mocks.onClose,
      onSubmit: mocks.onSubmit,
      onLoginRequired: mocks.onLoginRequired,
    }),
  );
}

function runEffects() {
  const effects = [...mocks.effects];
  mocks.effects = [];
  effects.forEach((effect) => effect());
}

function groupCheckBox(tagid: number) {
  const title = `${groups.find((group) => group.tagid === tagid)!.name}（${
    groups.find((group) => group.tagid === tagid)!.count
  }）`;
  return render().find((element) => element.props.title === title)!;
}

function confirmButton() {
  return render().find((element) => element.props.title === "确定")!;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.state = [];
  mocks.refs = [];
  mocks.stateIndex = 0;
  mocks.refIndex = 0;
  mocks.effects = [];
  mocks.current = {
    data: [-10],
    error: undefined,
    isLoading: false,
    isValidating: false,
    mutate: vi.fn().mockResolvedValue(undefined),
  };
  mocks.onSubmit.mockResolvedValue(undefined);
});

test("回显 UP 当前所在的分组", () => {
  render();
  runEffects();
  expect(groupCheckBox(-10).props.checked).toBe(true);
  expect(groupCheckBox(446542).props.checked).toBe(false);
  expect(confirmButton().props.disabled).toBe(false);
});

test("取消全部选中后禁止提交，并提示至少选择一个分组", () => {
  render();
  runEffects();
  groupCheckBox(-10).props.onPress?.();
  expect(groupCheckBox(-10).props.checked).toBe(false);
  expect(confirmButton().props.disabled).toBe(true);
});

test("提交选中的分组并关闭弹窗", async () => {
  render();
  runEffects();
  groupCheckBox(446542).props.onPress?.();
  confirmButton().props.onPress?.();
  await vi.waitFor(() => {
    expect(mocks.onSubmit).toHaveBeenCalledWith([-10, 446542]);
  });
});

test("登录失效时交给页面处理", async () => {
  mocks.onSubmit.mockRejectedValue(
    new mocks.RelationTagLoginRequiredError("登录凭据失效，请重新登录 B站"),
  );
  render();
  runEffects();
  confirmButton().props.onPress?.();
  await vi.waitFor(() => {
    expect(mocks.onLoginRequired).toHaveBeenCalledOnce();
  });
});

test("当前分组加载失败时提供重试", () => {
  mocks.current = {
    data: undefined,
    error: new Error("boom"),
    isLoading: false,
    isValidating: false,
    mutate: vi.fn().mockResolvedValue(undefined),
  };
  const retry = render().find((element) => element.props.title === "重试")!;
  retry.props.onPress?.();
  expect(mocks.current.mutate).toHaveBeenCalledOnce();
});
