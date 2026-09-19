import { expect, test, vi } from "vitest";

import { clearLegacyCollections } from "./legacy-collections";

test("removes only retired local state and is safe to repeat", async () => {
  const values = new Map([
    ["Store:$collectedVideos", "old favorites"],
    ["Store:$followedUps", "followings"],
    ["Store:$watchedVideos", "history"],
    ["Store:$localPlayProgress", "play progress"],
    ["Store:$followingDynamicsUnreadMap", "broken following unread state"],
    ["Store:$watchedHotSearch", "search"],
    ["Store:$blackTags", "settings"],
  ]);
  const remove = vi.fn(async (key: string) => {
    values.delete(key);
  });
  await expect(clearLegacyCollections(remove)).resolves.toBe(true);
  await expect(clearLegacyCollections(remove)).resolves.toBe(true);
  expect([...values.values()]).toEqual(["followings", "search", "settings"]);
  expect(remove.mock.calls).toEqual([
    ["Store:$collectedVideos"],
    ["Store:$watchedVideos"],
    ["Store:$localPlayProgress"],
    ["Store:$followingDynamicsUnreadMap"],
    ["Store:$collectedVideos"],
    ["Store:$watchedVideos"],
    ["Store:$localPlayProgress"],
    ["Store:$followingDynamicsUnreadMap"],
  ]);
});

test("reports a failed cleanup without rejecting startup and retries next time", async () => {
  const remove = vi
    .fn<(key: string) => Promise<void>>()
    .mockRejectedValueOnce(new Error("storage unavailable"))
    .mockResolvedValueOnce(undefined);
  await expect(clearLegacyCollections(remove)).resolves.toBe(false);
  await expect(clearLegacyCollections(remove)).resolves.toBe(true);
  expect(remove).toHaveBeenCalledTimes(8);
});

test("history and play progress cleanup run even if favorites cleanup fails", async () => {
  const remove = vi.fn(async (key: string) => {
    if (key === "Store:$collectedVideos") {
      throw new Error("storage unavailable");
    }
  });
  await expect(clearLegacyCollections(remove)).resolves.toBe(false);
  expect(remove).toHaveBeenCalledWith("Store:$watchedVideos");
  expect(remove).toHaveBeenCalledWith("Store:$localPlayProgress");
  expect(remove).toHaveBeenCalledWith("Store:$followingDynamicsUnreadMap");
});
