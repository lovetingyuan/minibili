import React from 'react'
import useSWR from 'swr'
import useSWRInfinite from 'swr/infinite'
import type { z } from 'zod'

import type { ReplyResItem, ReplyResponseSchema } from './comments.schema'
import request from './fetcher'

type ReplyResponse = z.infer<typeof ReplyResponseSchema>

const urlReg = /(https?:\/\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]+)/

const parseMessage = (content: ReplyResItem['content']) => {
  let keys: string[] = []
  let message = content.message
  const emojiMap: Record<
    string,
    {
      id: number
      url: string
      text: string
    }
  > = {}
  const atMap: Record<string, { mid: number; name: string }> = {}
  if (content.emote) {
    Object.keys(content.emote).forEach(emoji => {
      const id = 'emoji' + Math.random().toString().substring(2)
      emojiMap[id] = content.emote![emoji]
      message = message.replaceAll(emoji, id)
      keys.push(id)
    })
  }
  if (content.at_name_to_mid) {
    Object.keys(content.at_name_to_mid).forEach(name => {
      const id = '@' + Math.random().toString().substring(2)
      atMap[id] = {
        mid: content.at_name_to_mid![name],
        name: '@' + name,
      }
      message = message.replaceAll('@' + name, id)
      keys.push(id)
    })
  }
  if (content.jump_url) {
    Object.keys(content.jump_url).forEach(bvid => {
      if (bvid.startsWith('BV')) {
        keys.push(bvid)
      }
    })
  }
  if (content.vote) {
    keys.push(`{vote:${content.vote.id}}`)
  }
  keys = keys.filter(Boolean)
  if (keys.length) {
    const reg = new RegExp(`(${keys.join('|')})`)
    return message
      .split(reg)
      .map((part, i) => {
        if (i % 2) {
          if (part[0] === '@' && atMap[part]) {
            return {
              type: 'at' as const,
              text: atMap[part].name,
              mid: atMap[part].mid,
            }
          }

          if (part.startsWith('{vote:') && part.endsWith('}')) {
            return {
              type: 'vote' as const,
              text: content.vote!.title,
              url: content.vote!.url,
            }
          }
          if (part.startsWith('emoji')) {
            return {
              type: 'emoji' as const,
              url: emojiMap[part].url,
            }
          }
          if (content.jump_url && part in content.jump_url) {
            return {
              type: 'av' as const,
              text: content.jump_url[part].title,
              url: 'https://b23.tv/' + part,
            }
          }
        }
        if (!part) {
          return null
        }
        return part.split(urlReg).map((part2, j) => {
          return j % 2
            ? {
                type: 'url' as const,
                url: part2,
              }
            : {
                type: 'text' as const,
                text: part2,
              }
        })
      })
      .filter(Boolean)
      .flat()
  }
  return content.message.split(urlReg).map((part2, j) => {
    return j % 2
      ? {
          type: 'url' as const,
          url: part2,
        }
      : {
          type: 'text' as const,
          text: part2,
        }
  })
}
export type MessageContent = ReturnType<typeof parseMessage>

const getReplies = (res1: ReplyResponse, type: number) => {
  const replies = (res1.replies || [])
    .filter(v => !v.invisible)
    .map(item => {
      return {
        message: parseMessage(item.content),
        images: item.content.pictures?.map(img => {
          return {
            src: img.img_src,
            width: img.img_width,
            height: img.img_height,
            ratio: img.img_width / img.img_height,
          }
        }),
        name: item.member.uname,
        mid: item.member.mid,
        face: item.member.avatar,
        sign: item.member.sign,
        id: item.rpid_str,
        oid: item.oid,
        root: item.root,
        rcount: item.rcount,
        upLike: item.up_action.like,
        moreText: item.reply_control.sub_reply_entry_text,
        location: item.reply_control.location,
        top: false,
        like: item.like,
        sex: item.member.sex,
        type,
        replies:
          item.replies?.map(v => {
            return {
              message: parseMessage(v.content),
              name: v.member.uname,
              face: v.member.avatar,
              sex: v.member.sex,
              sign: v.member.sign,
              id: v.rpid_str,
              mid: v.mid,
              oid: v.oid,
              location: v.reply_control.location,
              root: v.root,
              root_str: v.root_str,
              upLike: v.up_action.like,
              like: v.like,
            }
          }) || [],
      }
    })
  if (res1?.top?.upper) {
    const item = res1.top.upper
    replies.unshift({
      message: parseMessage(item.content),
      images: item.content.pictures?.map(img => {
        return {
          src: img.img_src,
          width: img.img_width,
          height: img.img_height,
          ratio: img.img_width / img.img_height,
        }
      }),
      name: item.member.uname,
      face: item.member.avatar,
      id: item.rpid_str,
      sign: item.member.sign,
      oid: item.oid,
      root: item.root,
      rcount: item.rcount,
      moreText: item.reply_control.sub_reply_entry_text,
      location: item.reply_control.location,
      mid: item.member.mid,
      upLike: item.up_action.like,
      like: item.like,
      top: true,
      sex: item.member.sex,
      type,
      replies:
        item.replies?.map(v => {
          return {
            message: parseMessage(v.content),
            name: v.member.uname,
            face: v.member.avatar,
            id: v.rpid_str,
            sign: v.member.sign,
            sex: v.member.sex,
            oid: v.oid,
            location: v.reply_control.location,
            root: v.root,
            root_str: v.root_str,
            mid: v.mid,
            upLike: v.up_action.like,
            like: v.like,
          }
        }) || [],
    })
  }
  return replies
}

export type ReplyItemType = ReturnType<typeof getReplies>[0]

// https://api.bilibili.com/x/v2/reply/main?csrf=dec0b143f0b4817a39b305dca99a195c&mode=3&next=4&oid=259736997&plat=1&type=1
export function useDynamicComments(oid: string | number, type: number) {
  const { data, error, isLoading } = useSWR<ReplyResponse>(() => {
    return oid
      ? `/x/v2/reply/wbi/main?oid=${oid}&type=${type}&mode=3&pn=1&ps=30`
      : null
  }, request)
  const replies: ReplyItemType[] = React.useMemo(() => {
    if (!data) {
      return []
    }
    return getReplies(data, type)
  }, [data, type])
  return {
    data: {
      allCount: data?.cursor.all_count,
      replies,
    },
    isLoading,
    error,
  }
}

export function useComments(oid: string | number, type: number) {
  const { data, error, size, setSize, isValidating, isLoading } =
    useSWRInfinite<ReplyResponse>(
      (index, previousPageData) => {
        const next = previousPageData?.cursor.next ?? 1
        return oid
          ? `/x/v2/reply/wbi/main?oid=${oid}&type=${type}&mode=3&next=${next}&ps=20`
          : null
      },
      {
        revalidateFirstPage: false,
      },
    )
  // const isLoadingMore =
  //   isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined')
  // const isEmpty = data?.[0]?.replies.length === 0
  // const isReachingEnd =
  //   isEmpty || (data && data[data.length - 1]?.replies.length === 0)
  // const isRefreshing = isValidating && data && data.length === size
  const uniqueMap: Record<string, boolean> = {}
  const list =
    data?.reduce((a, b) => {
      return a.concat(getReplies(b, type))
    }, [] as ReplyItemType[]) || []
  const replies: ReplyItemType[] = []
  for (const r of list) {
    if (!uniqueMap[r.id]) {
      uniqueMap[r.id] = true
      replies.push(r)
    }
  }
  return {
    data: {
      allCount: data?.[0]?.cursor.all_count,
      replies,
    },
    isLoading,
    update: () => {
      // if (isReachingEnd) {
      //   return
      // }
      setSize(size + 1)
    },
    isValidating,
    error,
  }
}
