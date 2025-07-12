import useSWRInfinite from 'swr/infinite'
import type { z } from 'zod'

import { useStore } from '@/store'

import { parseCommentMessage } from './comments'
import type { ReplyResItem, ReplyResponseSchema } from './replies.schema'
import fetcher from './fetcher'

type ReplyResponse = z.infer<typeof ReplyResponseSchema>

const getReplyItem = (reply: ReplyResItem) => {
  return {
    message: parseCommentMessage(reply.content),
    name: reply.member.uname,
    mid: reply.member.mid,
    face: reply.member.avatar,
    sign: reply.member.sign,
    id: reply.rpid_str,
    oid: reply.oid,
    root: reply.root,
    rcount: reply.rcount,
    upLike: reply.up_action.like,
    moreText: reply.reply_control.sub_reply_entry_text,
    location: reply.reply_control.location,
    time: reply.reply_control.time_desc,
    like: reply.like,
    sex: reply.member.sex,
    type: reply.type,
    replies: [],
    top: false,
    images: [],
  }
}

export type ReplyItemType = ReturnType<typeof getReplyItem>

export function useReplies() {
  const { repliesInfo } = useStore()
  const { data, error, size, setSize, isValidating, isLoading } =
    useSWRInfinite<ReplyResponse>(
      (index) => {
        return repliesInfo
          ? `/x/v2/reply/reply?oid=${repliesInfo.oid}&type=${repliesInfo.type}&root=${repliesInfo.root}&pn=${index + 1}&ps=20`
          : null
      },
      fetcher,
      {
        revalidateFirstPage: false,
      },
    )
  // const isLoadingMore =
  //   isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined')
  const isEmpty = data?.[0]?.replies.length === 0
  const isReachingEnd =
    isEmpty || (data && data[data.length - 1]?.replies.length === 0)
  // const isRefreshing = isValidating && data && data.length === size
  // const uniqueMap: Record<string, boolean> = {}
  const list =
    data?.reduce((a, b) => {
      return a.concat(b.replies.map(getReplyItem))
    }, [] as ReplyItemType[]) || []
  // const replies: ReplyItemType[] = []
  // for (const r of list) {
  //   if (!uniqueMap[r.id]) {
  //     uniqueMap[r.id] = true
  //     replies.push(r)
  //   }
  // }
  return {
    data: {
      allCount: data?.[0]?.page.count,
      replies: list,
      root: data?.[0].root ? getReplyItem(data[0].root) : null,
    },
    isLoading,
    update: () => {
      if (isReachingEnd) {
        return
      }
      setSize(size + 1)
    },
    isValidating,
    error,
  }
}
