import type { VideoFavoriteFolder } from "../../api/video-favorites.types";
import type { FavoriteSelection } from "./Favorite.types";

export function createFavoriteSelection(
  folders: VideoFavoriteFolder[],
  desiredIds?: number[],
): FavoriteSelection {
  const initialIds: number[] = [];
  for (const folder of folders) {
    if (folder.fav_state === 1) {
      initialIds.push(folder.id);
    }
  }
  const available = new Set(folders.map((folder) => folder.id));
  return {
    folders,
    initialIds,
    selectedIds: desiredIds ? desiredIds.filter((id) => available.has(id)) : [...initialIds],
  };
}

export function toggleFavoriteFolder(
  selection: FavoriteSelection,
  folderId: number,
): FavoriteSelection {
  if (!selection.folders.some((folder) => folder.id === folderId)) return selection;
  const selected = selection.selectedIds.includes(folderId);
  return {
    ...selection,
    selectedIds: selected
      ? selection.selectedIds.filter((id) => id !== folderId)
      : [...selection.selectedIds, folderId],
  };
}
