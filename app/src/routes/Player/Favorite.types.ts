import type { FavoriteAccount } from "../../api/favorites.types";
import type { FavoriteVideo, VideoFavoriteFolder } from "../../api/video-favorites.types";

export type FavoriteButtonProps = { aid?: string | number; bvid: string; count?: number };
export type FavoriteButtonContentProps = FavoriteButtonProps & {
  account: FavoriteAccount | null;
  preparing: boolean;
};
export type FavoriteDialogProps = {
  account: FavoriteAccount;
  video: FavoriteVideo;
  onClose: () => void;
  onLoginRequired: (error: Error) => void;
};
export type FavoriteSelection = {
  folders: VideoFavoriteFolder[];
  initialIds: number[];
  selectedIds: number[];
};
