import { describe, expect, test } from "vitest";

import type { VideoFavoriteFolder } from "../../api/video-favorites.types";
import { createFavoriteSelection, toggleFavoriteFolder } from "./favorite-selection";

const folders: VideoFavoriteFolder[] = [
  { id: 303350121, fid: 3033501, mid: 123, title: "默认收藏夹", media_count: 1, fav_state: 1 },
  { id: 3328621821, fid: 33286218, mid: 123, title: "学习", media_count: 0, fav_state: 0 },
];

describe("favorite selection", () => {
  test("preselects existing membership with full IDs and allows multiple selection and removing all", () => {
    const initial = createFavoriteSelection(folders);
    expect(initial.selectedIds).toEqual([303350121]);
    const multi = toggleFavoriteFolder(initial, 3328621821);
    expect(multi.selectedIds).toEqual([303350121, 3328621821]);
    expect(
      toggleFavoriteFolder(toggleFavoriteFolder(multi, 303350121), 3328621821).selectedIds,
    ).toEqual([]);
    expect(initial.initialIds).toEqual([303350121]);
  });

  test("does not select a default folder for an unfavorited video", () => {
    expect(
      createFavoriteSelection(folders.map((folder) => ({ ...folder, fav_state: 0 }))).selectedIds,
    ).toEqual([]);
  });

  test("a reopened dialog discards unsaved edits and uses fresh server membership", () => {
    toggleFavoriteFolder(createFavoriteSelection(folders), 3328621821);
    const fresh = folders.map((folder) => ({ ...folder, fav_state: 0 as const }));
    expect(createFavoriteSelection(fresh).selectedIds).toEqual([]);
  });

  test("reconciliation preserves desired selection while updating the baseline and removing deleted folders", () => {
    const updated = createFavoriteSelection([folders[1]], [folders[0].id, folders[1].id]);
    expect(updated.initialIds).toEqual([]);
    expect(updated.selectedIds).toEqual([3328621821]);
    expect(toggleFavoriteFolder(updated, folders[0].id)).toBe(updated);
  });
});
