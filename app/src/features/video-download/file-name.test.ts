import { describe, expect, test } from "vitest";

import { buildVideoDownloadTitle, buildVideoFileName, sanitizeFileName } from "./file-name";

describe("video download naming", () => {
  test("keeps a readable title as the file name", () => {
    expect(buildVideoFileName({ title: "【测试】视频 标题", bvid: "BV1test" })).toBe(
      "【测试】视频 标题.mp4",
    );
  });

  test("replaces characters that are invalid in file names", () => {
    expect(sanitizeFileName('a/b\\c:d*e?f"g<h>i|j')).toBe("a_b_c_d_e_f_g_h_i_j");
  });

  test("appends the page number for multi-page videos", () => {
    expect(buildVideoFileName({ title: "合集", page: 3 })).toBe("合集-p3.mp4");
    expect(buildVideoFileName({ title: "合集", page: 1 })).toBe("合集.mp4");
  });

  test("falls back to the bvid when the title is empty", () => {
    expect(buildVideoFileName({ title: "   ", bvid: "BV1test" })).toBe("minibili-BV1test.mp4");
  });

  test("builds a notification title including the page info", () => {
    expect(buildVideoDownloadTitle({ title: "合集", page: 2, pageTitle: "第二集" })).toBe(
      "合集 · P2 第二集",
    );
    expect(buildVideoDownloadTitle({ title: "合集", page: 2 })).toBe("合集 · P2");
    expect(buildVideoDownloadTitle({ title: "单P 视频" })).toBe("单P 视频");
    expect(buildVideoDownloadTitle({ title: "" })).toBe("视频");
  });
});
