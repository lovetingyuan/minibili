export function mergeReplyItems<T extends { id: string }>(preview: T[], fetched: T[]) {
  const items = new Map<string, T>();
  preview.forEach((item) => items.set(item.id, item));
  fetched.forEach((item) => items.set(item.id, item));
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
