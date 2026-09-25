import { describe, expect, test, vi } from "vitest";

// play-url 会连带加载请求层（含 react-native 依赖），单测里只关心纯函数
vi.mock("./fetcher", () => ({ default: vi.fn(), getApiErrorCode: () => null }));

import { isUnplayablePlayUrlCode, sumPlayUrlDurationMs } from "./play-url";

describe("sumPlayUrlDurationMs", () => {
  test("分段视频把每段时长累加", () => {
    expect(sumPlayUrlDurationMs([{ length: 1000 }, { length: 2000 }])).toBe(3000);
  });

  test("没有 durl 时返回 0", () => {
    expect(sumPlayUrlDurationMs(undefined)).toBe(0);
    expect(sumPlayUrlDurationMs(null)).toBe(0);
    expect(sumPlayUrlDurationMs([])).toBe(0);
  });

  test("忽略异常的长度值", () => {
    expect(sumPlayUrlDurationMs([{ length: 1000 }, { length: Number.NaN }])).toBe(1000);
  });
});

describe("isUnplayablePlayUrlCode", () => {
  test("权限类错误码不再重试", () => {
    expect(isUnplayablePlayUrlCode(-403)).toBe(true);
    expect(isUnplayablePlayUrlCode(-404)).toBe(true);
    // 充电专属但 UP 主没有开放试看
    expect(isUnplayablePlayUrlCode(87008)).toBe(true);
  });

  test("其它错误码照旧重试", () => {
    expect(isUnplayablePlayUrlCode(-10403)).toBe(false);
    expect(isUnplayablePlayUrlCode(-1)).toBe(false);
    expect(isUnplayablePlayUrlCode(null)).toBe(false);
    expect(isUnplayablePlayUrlCode(undefined)).toBe(false);
  });
});
