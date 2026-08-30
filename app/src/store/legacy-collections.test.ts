import { expect, test, vi } from "vitest";

import { clearLegacyCollections } from "./legacy-collections";

test("removes only local legacy favorites and is safe to repeat", async () => {
  const values = new Map([
    ["Store:$collectedVideos", "old favorites"],
    ["Store:$followedUps", "followings"],
    ["Store:$watchedVideos", "history"],
    ["Store:$musicList", "music"],
    ["Store:$blackTags", "settings"],
  ]);
  const remove = vi.fn(async (key: string) => {
    values.delete(key);
  });
  await expect(clearLegacyCollections(remove)).resolves.toBe(true);
  await expect(clearLegacyCollections(remove)).resolves.toBe(true);
  expect([...values.values()]).toEqual(["followings", "history", "music", "settings"]);
  expect(remove.mock.calls).toEqual([["Store:$collectedVideos"], ["Store:$collectedVideos"]]);
});

test("reports a failed cleanup without rejecting startup and retries next time", async () => {
  const remove = vi
    .fn<(key: string) => Promise<void>>()
    .mockRejectedValueOnce(new Error("storage unavailable"))
    .mockResolvedValueOnce(undefined);
  await expect(clearLegacyCollections(remove)).resolves.toBe(false);
  await expect(clearLegacyCollections(remove)).resolves.toBe(true);
  expect(remove).toHaveBeenCalledTimes(2);
});
