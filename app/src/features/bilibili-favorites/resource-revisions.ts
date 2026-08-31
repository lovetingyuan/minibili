import type { ScopedMutator } from "swr";

import type { FavoriteAccount } from "../../api/favorites.types";

// 按 SWR provider 隔离，避免取消收藏前的请求晚返回后重新写入旧单页缓存。
const revisions = new WeakMap<ScopedMutator, Map<string, number>>();

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
  return revisions.get(mutate)?.get(folderKey(account, folderId)) ?? 0;
}

export function invalidateFavoriteResourceRequests(
  mutate: ScopedMutator,
  account: FavoriteAccount,
  folderIds: Iterable<number>,
) {
  let current = revisions.get(mutate);
  if (!current) {
    current = new Map();
    revisions.set(mutate, current);
  }
  for (const folderId of folderIds) {
    const key = folderKey(account, folderId);
    current.set(key, (current.get(key) ?? 0) + 1);
  }
}
