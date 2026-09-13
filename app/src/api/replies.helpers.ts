export function mergeReplyItems<T extends { id: string }>(
  preview: T[],
  fetched: T[],
  added: T[] = [],
) {
  const items = new Map<string, T>();
  added.forEach((item) => items.set(item.id, item));
  fetched.forEach((item) => items.set(item.id, item));
  preview.forEach((item) => {
    if (!items.has(item.id)) items.set(item.id, item);
  });
  return [...items.values()];
}

export function isReplyPageEnd(
  pageSize: number,
  pageCount: number,
  lastPageReplyCount: number,
  fetchedReplyCount: number,
) {
  return lastPageReplyCount < pageSize || fetchedReplyCount >= pageCount;
}

export function shouldShowReplySection(replyCount: number, previewReplyCount: number) {
  return replyCount > 0 || previewReplyCount > 0;
}
