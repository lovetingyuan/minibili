import React from 'react'
import useSWR from 'swr'
import { z } from 'zod'
import { ReplyResponseSchema } from './dynamic-comments.schema'

export type ReplyResponse = z.infer<typeof ReplyResponseSchema>

const getReplies = (res1: ReplyResponse, res2: ReplyResponse) => {
  const replies = res1.replies
    .concat(res2.replies)
    .filter(v => !v.invisible)
    .map(item => {
      return {
        message: item.content.message,
        name: item.member.uname,
        id: item.rpid_str,
        mid: item.member.mid,
        upLike: item.up_action.like,
        top: false,
        like: item.like,
        replies:
          item.replies?.map(v => {
            return {
              message: v.content.message,
              name: v.member.uname,
              id: v.rpid_str,
              mid: v.mid,
              upLike: v.up_action.like,
              like: v.like,
            }
          }) || [],
      }
    })
  if (res1.top.upper) {
    const item = res1.top.upper
    replies.unshift({
      message: item.content.message,
      name: item.member.uname,
      id: item.rpid_str,
      mid: item.member.mid,
      upLike: item.up_action.like,
      like: item.like,
      top: true,
      replies:
        item.replies?.map(v => {
          return {
            message: v.content.message,
            name: v.member.uname,
            id: v.rpid_str,
            mid: v.mid,
            upLike: v.up_action.like,
            like: v.like,
          }
        }) || [],
    })
  }
  return replies
}

export type ReplyItem = ReturnType<typeof getReplies>[0]

// https://api.bilibili.com/x/v2/reply/main?csrf=dec0b143f0b4817a39b305dca99a195c&mode=3&next=4&oid=259736997&plat=1&type=1
export function useDynamicComments(oid: string | number, type: number) {
  // console.log(object);
  const {
    data: res1,
    error: error1,
    // isValidating,
    isLoading,
  } = useSWR<ReplyResponse>(() => {
    return `/x/v2/reply/main?type=${type}&next=1&oid=${oid}`
  })
  const {
    data: res2,
    error: error2,
    isLoading: isLoading2,
  } = useSWR<ReplyResponse>(() => {
    return `/x/v2/reply/main?type=${type}&next=2&oid=${oid}`
  })
  const replies: ReplyItem[] = React.useMemo(() => {
    if (
      res1 &&
      res2 &&
      Array.isArray(res1?.replies) &&
      Array.isArray(res2?.replies)
    ) {
      return getReplies(res1, res2)
    }
    return []
  }, [res1, res2])
  return {
    data: replies,
    isLoading: isLoading || isLoading2,
    error: error1 || error2,
  }
}
