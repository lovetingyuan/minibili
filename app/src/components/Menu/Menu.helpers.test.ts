import { describe, expect, test } from "vitest";

import { getMenuAnchorPosition } from "./Menu.helpers";

describe("getMenuAnchorPosition", () => {
  test("normalizes an anchor measured above a translucent modal origin", () => {
    expect(
      getMenuAnchorPosition({
        measuredLeft: 320,
        measuredTop: 48,
        modalLeft: 0,
        modalTop: -24,
      }),
    ).toEqual({
      left: 320,
      top: 72,
    });
  });

  test("keeps measured coordinates when anchor and modal share the same origin", () => {
    expect(
      getMenuAnchorPosition({
        measuredLeft: 320,
        measuredTop: 48,
        modalLeft: 0,
        modalTop: 0,
      }),
    ).toEqual({
      left: 320,
      top: 48,
    });
  });

  test("normalizes horizontal offsets as well as vertical offsets", () => {
    expect(
      getMenuAnchorPosition({
        measuredLeft: 320,
        measuredTop: 48,
        modalLeft: -12,
        modalTop: -24,
      }),
    ).toEqual({
      left: 332,
      top: 72,
    });
  });
});
