import type { FavoriteFolder } from "@/api/favorites.types";

export type FavoriteFolderTabsProps = {
  folders: FavoriteFolder[];
  selectedId?: number;
  disabled: boolean;
  onSelect: (id: number) => void;
};
