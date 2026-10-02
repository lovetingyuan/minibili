import type { FavoriteAccount } from "../../api/favorites.types";

export type LikeButtonProps = { aid?: string | number; bvid: string; count?: number };
export type LikeButtonContentProps = LikeButtonProps & {
  account: FavoriteAccount | null;
  preparing: boolean;
};
