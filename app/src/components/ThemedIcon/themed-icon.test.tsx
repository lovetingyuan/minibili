import type { LucideIcon } from "lucide-react-native";
import type { ReactElement } from "react";
import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  useResolvedColor: vi.fn<(className: string) => string | undefined>(),
}));

vi.mock("@/constants/colors.tw", () => ({
  colors: { black: { text: "text-zinc-800 dark:text-neutral-200" } },
}));
vi.mock("@/hooks/useResolvedColor", () => ({
  default: mocks.useResolvedColor,
}));

import { ThemedIcon } from "./themed-icon";

const TestIcon = "TestIcon" as unknown as LucideIcon;
type TestIconProps = {
  color?: string;
  fill?: string;
  size?: number;
  strokeWidth?: number;
};

beforeEach(() => {
  mocks.useResolvedColor.mockImplementation((className) =>
    className === "text-zinc-800 dark:text-neutral-200" ? "#27272a" : "#fb7299",
  );
});

test("resolves the default icon color in the light theme", () => {
  const icon = ThemedIcon({ icon: TestIcon, size: 20 }) as ReactElement<TestIconProps>;

  expect(icon.type).toBe("TestIcon");
  expect(icon.props).toMatchObject({ color: "#27272a", size: 20 });
  expect(mocks.useResolvedColor).toHaveBeenCalledWith("text-zinc-800 dark:text-neutral-200");
});

test("uses the color resolved for the dark theme", () => {
  mocks.useResolvedColor.mockReturnValueOnce("#e5e5e5");

  const icon = ThemedIcon({ icon: TestIcon }) as ReactElement<TestIconProps>;

  expect(icon.props.color).toBe("#e5e5e5");
});

test("prefers an explicit color over the resolved theme color", () => {
  const icon = ThemedIcon({
    icon: TestIcon,
    color: "#ffffff",
    colorClassName: "accent-pink-500 dark:accent-pink-400",
  }) as ReactElement<TestIconProps>;

  expect(icon.props.color).toBe("#ffffff");
});

test("fills selected icons with their resolved theme color", () => {
  const icon = ThemedIcon({
    icon: TestIcon,
    colorClassName: "accent-pink-500 dark:accent-pink-400",
    filled: true,
    strokeWidth: 3,
  }) as ReactElement<TestIconProps>;

  expect(icon.props).toMatchObject({ color: "#fb7299", fill: "#fb7299", strokeWidth: 3 });
});
