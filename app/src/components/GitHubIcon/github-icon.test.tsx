import type { ReactElement } from "react";
import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  useResolvedColor: vi.fn<() => string | undefined>(),
}));

vi.mock("react-native-svg", () => ({ default: "Svg", Path: "Path" }));
vi.mock("@/constants/theme", () => ({
  theme: { text: { primary: "text-slate-800 dark:text-slate-200" } },
}));
vi.mock("@/hooks/useResolvedColor", () => ({ default: mocks.useResolvedColor }));

import { GitHubIcon } from "./github-icon";

type IconElementProps = {
  children?: ReactElement<{ d: string; fill?: string }>;
  height?: number;
  viewBox?: string;
  width?: number;
};

beforeEach(() => {
  mocks.useResolvedColor.mockReturnValue("#262626");
});

test("renders the GitHub mark with the resolved theme color", () => {
  const icon = GitHubIcon({}) as ReactElement<IconElementProps>;

  expect(icon.type).toBe("Svg");
  expect(icon.props).toMatchObject({ height: 20, viewBox: "0 0 24 24", width: 20 });
  expect(icon.props.children?.type).toBe("Path");
  expect(icon.props.children?.props.fill).toBe("#262626");
  expect(icon.props.children?.props.d).toContain("M10.226 17.284");
});

test("supports explicit color and dimensions", () => {
  const icon = GitHubIcon({ color: "#ffffff", height: 24, width: 24 }) as ReactElement<IconElementProps>;

  expect(icon.props).toMatchObject({ height: 24, width: 24 });
  expect(icon.props.children?.props.fill).toBe("#ffffff");
});
