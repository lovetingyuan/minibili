import request from './fetcher'
import useSWR from 'swr'
import React from 'react'
import store, { setStore, useStore } from '../store'
import PQueue from 'p-queue'
import {
  DynamicItemBaseType,
  DynamicItemResponse,
  DynamicListResponse,
} from './dynamic-items.schema'
import useSWRInfinite from 'swr/infinite'
import { reportUnknownDynamicItem } from '../utils/report'
import {
  DynamicTypes,
  HandledAdditionalTypeEnum,
  HandledDynamicTypeEnum,
  HandledForwardTypeEnum,
  OtherForwardTypeEnum,
} from './dynamic-items.type'

type OmitUndef<T> = {
  [K in keyof T as T[K] extends undefined ? never : K]: T[K]
}
type RemoveUndef<T> = T extends { type: string }
  ? {
      [K in keyof T]: K extends 'payload' ? OmitUndef<T[K]> : T[K]
    }
  : never
export type DynamicItemAllType = RemoveUndef<ReturnType<typeof getDynamicItem>>
// export type DynamicType = keyof typeof DynamicTypes
export type DynamicItemType<T extends keyof typeof DynamicTypes> = Extract<
  DynamicItemAllType,
  { type: T }
>

const getCommon = (item: DynamicItemBaseType) => {
  const {
    module_author: author,
    module_stat: stat,
    module_dynamic: dynamic,
    module_tag: tag,
  } = item.modules
  return {
    id: item.id_str,
    // type: item.type,
    face: author.face,
    date: author.pub_time,
    time: author.pub_ts,
    mid: author.mid,
    name: author.name,
    text: dynamic.desc?.text,
    richTexts: dynamic.desc?.rich_text_nodes,
    topic: dynamic.topic,
    top: tag?.text === '置顶',
    commentId: item.basic.comment_id_str,
    commentType: item.basic.comment_type,
    commentCount: stat.comment.count,
    likeCount: stat.like.count,
    forwardCount: stat.forward.count,
  }
}

const getDynamicItem = (item: DynamicItemResponse) => {
  if (item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_WORD) {
    const additional = item.modules.module_dynamic.additional
    let text: string = ''
    let image: string = ''
    if (additional) {
      if (
        additional.type === HandledAdditionalTypeEnum.ADDITIONAL_TYPE_RESERVE
      ) {
        text = [additional?.reserve?.title, additional?.reserve?.desc1?.text]
          .filter(Boolean)
          .join('\n')
      } else if (
        additional.type === HandledAdditionalTypeEnum.ADDITIONAL_TYPE_UGC
      ) {
        text = additional.ugc.title
        image = additional.ugc.cover
      }
    }
    return {
      ...getCommon(item),
      type: HandledDynamicTypeEnum.DYNAMIC_TYPE_WORD as const,
      payload: {
        text,
        image,
      },
    }
  }
  if (item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_AV) {
    const video = item.modules.module_dynamic.major.archive
    return {
      ...getCommon(item),
      type: HandledDynamicTypeEnum.DYNAMIC_TYPE_AV as const,
      payload: {
        cover: video.cover,
        title: video.title,
        play: video.stat.play,
        bvid: video.bvid,
        aid: video.aid,
        duration: video.duration_text,
        desc: video.desc,
      },
    }
  }
  if (item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_DRAW) {
    let text = ''
    const additional = item.modules.module_dynamic.additional
    if (additional && 'reserve' in additional) {
      text = [additional?.reserve?.title, additional?.reserve?.desc1?.text]
        .filter(Boolean)
        .join('\n')
    }
    return {
      ...getCommon(item),
      type: HandledDynamicTypeEnum.DYNAMIC_TYPE_DRAW as const,
      payload: {
        text,
        images: item.modules?.module_dynamic?.major?.draw?.items?.map(v => {
          return {
            src: v.src,
            width: v.width,
            height: v.height,
            ratio: v.width / v.height,
          }
        }),
      },
    }
  }
  if (item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_ARTICLE) {
    const { article } = item.modules.module_dynamic.major
    return {
      ...getCommon(item),
      type: HandledDynamicTypeEnum.DYNAMIC_TYPE_ARTICLE as const,
      payload: {
        title: article.title,
        text: article.desc,
        cover: article.covers[0],
        url: 'https:' + article.jump_url,
      },
    }
  }
  if (item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_LIVE_RCMD) {
    return {
      ...getCommon(item),
      type: HandledDynamicTypeEnum.DYNAMIC_TYPE_LIVE_RCMD as const,
      payload: {
        name: item.modules.module_author.name, // + '正在直播',
        mid: item.modules.module_author.mid,
      },
    }
  }
  if (item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_MUSIC) {
    return {
      ...getCommon(item),
      type: HandledDynamicTypeEnum.DYNAMIC_TYPE_MUSIC as const,
      payload: {
        title: item.modules.module_dynamic.major.music.title,
        label: item.modules.module_dynamic.major.music.label,
        cover: item.modules.module_dynamic.major.music.cover,
        url: item.modules.module_dynamic.major.music.jump_url,
      },
    }
  }
  if (item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_PGC) {
    const { pgc } = item.modules.module_dynamic.major
    return {
      ...getCommon(item),
      type: HandledDynamicTypeEnum.DYNAMIC_TYPE_PGC as const,
      payload: {
        title: item.modules.module_author.name,
        cover: pgc.cover,
        text: `${pgc.badge.text}: ${pgc.title} (${pgc.stat.play}播放)`,
      },
    }
  }
  if (item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_COMMON_SQUARE) {
    const { common } = item.modules.module_dynamic.major
    const label = common.badge.text || common.label
    return {
      ...getCommon(item),
      type: HandledDynamicTypeEnum.DYNAMIC_TYPE_COMMON_SQUARE as const,
      payload: {
        title: common.title,
        cover: common.cover,
        text: `${label ? label + ': ' : ''}${common.desc}`,
      },
    }
  }
  if (item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_FORWARD) {
    const type = HandledDynamicTypeEnum.DYNAMIC_TYPE_FORWARD as const
    const getForwardUp = () => {
      const author = item.orig.modules.module_author
      const richTexts = item.orig.modules.module_dynamic.desc?.rich_text_nodes
      return {
        name: author.name,
        face: author.face,
        richTexts,
      }
    }
    if (item.orig.type === HandledForwardTypeEnum.DYNAMIC_TYPE_AV) {
      const forward = item.orig.modules.module_dynamic
      return {
        ...getCommon(item),
        type: type,
        payload: {
          ...getForwardUp(),
          type: HandledForwardTypeEnum.DYNAMIC_TYPE_AV as const,
          text: forward.desc?.text,
          cover: forward.major?.archive.cover,
          title: forward.major?.archive.title,
          play: forward.major.archive.stat.play,
        },
      }
    }
    if (item.orig.type === HandledForwardTypeEnum.DYNAMIC_TYPE_WORD) {
      const additional = item.orig.modules.module_dynamic.additional
      const text = [item.orig.modules.module_dynamic.desc?.text]
      // let additionalText = ''/
      if (additional) {
        if (
          additional.type === HandledAdditionalTypeEnum.ADDITIONAL_TYPE_RESERVE
        ) {
          text.push(
            ...[
              additional.reserve.title || '',
              additional.reserve.desc1?.text || '',
              additional.reserve.desc2?.text || '',
            ],
          )
        }
      }
      return {
        ...getCommon(item),
        type: type,
        payload: {
          ...getForwardUp(),
          type: HandledForwardTypeEnum.DYNAMIC_TYPE_WORD as const,
          text: text.filter(Boolean).join('\n'),
        },
      }
    }
    if (item.orig.type === HandledForwardTypeEnum.DYNAMIC_TYPE_DRAW) {
      const forward = item.orig.modules.module_dynamic
      return {
        ...getCommon(item),
        type: type,
        payload: {
          ...getForwardUp(),
          type: HandledForwardTypeEnum.DYNAMIC_TYPE_DRAW as const,
          text: forward.desc?.text,
          images: forward.major.draw.items.map(v => {
            return {
              ratio: v.width / v.height,
              src: v.src,
              width: v.width,
              height: v.height,
            }
          }),
          // text2: [
          //   forward.additional?.reserve?.title,
          //   forward.additional?.reserve?.desc1?.text,
          // ]
          //   .filter(Boolean)
          //   .join('\n'),
        },
      }
    }
    if (item.orig.type === HandledForwardTypeEnum.DYNAMIC_TYPE_ARTICLE) {
      const forward = item.orig.modules.module_dynamic
      return {
        ...getCommon(item),
        type: type,
        payload: {
          ...getForwardUp(),
          type: HandledForwardTypeEnum.DYNAMIC_TYPE_ARTICLE as const,
          text: forward.major.article.desc,
          title: forward.major.article.title,
          cover: forward.major.article.covers[0],
          url: forward.major.article.jump_url,
        },
      }
    }
    if (item.orig.type === HandledForwardTypeEnum.DYNAMIC_TYPE_LIVE) {
      const forward = item.orig.modules.module_dynamic
      return {
        ...getCommon(item),
        type: type,
        payload: {
          ...getForwardUp(),
          type: HandledForwardTypeEnum.DYNAMIC_TYPE_LIVE as const,
          text: forward.desc?.text,
          title:
            forward.major.live.title + '\n' + forward.major.live.badge.text,
          cover: forward.major.live.cover,
        },
      }
    }
    if (item.orig.type === HandledForwardTypeEnum.DYNAMIC_TYPE_NONE) {
      return {
        ...getCommon(item),
        type: type,
        payload: {
          ...getForwardUp(),
          type: HandledForwardTypeEnum.DYNAMIC_TYPE_NONE as const,
          text: item.orig.modules.module_dynamic.major.none.tips,
        },
      }
    }
    if (item.orig.type === HandledForwardTypeEnum.DYNAMIC_TYPE_MUSIC) {
      const { title, label, jump_url, cover } =
        item.orig.modules.module_dynamic.major.music
      return {
        ...getCommon(item),
        type: type,
        payload: {
          ...getForwardUp(),
          type: HandledForwardTypeEnum.DYNAMIC_TYPE_MUSIC as const,
          title,
          label,
          cover,
          url: jump_url,
        },
      }
    }
    if (item.orig.type === HandledForwardTypeEnum.DYNAMIC_TYPE_PGC) {
      const { pgc } = item.orig.modules.module_dynamic.major
      const { name } = item.orig.modules.module_author
      return {
        ...getCommon(item),
        type: type,
        payload: {
          ...getForwardUp(),
          type: HandledForwardTypeEnum.DYNAMIC_TYPE_PGC as const,
          title: name,
          cover: pgc.cover,
          text: `${pgc.badge.text}: ${pgc.title} (${pgc.stat.play}播放)`,
        },
      }
    }
    reportUnknownDynamicItem(item)
    return {
      ...getCommon(item),
      type: HandledDynamicTypeEnum.DYNAMIC_TYPE_FORWARD as const,
      payload: {
        ...getForwardUp(),
        text: '暂不支持显示',
        type: item.type as unknown as OtherForwardTypeEnum,
      },
    }
  }
  reportUnknownDynamicItem(item)
  return {
    ...getCommon(item),
    type: item.type,
    payload: {
      text: '暂不支持显示',
      type: item.type,
    },
  }
}

export function useDynamicItems(mid: string | number) {
  const { data, mutate, size, setSize, isValidating, isLoading, error } =
    useSWRInfinite<DynamicListResponse>(
      (offset, response) => {
        if (response && (!response.has_more || !response.items.length)) {
          return null
        }
        if (!offset) {
          return `/x/polymer/web-dynamic/v1/feed/space?offset=&host_mid=${mid}&timezone_offset=-480`
        }
        return `/x/polymer/web-dynamic/v1/feed/space?offset=${response.offset}&host_mid=${mid}&timezone_offset=-480`
      },
      request,
      {
        revalidateFirstPage: false,
        revalidateAll: false,
      },
    )

  const dynamicItems: DynamicListResponse['items'] =
    data?.reduce((a, b) => {
      return a.concat(b.items)
    }, [] as DynamicListResponse['items']) || []

  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined')
  const isEmpty = data?.[0]?.items.length === 0
  const isReachingEnd = isEmpty || (data && !data[data.length - 1]?.has_more)
  const isRefreshing = isValidating && !!data && data.length === size
  return {
    list: dynamicItems.map(getDynamicItem),
    page: size,
    setSize,
    error,
    isRefreshing,
    isReachingEnd,
    loading: isLoadingMore,
    refresh: mutate,
  }
}

const queue = new PQueue({ concurrency: 50 })

export function useHasUpdate(mid: number | string) {
  const delay = mid.toString().slice(0, 5)
  const { data, isLoading } = useSWR<any>(
    `/x/polymer/web-dynamic/v1/feed/space?offset=&host_mid=${mid}&timezone_offset=-480`,
    (url: string) => {
      return queue.add(() => request(url))
    },
    {
      refreshInterval: 6 * 60 * 1000 + Number(delay),
    },
  )
  const { $latestUpdateIds } = useStore()
  React.useEffect(() => {
    store.checkingUpUpdateMap[mid] = isLoading
  }, [mid, isLoading])

  let latestTime = 0
  let latestId = ''
  if (data?.items) {
    data.items.forEach((item: any) => {
      const pubTime = item.modules?.module_author?.pub_ts
      if (pubTime > latestTime) {
        latestTime = pubTime
        latestId = item.id_str
      }
    })
    if (!$latestUpdateIds[mid]) {
      setStore(store => {
        store.$latestUpdateIds[mid] = latestId
      })
    } else if ($latestUpdateIds[mid] !== latestId) {
      return latestId
    }
  }
  return ''
}
