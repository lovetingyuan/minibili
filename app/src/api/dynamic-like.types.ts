import type { FavoriteAccount } from "./favorites.types";

export type DynamicLikeChange = {
  dynamicId: string;
  liked: boolean;
};

export type DynamicLikeRequestDependencies = {
  readCookie: () => Promise<string | null>;
  isCurrentAccount: (account: FavoriteAccount) => boolean;
};
