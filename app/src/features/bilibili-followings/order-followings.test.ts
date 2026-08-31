import { expect, test } from "vitest";
import { mergeFollowedUps } from "../../api/followings";
import type { UpInfo } from "../../types";
import { orderFollowedUps } from "./order-followings";

const ups: UpInfo[] = [1, 2, 3, 4, 5, 6, 7].map((mid) => ({
  mid,
  name: `UP ${mid}`,
  face: "",
  sign: "",
}));

test("pinned order takes priority over live and unread groups without changing their own order", () => {
  const result = orderFollowedUps(
    ups,
    ["5", "2"],
    { 2: "live", 3: "live", 6: "live" },
    {
      3: { latestId: "old", currentLatestId: "new" },
      4: { latestId: "old", currentLatestId: "new" },
      7: { latestId: "same", currentLatestId: "same" },
    },
  );
  expect(result.map((up) => up.mid)).toEqual([5, 2, 3, 6, 4, 1, 7]);
  expect(ups.map((up) => up.mid)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  expect(result[0]).toBe(ups[4]);
});

test("list refresh and temporary absence never discard pinned IDs, including numeric/string matches", () => {
  const ids = ["5", "2", "999"];
  const refreshed = mergeFollowedUps(ups, [{ ...ups[1], mid: "2", name: "updated" }, ups[0]]);
  expect(orderFollowedUps(refreshed, ids, {}, {})).toEqual([refreshed[0], ups[0]]);
  expect(orderFollowedUps([], ids, {}, {})).toEqual([]);
  expect(orderFollowedUps(ups, ids, {}, {}).map((up) => up.mid)).toEqual([5, 2, 1, 3, 4, 6, 7]);
  expect(ids).toEqual(["5", "2", "999"]);
  expect(orderFollowedUps(ups, [], {}, {})).toEqual(ups);
});
