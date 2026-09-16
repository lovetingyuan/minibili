import { describe, expect, test } from "vitest";

import {
  countFavoriteFolderNameLength,
  getFavoriteFolderNameError,
  normalizeFavoriteFolderName,
} from "./folder-name";

describe("Bilibili favorite folder name", () => {
  test("rejects blank names after trimming", () => {
    expect(getFavoriteFolderNameError("")).toBe("收藏夹名称不能为空");
    expect(getFavoriteFolderNameError("   ")).toBe("收藏夹名称不能为空");
    expect(getFavoriteFolderNameError("\t\n")).toBe("收藏夹名称不能为空");
  });

  test("keeps the captured folder name and trims surrounding spaces", () => {
    expect(normalizeFavoriteFolderName("  test  ")).toBe("test");
    expect(getFavoriteFolderNameError("  test  ")).toBeNull();
  });

  test("counts by code point so emoji and CJK names are measured like the input shows", () => {
    expect(countFavoriteFolderNameLength("👍")).toBe(1);
    expect(countFavoriteFolderNameLength("a".repeat(20))).toBe(20);
    expect(getFavoriteFolderNameError("a".repeat(20))).toBeNull();
    expect(getFavoriteFolderNameError("a".repeat(21))).toBe("收藏夹名称不能超过 20 个字");
    expect(getFavoriteFolderNameError("👍".repeat(20))).toBeNull();
    expect(getFavoriteFolderNameError("👍".repeat(21))).toBe("收藏夹名称不能超过 20 个字");
  });

  test("allows emoji sequences that rely on the zero width joiner", () => {
    expect(getFavoriteFolderNameError("👨‍👩‍👧 家庭")).toBeNull();
  });

  test.each([
    ["换行", "test\ntest"],
    ["制表符", "test\ttest"],
    ["零宽空格", "test\u200Btest"],
    ["双向控制符", "test\u202Etest"],
    ["字节序标记", "\uFEFFtest"],
  ])("rejects invisible characters such as %s", (_name, value) => {
    expect(getFavoriteFolderNameError(value)).toBe("收藏夹名称包含不支持的字符");
  });

  test("keeps punctuation, symbols and other visible characters", () => {
    for (const value of ["学习-资料", "a/b:c*d?", "<test>", "日本語のフォルダ", "50% & 100%"]) {
      expect(getFavoriteFolderNameError(value)).toBeNull();
    }
  });
});
