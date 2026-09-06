import { describe, expect, test } from "vitest";

import { getOriginalImageButtonLabel, updateOriginalImageStatuses } from "./image-viewer-state";

describe("image viewer original-image state", () => {
  test("tracks loading and loaded state independently for each image", () => {
    const firstLoading = updateOriginalImageStatuses({}, { type: "request", uri: "first" });
    const secondLoading = updateOriginalImageStatuses(firstLoading, {
      type: "request",
      uri: "second",
    });
    const firstLoaded = updateOriginalImageStatuses(secondLoading, {
      type: "loaded",
      uri: "first",
    });

    expect(firstLoaded).toEqual({ first: "loaded", second: "loading" });
  });

  test("returns a failed image to preview mode and resets the gallery", () => {
    const loading = { first: "loading" as const, second: "loaded" as const };
    expect(updateOriginalImageStatuses(loading, { type: "failed", uri: "first" })).toEqual({
      first: "idle",
      second: "loaded",
    });
    expect(updateOriginalImageStatuses(loading, { type: "reset" })).toEqual({});
  });

  test("provides labels for idle, loading and original states", () => {
    expect(getOriginalImageButtonLabel("idle", false)).toBe("查看原图");
    expect(getOriginalImageButtonLabel("loading", false)).toBe("原图加载中…");
    expect(getOriginalImageButtonLabel("loaded", false)).toBe("已是原图");
    expect(getOriginalImageButtonLabel("idle", true)).toBe("已是原图");
  });
});
