import useSWRInfinite from "swr/infinite";

import { useStore } from "@/store";

import type { CommentAttitude } from "./comment-actions.types";
import { getReplyItem, transitionCommentAttitude } from "./comments";
import type { ReplyItemType } from "./comments.types";
import { isReplyPageEnd, mergeReplyItems } from "./replies.helpers";
import { ReplyResponseSchema } from "./replies.schema";
import type { RepliesPage } from "./replies.types";
import fetcher from "./fetcher";

async function fetchRepliesPage(url: string): Promise<RepliesPage> {
  const payload = await fetcher<unknown>(url);
  const response = ReplyResponseSchema.parse(payload);
  return {
    page: response.page,
    replies: response.replies?.map((reply) => getReplyItem(reply)) || [],
    root: response.root ? getReplyItem(response.root) : null,
  };
}

export function useReplies() {
  const { repliesInfo } = useStore();
  const { data, error, setSize, mutate, isValidating, isLoading } = useSWRInfinite<RepliesPage>(
    (index) =>
      repliesInfo
        ? `/x/v2/reply/reply?oid=${repliesInfo.oid}&type=${repliesInfo.type}&root=${repliesInfo.root}&pn=${index + 1}&ps=20`
        : null,
    fetchRepliesPage,
    { revalidateFirstPage: false },
  );

  const fetchedReplies = data?.flatMap((page) => page.replies) || [];
  const list = mergeReplyItems(
    repliesInfo?.previewReplies || [],
    fetchedReplies,
    repliesInfo?.addedReplies || [],
  );
  const firstPage = data?.[0];
  const lastPage = data?.[data.length - 1];
  const allCount = firstPage?.page.count ?? repliesInfo?.allCount;
  const lastPageReplyCount = lastPage?.replies.length || 0;
  const isPageEnd =
    !!lastPage &&
    isReplyPageEnd(
      lastPage.page.size,
      lastPage.page.count,
      lastPageReplyCount,
      fetchedReplies.length,
    );
  const isReachingEnd = !!error || isPageEnd;
  const isLimited = typeof allCount === "number" && allCount > list.length && isReachingEnd;

  async function patchAttitude(id: string, next: CommentAttitude) {
    await mutate(
      (pages) =>
        pages?.map((page) => ({
          ...page,
          root: page.root?.id === id ? transitionCommentAttitude(page.root, next) : page.root,
          replies: page.replies.map((reply) =>
            reply.id === id ? transitionCommentAttitude(reply, next) : reply,
          ),
        })),
      { revalidate: false },
    );
  }

  async function prependReply(reply: ReplyItemType) {
    await mutate(
      (pages) => {
        if (!pages?.length) return pages;
        return pages.map((page, index) => ({
          ...page,
          page: { ...page.page, count: page.page.count + 1 },
          root: page.root ? { ...page.root, rcount: page.root.rcount + 1 } : page.root,
          replies: index === 0 ? [reply, ...page.replies] : page.replies,
        }));
      },
      { revalidate: false },
    );
  }

  return {
    data: {
      allCount,
      replies: list,
      root: firstPage?.root ?? repliesInfo?.rootComment ?? null,
    },
    isLoading,
    update() {
      if (isLoading || isValidating || isReachingEnd || error) return;
      void setSize((current) => current + 1);
    },
    patchAttitude,
    prependReply,
    refresh: mutate,
    isValidating,
    isLimited,
    isReachingEnd,
    error,
  };
}

export type { ReplyItemType } from "./comments.types";
