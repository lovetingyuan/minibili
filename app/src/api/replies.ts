import useSWRInfinite from "swr/infinite";
import type { z } from "zod";

import { useStore } from "@/store";

import { getReplyItem } from "./comments";
import type { ReplyItemType } from "./comments";
import type { ReplyResponseSchema } from "./replies.schema";
import { isReplyPageEnd, mergeReplyItems } from "./replies.helpers";
import fetcher from "./fetcher";

type ReplyResponse = z.infer<typeof ReplyResponseSchema>;

export type { ReplyItemType } from "./comments";

export function useReplies() {
  const { repliesInfo } = useStore();
  const { data, error, size, setSize, isValidating, isLoading } = useSWRInfinite<ReplyResponse>(
    (index) => {
      return repliesInfo
        ? `/x/v2/reply/reply?oid=${repliesInfo.oid}&type=${repliesInfo.type}&root=${repliesInfo.root}&pn=${index + 1}&ps=20`
        : null;
    },
    fetcher,
    {
      revalidateFirstPage: false,
    },
  );
  // const isLoadingMore =
  //   isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined')
  const fetchedReplies =
    data?.reduce((a, b) => {
      return a.concat(b.replies?.map(getReplyItem) || []);
    }, [] as ReplyItemType[]) || [];
  const list = mergeReplyItems(repliesInfo?.previewReplies || [], fetchedReplies);
  const firstPage = data?.[0];
  const lastPage = data?.[data.length - 1];
  const allCount = firstPage?.page.count ?? repliesInfo?.allCount;
  const lastPageReplyCount = lastPage?.replies?.length || 0;
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
  return {
    data: {
      allCount,
      replies: list,
      root: firstPage?.root ? getReplyItem(firstPage.root) : (repliesInfo?.rootComment ?? null),
    },
    isLoading,
    update: () => {
      if (isLoading || isValidating || isReachingEnd || error) {
        return;
      }
      setSize(size + 1);
    },
    isValidating,
    isLimited,
    isReachingEnd,
    error,
  };
}
