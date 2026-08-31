import { expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  blacklist: new Map([["42", { mid: 42, name: "UP", face: "", sign: "" }]]),
}));
vi.mock("@/api/useBilibiliBlacklist", () => ({
  useBilibiliBlacklist: () => ({ blacklist: mocks.blacklist }),
}));
vi.mock("./styled/rneui", () => ({ Text: "Text" }));

import UpName from "./UpName";

test("matches by MID, preserves text interactions, and removes styling after cache updates", () => {
  const onPress = vi.fn();
  const props = {
    mid: 42,
    children: "同名 UP",
    className: "text-sm text-primary",
    numberOfLines: 1,
    onPress,
  };
  mocks.blacklist = new Map([["42", { mid: 42, name: "UP", face: "", sign: "" }]]);
  const blocked = UpName(props);
  expect(blocked.props.className).toBe("text-sm text-primary line-through opacity-60");
  expect(blocked.props.children).toBe(props.children);
  expect(blocked.props.numberOfLines).toBe(1);
  expect(blocked.props.onPress).toBe(onPress);
  expect(UpName({ ...props, mid: "42" }).props.className).toContain("line-through");
  expect(UpName({ ...props, mid: 43 }).props.className).toBe(props.className);
  expect(UpName({ ...props, mid: undefined }).props.className).toBe(props.className);
  mocks.blacklist = new Map();
  expect(UpName(props).props.className).toBe(props.className);
});
