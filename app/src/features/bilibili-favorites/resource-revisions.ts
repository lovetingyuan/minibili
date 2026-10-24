import type { ScopedMutator } from "swr";

import type { FavoriteAccount } from "../../api/favorites.types";
import type { FavoriteResourceState } from "./resource-revisions.types";

// 按 SWR provider 隔离，避免取消收藏前的请求晚返回后重新写入旧单页缓存。
const revisions = new WeakMap<ScopedMutator, Map<string, FavoriteResourceState>>();

function folderKey(account: FavoriteAccount, folderId: number) {
  return `${account.mid}:${account.generation}:${folderId}`;
}

export class FavoriteResourcesChangedError extends Error {
  constructor() {
    super("收藏列表已更新，忽略旧请求结果");
  }
}

export function getFavoriteResourceRevision(
  mutate: ScopedMutator,
  account: FavoriteAccount,
  folderId: number,
) {
  return getFavoriteResourceState(mutate, account, folderId).revision;
}

export function getFavoriteResourceState(
  mutate: ScopedMutator,
  account: FavoriteAccount,
  folderId: number,
) {
  let current = revisions.get(mutate);
  if (!current) {
    current = new Map();
    revisions.set(mutate, current);
  }
  const key = folderKey(account, folderId);
  let state = current.get(key);
  if (!state) {
    state = { revision: 0, removalCount: 0, excludedVideoIds: new Set() };
    current.set(key, state);
  }
  return state;
}

export function invalidateFavoriteResourceRequests(
  mutate: ScopedMutator,
  account: FavoriteAccount,
  folderIds: Iterable<number>,
) {
  for (const folderId of folderIds) {
    getFavoriteResourceState(mutate, account, folderId).revision += 1;
  }
}
