import { useStore } from "@/store";

import type { CommentAttitude } from "./comment-actions.types";
import { getReplyItem, transitionCommentAttitude } from "./comments";
import type { ReplyItemType } from "./comments.types";
import { isReplyPageEnd, mergeReplyItems, removeReplyFromPages } from "./replies.helpers";
import { ReplyResponseSchema } from "./replies.schema";
import type { RepliesPage } from "./replies.types";
import fetcher from "./fetcher";
import { useCommentPagination } from "./useCommentPagination";

async function fetchRepliesPage(url: string): Promise<RepliesPage> {
  const payload = await fetcher<unknown>(url);
  const response = ReplyResponseSchema.parse(payload);
  return {
    page: response.page,
    pagination: { count: response.page.count, receivedCount: response.replies?.length ?? 0 },
    replies: response.replies?.map((reply) => getReplyItem(reply)) || [],
    root: response.root ? getReplyItem(response.root) : null,
  };
}

export function useReplies() {
  const { repliesInfo } = useStore();
  const pagination = useCommentPagination<RepliesPage>(
    (index, previous) =>
      repliesInfo &&
      (!previous ||
        !isReplyPageEnd(
          previous.page.size,
          previous.pagination.count,
          previous.pagination.receivedCount,
          index * previous.page.size,
        ))
        ? `/x/v2/reply/reply?oid=${repliesInfo.oid}&type=${repliesInfo.type}&root=${repliesInfo.root}&pn=${index + 1}&ps=20`
        : null,
    fetchRepliesPage,
  );
  const { data, error, isValidating, isLoading, mutatePages } = pagination;

  const fetchedReplies = data?.flatMap((page) => page.replies) || [];
  const list = mergeReplyItems([], fetchedReplies, repliesInfo?.addedReplies || []);
  const firstPage = data?.[0];
  const lastPage = data?.[data.length - 1];
  const allCount = firstPage?.page.count ?? repliesInfo?.allCount;
  const receivedCount =
    data?.reduce((count, page) => count + page.pagination.receivedCount, 0) ?? 0;
  const isPageEnd =
    !!lastPage &&
    isReplyPageEnd(
      lastPage.page.size,
      lastPage.pagination.count,
      lastPage.pagination.receivedCount,
      receivedCount,
    );

  async function patchAttitude(id: string, next: CommentAttitude) {
    await mutatePages((pages) =>
      pages?.map((page) => ({
        ...page,
        root: page.root?.id === id ? transitionCommentAttitude(page.root, next) : page.root,
        replies: page.replies.map((reply) =>
          reply.id === id ? transitionCommentAttitude(reply, next) : reply,
        ),
      })),
    );
  }

  async function prependReply(reply: ReplyItemType) {
    await mutatePages((pages) => {
      if (!pages?.length) {
        return pages;
      }
      return pages.map((page, index) => ({
        ...page,
        page: { ...page.page, count: page.page.count + 1 },
        root: page.root ? { ...page.root, rcount: page.root.rcount + 1 } : page.root,
        replies: index === 0 ? [reply, ...page.replies] : page.replies,
      }));
    });
  }

  async function removeReply(id: string) {
    await mutatePages((pages) => removeReplyFromPages(pages, id));
  }

  return {
    data: {
      allCount,
      replies: list,
      root: firstPage?.root ?? repliesInfo?.rootComment ?? null,
    },
    isLoading,
    update: () => pagination.update(isPageEnd),
    retry: pagination.retry,
    patchAttitude,
    prependReply,
    removeReply,
    refresh: pagination.refresh,
    isValidating,
    isPageEnd,
    error,
  };
}

export type { ReplyItemType } from "./comments.types";
