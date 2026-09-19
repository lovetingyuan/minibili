import type { RepliesPage } from "./replies.types";

export function mergeReplyItems<T extends { id: string }>(
  preview: T[],
  fetched: T[],
  added: T[] = [],
) {
  const items = new Map<string, T>();
  added.forEach((item) => items.set(item.id, item));
  fetched.forEach((item) => items.set(item.id, item));
  preview.forEach((item) => {
    if (!items.has(item.id)) {
      items.set(item.id, item);
    }
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

export function removeReplyFromPages(
  pages: readonly RepliesPage[] | undefined,
  id: string,
): RepliesPage[] | undefined {
  return pages?.map((page) => ({
    ...page,
    page: { ...page.page, count: Math.max(0, page.page.count - 1) },
    root: page.root ? { ...page.root, rcount: Math.max(0, page.root.rcount - 1) } : page.root,
    replies: page.replies.filter((reply) => reply.id !== id),
  }));
}
