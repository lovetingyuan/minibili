import type { FavoriteAccount, FavoriteFolder } from "@/api/favorites.types";
import type { FavoriteVideo } from "@/api/video-favorites.types";

export type FavoriteEditorTarget = {
  account: FavoriteAccount;
  video: FavoriteVideo;
};

export type FavoriteFolderTabsProps = {
  folders: FavoriteFolder[];
  selectedId?: number;
  disabled: boolean;
  onSelect: (id: number) => void;
};
