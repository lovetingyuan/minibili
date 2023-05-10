import request from './fetcher'
import useSWR from 'swr'

import store, { useStore } from '../store'
import PQueue from 'p-queue'
import {
  DynamicForwardItem,
  DynamicItemBaseType,
  DynamicItemResponse,
  DynamicListResponse,
  DynamicUnknownItem,
} from './dynamic-items.schema'
import useSWRInfinite from 'swr/infinite'
import { reportUnknownDynamicItem } from '../utils/report'
import {
  DynamicTypes,
  // DynamicTypes,
  HandledAdditionalTypeEnum,
  HandledDynamicTypeEnum,
  HandledForwardTypeEnum,
  // MajorTypeEnum,
  OtherDynamicTypeEnum,
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
export type DynamicItem = RemoveUndef<ReturnType<typeof getDynamicItem>>
// export type DynamicType = keyof typeof DynamicTypes
export type DynamicItemType<
  T extends keyof typeof DynamicTypes = keyof typeof DynamicTypes,
> = Extract<DynamicItem, { type: T }>

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
    text: dynamic?.desc?.text,
    top: tag?.text === '置顶',
    commentId: item.basic.comment_id_str,
    commentType: item.basic.comment_type,
    commentCount: stat.comment.count,
    likeCount: stat.like.count,
    forwardCount: stat.forward.count,
  }
}

const getUnknownDynamicItem = (item: DynamicUnknownItem) => {
  __DEV__ && console.log('unknown', item)
  if (item.type in OtherDynamicTypeEnum) {
    reportUnknownDynamicItem(item)
  }
  return {
    ...getCommon(item),
    type: item.type as OtherDynamicTypeEnum,
    payload: {
      text: '暂不支持显示',
      type: item.type as OtherDynamicTypeEnum,
    },
  }
}

const getUnknownForwardItem = (item: DynamicForwardItem) => {
  __DEV__ && console.log('unknown', item)
  if (
    item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_FORWARD &&
    item.orig.type in OtherForwardTypeEnum
  ) {
    reportUnknownDynamicItem(item)
  }
  return {
    ...getCommon(item),
    type: HandledDynamicTypeEnum.DYNAMIC_TYPE_FORWARD as const,
    payload: {
      text: '暂不支持显示',
      type: item.type as unknown as OtherForwardTypeEnum,
    },
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
        // date:
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
  if (item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_FORWARD) {
    const type = HandledDynamicTypeEnum.DYNAMIC_TYPE_FORWARD as const
    if (item.orig.type === HandledForwardTypeEnum.DYNAMIC_TYPE_AV) {
      const forward = item.orig.modules.module_dynamic
      return {
        ...getCommon(item),
        type: type,
        payload: {
          type: HandledForwardTypeEnum.DYNAMIC_TYPE_AV as const,
          text: forward.desc?.text,
          cover: forward.major?.archive.cover,
          title: forward.major?.archive.title,
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
          type: HandledForwardTypeEnum.DYNAMIC_TYPE_MUSIC as const,
          title,
          label,
          cover,
          url: jump_url,
        },
      }
    }
    return getUnknownForwardItem(item)
  }
  return getUnknownDynamicItem(item)
}

const fetcher2 = (url: string) => {
  __DEV__ && console.log('fetch dynamic items: ' + url)
  return request<DynamicListResponse>(url) // .then(res => res.items)
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
      fetcher2,
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

const queue = new PQueue({ concurrency: 5 })

export function useHasUpdate(mid: number | string) {
  const delay = mid.toString().slice(0, 5)
  const { data, isLoading } = useSWR<any>(
    `/x/polymer/web-dynamic/v1/feed/space?offset=&host_mid=${mid}&timezone_offset=-480`,
    (url: string) => {
      return queue.add(() => request(url))
    },
    {
      refreshInterval: 5 * 60 * 1000 + Number(delay),
    },
  )
  const { $latestUpdateIds, checkingUpdateMap } = useStore()

  if (isLoading) {
    store.checkingUpdateMap[mid] = true
  } else if (checkingUpdateMap[mid]) {
    store.checkingUpdateMap[mid] = false
  }
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
      store.$latestUpdateIds[mid] = latestId
    } else if ($latestUpdateIds[mid] !== latestId) {
      return latestId
    }
  }
  return ''
}
