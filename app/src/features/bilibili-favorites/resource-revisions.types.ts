export type FavoriteResourceState = {
  revision: number;
  removalCount: number;
  excludedVideoIds: Set<string>;
};
