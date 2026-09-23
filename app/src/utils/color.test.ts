import { expect, test } from "vitest";

import { withAlpha } from "./color";

test("expands 3-digit hex colors", () => {
  expect(withAlpha("#0af", 0.32)).toBe("rgba(0, 170, 255, 0.32)");
});

test("adds alpha to 6-digit hex colors", () => {
  expect(withAlpha("#0284c7", 0.32)).toBe("rgba(2, 132, 199, 0.32)");
});

test("accepts rgb() and rgba() input", () => {
  expect(withAlpha("rgb(2, 132, 199)", 0.1)).toBe("rgba(2, 132, 199, 0.1)");
  expect(withAlpha("rgba(2, 132, 199, 0.5)", 0.1)).toBe("rgba(2, 132, 199, 0.1)");
});

test("ignores surrounding whitespace and hex case", () => {
  expect(withAlpha("  #FFFFFF  ", 0.32)).toBe("rgba(255, 255, 255, 0.32)");
});

test("returns undefined for colors it cannot parse", () => {
  expect(withAlpha("hsl(208, 8%, 90%)", 0.32)).toBeUndefined();
  expect(withAlpha("red", 0.32)).toBeUndefined();
  expect(withAlpha(undefined, 0.32)).toBeUndefined();
});
