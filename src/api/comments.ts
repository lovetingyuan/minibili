import React from 'react'
import useSWR from 'swr'
import { z } from 'zod'
import { ReplayItem, ReplyResponseSchema } from './comments.schema'

type ReplyResponse = z.infer<typeof ReplyResponseSchema>
const urlReg = /(https?:\/\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]+)/

const parseMessage = (content: ReplayItem['content']) => {
  let keys: string[] = []
  if (content.at_name_to_mid) {
    Object.keys(content.at_name_to_mid).forEach(name => {
      keys.push('@' + name)
    })
  }
  if (content.emote) {
    Object.keys(content.emote).forEach(emoji => {
      keys.push(emoji.replace('[', '\\[').replace(']', '\\]'))
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
    return content.message
      .split(reg)
      .map((part, i) => {
        if (i % 2) {
          if (part[0] === '@') {
            return {
              type: 'at' as const,
              text: part,
              mid: content.at_name_to_mid![part.substring(1)],
            }
          }
          if (part.startsWith('[') && part.endsWith(']')) {
            return {
              type: 'emoji' as const,
              url: content.emote![part].url,
            }
          }
          if (part.startsWith('{vote:') && part.endsWith('}')) {
            return {
              type: 'vote' as const,
              text: content.vote!.title,
              url: content.vote!.url,
            }
          }
          return {
            type: 'av' as const,
            text: content.jump_url![part].title,
            url: 'https://b23.tv/' + part,
          }
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

const getReplies = (res1: ReplyResponse, res2: ReplyResponse) => {
  const replies = res1.replies
    .concat(res2.replies)
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
              upLike: v.up_action.like,
              like: v.like,
            }
          }) || [],
      }
    })
  if (res1.top.upper) {
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
  console.log(22255, res1)
  return {
    data: {
      allCount: res1?.cursor.all_count,
      replies: replies,
    },
    isLoading: isLoading || isLoading2,
    error: error1 || error2,
  }
}
