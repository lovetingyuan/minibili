import request from './fetcher'
import useSWR from 'swr'

import store, { useStore } from '../store'
import PQueue from 'p-queue'
import {
  AdditionalTypeEnum,
  DynamicForwardItem,
  DynamicItemBaseType,
  DynamicItemResponse,
  DynamicListResponse,
  DynamicUnknownItem,
  ForwardOtherDynamicTypeEnum,
  MajorTypeEnum,
} from './dynamic-items.schema'
import useSWRInfinite from 'swr/infinite'
import { reportUnknownDynamicItem } from '../utils/report'
import { DynamicTypeEnum, OtherDynamicTypeEnum } from './dynamic-items.type'

export type DynamicItem = ReturnType<typeof getDynamicItem>

export type DynamicType = keyof typeof DynamicTypeEnum
export type DynamicItemType<T extends DynamicType> = Extract<
  DynamicItem,
  { type: T }
>

const getCommon = (item: DynamicItemBaseType) => {
  return {
    id: item.id_str,
    // type: item.type,
    face: item.modules?.module_author.face,
    date: item.modules?.module_author?.pub_time,
    time: item.modules?.module_author?.pub_ts,
    mid: item.modules?.module_author?.mid,
    name: item.modules?.module_author?.name,
    text: item.modules?.module_dynamic?.desc?.text,
    top: item.modules?.module_tag?.text === '置顶',
    commentId: item.basic.comment_id_str,
    commentType: item.basic.comment_type,
    commentCount: item.modules.module_stat.comment.count,
    likeCount: item.modules.module_stat.like.count,
    forwardCount: item.modules.module_stat.forward.count,
  }
}

const getUnknownItem = (item: DynamicUnknownItem | DynamicForwardItem) => {
  __DEV__ && console.log('unknown', item)
  if (
    item.type in OtherDynamicTypeEnum ||
    (item.type === DynamicTypeEnum.DYNAMIC_TYPE_FORWARD &&
      item.orig.type in ForwardOtherDynamicTypeEnum)
  ) {
    reportUnknownDynamicItem(item)
  }
  return {
    ...getCommon(item),
    type: item.type,
    payload: {
      text: '暂不支持显示',
      type: item.type,
    },
  }
}

const getDynamicItem = (item: DynamicItemResponse) => {
  if (item.type === DynamicTypeEnum.DYNAMIC_TYPE_WORD) {
    const additional = item.modules.module_dynamic.additional
    let text: string = ''
    let image: string = ''
    if (additional) {
      if (additional.type === AdditionalTypeEnum.ADDITIONAL_TYPE_RESERVE) {
        text = [additional?.reserve?.title, additional?.reserve?.desc1?.text]
          .filter(Boolean)
          .join('\n')
      } else if (additional.type === AdditionalTypeEnum.ADDITIONAL_TYPE_UGC) {
        text = additional.ugc.title
        image = additional.ugc.cover
      }
    }
    return {
      ...getCommon(item),
      type: item.type,
      payload: {
        text,
        image,
      },
    }
  }
  if (item.type === DynamicTypeEnum.DYNAMIC_TYPE_AV) {
    const video = item.modules.module_dynamic.major.archive
    return {
      ...getCommon(item),
      type: DynamicTypeEnum.DYNAMIC_TYPE_AV,
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
  if (item.type === DynamicTypeEnum.DYNAMIC_TYPE_DRAW) {
    let text = ''
    const additional = item.modules.module_dynamic.additional
    if (additional && 'reserve' in additional) {
      text = [additional?.reserve?.title, additional?.reserve?.desc1?.text]
        .filter(Boolean)
        .join('\n')
    }
    return {
      ...getCommon(item),
      type: item.type,
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
  if (item.type === DynamicTypeEnum.DYNAMIC_TYPE_ARTICLE) {
    const { article } = item.modules.module_dynamic.major
    return {
      ...getCommon(item),
      type: item.type,
      payload: {
        title: article.title,
        text: article.desc,
        cover: article.covers[0],
        url: 'https:' + article.jump_url,
      },
    }
  }
  if (item.type === DynamicTypeEnum.DYNAMIC_TYPE_LIVE_RCMD) {
    return {
      ...getCommon(item),
      type: item.type,
      payload: {
        name: item.modules.module_author.name, // + '正在直播',
        mid: item.modules.module_author.mid,
      },
    }
  }
  if (item.type === DynamicTypeEnum.DYNAMIC_TYPE_FORWARD) {
    if (item.orig.type === DynamicTypeEnum.DYNAMIC_TYPE_AV) {
      const forward = item.orig.modules.module_dynamic
      return {
        ...getCommon(item),
        type: DynamicTypeEnum.DYNAMIC_TYPE_FORWARD,
        payload: {
          type: MajorTypeEnum.MAJOR_TYPE_ARCHIVE,
          text: forward.desc?.text,
          cover: forward.major?.archive.cover,
          title: forward.major?.archive.title,
        },
      }
    }
    if (item.orig.type === DynamicTypeEnum.DYNAMIC_TYPE_WORD) {
      const additional = item.orig.modules.module_dynamic.additional
      const text = [item.orig.modules.module_dynamic.desc?.text]
      // let additionalText = ''/
      if (additional) {
        if (additional.type === AdditionalTypeEnum.ADDITIONAL_TYPE_RESERVE) {
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
        type: DynamicTypeEnum.DYNAMIC_TYPE_FORWARD,
        payload: {
          type: MajorTypeEnum.MAJOR_TYPE_WORD,
          text: text.filter(Boolean).join('\n'),
        },
      }
    }
    if (item.orig.type === DynamicTypeEnum.DYNAMIC_TYPE_DRAW) {
      const forward = item.orig.modules.module_dynamic
      return {
        ...getCommon(item),
        type: DynamicTypeEnum.DYNAMIC_TYPE_FORWARD,
        payload: {
          type: MajorTypeEnum.MAJOR_TYPE_DRAW,
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
    if (item.orig.type === DynamicTypeEnum.DYNAMIC_TYPE_ARTICLE) {
      const forward = item.orig.modules.module_dynamic
      return {
        ...getCommon(item),
        type: DynamicTypeEnum.DYNAMIC_TYPE_FORWARD,
        payload: {
          type: MajorTypeEnum.MAJOR_TYPE_ARTICLE,
          text: forward.major.article.desc,
          title: forward.major.article.title,
          cover: forward.major.article.covers[0],
          url: forward.major.article.jump_url,
        },
      }
    }
    if (item.orig.type === DynamicTypeEnum.DYNAMIC_TYPE_LIVE) {
      const forward = item.orig.modules.module_dynamic
      return {
        ...getCommon(item),
        type: DynamicTypeEnum.DYNAMIC_TYPE_FORWARD,
        payload: {
          type: MajorTypeEnum.MAJOR_TYPE_LIVE,
          text: forward.desc?.text,
          title:
            forward.major.live.title + '\n' + forward.major.live.badge.text,
          cover: forward.major.live.cover,
        },
      }
    }
    if (item.orig.type === DynamicTypeEnum.DYNAMIC_TYPE_NONE) {
      return {
        ...getCommon(item),
        type: DynamicTypeEnum.DYNAMIC_TYPE_FORWARD,
        payload: {
          type: MajorTypeEnum.MAJOR_TYPE_NONE,
          text: item.orig.modules.module_dynamic.major.none.tips,
        },
      }
    }
    return getUnknownItem(item)
  }
  return getUnknownItem(item)
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
