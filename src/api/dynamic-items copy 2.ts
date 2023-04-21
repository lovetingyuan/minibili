import request from './fetcher'
import useSWR from 'swr'
import { useSnapshot } from 'valtio'
import store from '../store'
import PQueue from 'p-queue'
import { Author } from './dynamic-items.schema'

export type DynamicItem = ReturnType<typeof getDynamicItem>

export const enum DynamicTypeEnum {
  DYNAMIC_TYPE_AV = 'DYNAMIC_TYPE_AV',
  DYNAMIC_TYPE_FORWARD = 'DYNAMIC_TYPE_FORWARD',
  DYNAMIC_TYPE_DRAW = 'DYNAMIC_TYPE_DRAW',
  DYNAMIC_TYPE_WORD = 'DYNAMIC_TYPE_WORD',
  DYNAMIC_TYPE_OTHER = 'DYNAMIC_TYPE_OTHER',
  DYNAMIC_TYPE_NONE = 'DYNAMIC_TYPE_NONE',
  DYNAMIC_TYPE_PGC = 'DYNAMIC_TYPE_PGC',
  DYNAMIC_TYPE_COURSES = 'DYNAMIC_TYPE_COURSES',
  DYNAMIC_TYPE_ARTICLE = 'DYNAMIC_TYPE_ARTICLE',
  DYNAMIC_TYPE_MUSIC = 'DYNAMIC_TYPE_MUSIC',
  DYNAMIC_TYPE_COMMON_SQUARE = 'DYNAMIC_TYPE_COMMON_SQUARE',
  DYNAMIC_TYPE_COMMON_VERTICAL = 'DYNAMIC_TYPE_COMMON_VERTICAL',
  DYNAMIC_TYPE_LIVE = 'DYNAMIC_TYPE_LIVE',
  DYNAMIC_TYPE_MEDIALIST = 'DYNAMIC_TYPE_MEDIALIST',
  DYNAMIC_TYPE_COURSES_SEASON = 'DYNAMIC_TYPE_COURSES_SEASON',
  DYNAMIC_TYPE_COURSES_BATCH = 'DYNAMIC_TYPE_COURSES_BATCH',
  DYNAMIC_TYPE_AD = 'DYNAMIC_TYPE_AD',
  DYNAMIC_TYPE_APPLET = 'DYNAMIC_TYPE_APPLET',
  DYNAMIC_TYPE_SUBSCRIPTION = 'DYNAMIC_TYPE_SUBSCRIPTION',
  DYNAMIC_TYPE_LIVE_RCMD = 'DYNAMIC_TYPE_LIVE_RCMD',
  DYNAMIC_TYPE_BANNER = 'DYNAMIC_TYPE_BANNER',
  DYNAMIC_TYPE_UGC_SEASON = 'DYNAMIC_TYPE_UGC_SEASON',
  DYNAMIC_TYPE_SUBSCRIPTION_NEW = 'DYNAMIC_TYPE_SUBSCRIPTION_NEW',
  // --------------
  DYNAMIC_TYPE_UNKNOWN = 'DYNAMIC_TYPE_UNKNOWN',
}

export type DynamicType = keyof typeof DynamicTypeEnum
export type DynamicItemType<T extends DynamicType> = Extract<
  DynamicItem,
  { type: T }
>
export const enum DynamicMajorTypeEnum {
  MAJOR_TYPE_ARCHIVE = 'MAJOR_TYPE_ARCHIVE',
  MAJOR_TYPE_PGC = 'MAJOR_TYPE_PGC',
  MAJOR_TYPE_COURSES = 'MAJOR_TYPE_COURSES',
  MAJOR_TYPE_DRAW = 'MAJOR_TYPE_DRAW',
  MAJOR_TYPE_ARTICLE = 'MAJOR_TYPE_ARTICLE',
  MAJOR_TYPE_COMMON = 'MAJOR_TYPE_COMMON',
  MAJOR_TYPE_LIVE = 'MAJOR_TYPE_LIVE',
  MAJOR_TYPE_MEDIALIST = 'MAJOR_TYPE_MEDIALIST',
  MAJOR_TYPE_APPLET = 'MAJOR_TYPE_APPLET',
  MAJOR_TYPE_SUBSCRIPTION = 'MAJOR_TYPE_SUBSCRIPTION',
  MAJOR_TYPE_LIVE_RCMD = 'MAJOR_TYPE_LIVE_RCMD',
  MAJOR_TYPE_SUBSCRIPTION_NEW = 'MAJOR_TYPE_SUBSCRIPTION_NEW',
  MAJOR_TYPE_WORD = 'MAJOR_TYPE_WORD',
  MAJOR_TYPE_NONE = 'MAJOR_TYPE_NONE',
}

export const enum DynamicAdditionalTypeEnum {
  ADDITIONAL_TYPE_NONE = 'ADDITIONAL_TYPE_NONE',
  ADDITIONAL_TYPE_PGC = 'ADDITIONAL_TYPE_PGC',
  ADDITIONAL_TYPE_GOODS = 'ADDITIONAL_TYPE_GOODS',
  ADDITIONAL_TYPE_VOTE = 'ADDITIONAL_TYPE_VOTE',
  ADDITIONAL_TYPE_COMMON = 'ADDITIONAL_TYPE_COMMON',
  ADDITIONAL_TYPE_MATCH = 'ADDITIONAL_TYPE_MATCH',
  ADDITIONAL_TYPE_UP_RCMD = 'ADDITIONAL_TYPE_UP_RCMD',
  ADDITIONAL_TYPE_UGC = 'ADDITIONAL_TYPE_UGC',
  ADDITIONAL_TYPE_RESERVE = 'ADDITIONAL_TYPE_RESERVE',
}

interface MajorAV {
  type: DynamicMajorTypeEnum.MAJOR_TYPE_ARCHIVE
  archive: {
    aid: string
    bvid: string
    cover: string
    desc: string
    duration_text: string
    jump_url: string
    stat: { danmaku: string; play: string }
    title: string
    type: number
  }
}

interface MajorDraw {
  type: DynamicMajorTypeEnum.MAJOR_TYPE_DRAW
  draw: {
    id: number
    items: {
      src: string
      width: number
      height: number
      size: number
    }[]
  }
}

interface MajorArticle {
  type: DynamicMajorTypeEnum.MAJOR_TYPE_ARTICLE
  article: {
    covers: string[]
    desc: string
    label: string
    title: string
    jump_url: string
  }
}

interface MajorLive {
  type: DynamicMajorTypeEnum.MAJOR_TYPE_LIVE
  live: {
    cover: string
    title: string
  }
}

interface MajorWord {
  type: DynamicMajorTypeEnum.MAJOR_TYPE_WORD
  desc: {
    text: string
  }
}

interface MajorNone {
  type: DynamicMajorTypeEnum.MAJOR_TYPE_NONE
  none: {
    tips: string
  }
}

export interface DynamicItemResponse<T extends DynamicTypeEnum> {
  type: T
  id_str: string
  visible: boolean
  basic: {
    comment_id_str: string
    comment_type: number
  }
  modules: {
    module_author: Author
    module_dynamic: {
      desc: { text: string } | null
      topic: { name: string; jump_url: string } | null
      major: T extends
        | DynamicTypeEnum.DYNAMIC_TYPE_FORWARD
        | DynamicTypeEnum.DYNAMIC_TYPE_WORD
        ? null
        : T extends DynamicTypeEnum.DYNAMIC_TYPE_AV
        ? MajorAV
        : T extends DynamicTypeEnum.DYNAMIC_TYPE_DRAW
        ? MajorDraw
        : T extends DynamicTypeEnum.DYNAMIC_TYPE_ARTICLE
        ? MajorArticle
        : unknown
      additional?: T extends
        | DynamicTypeEnum.DYNAMIC_TYPE_WORD
        | DynamicTypeEnum.DYNAMIC_TYPE_DRAW
        ?
            | {
                type: DynamicAdditionalTypeEnum.ADDITIONAL_TYPE_RESERVE
                reserve: {
                  title: string
                  desc1?: { text: string }
                  desc2?: { text: string }
                }
              }
            | {
                type: DynamicAdditionalTypeEnum.ADDITIONAL_TYPE_UGC
                ugc: {
                  cover: string
                  title: string
                }
              }
        : unknown
    }
    module_tag?: { text: string }
    module_stat: {
      comment: {
        count: number
        forbidden: boolean
      }
      forward: {
        count: number
        forbidden: boolean
      }
      like: {
        count: number
        forbidden: boolean
        status: boolean
      }
    }
  }
}

export interface DynamicForwardItemResponse<F extends DynamicTypeEnum>
  extends DynamicItemResponse<DynamicTypeEnum.DYNAMIC_TYPE_FORWARD> {
  orig: {
    id_str: string
    basic: {
      comment_id_str: string
      comment_type: number
    }
    type: F
    modules: {
      module_author: Author
      module_dynamic: {
        desc: { text: string } | null
        major: F extends DynamicTypeEnum.DYNAMIC_TYPE_AV
          ? MajorAV
          : F extends DynamicTypeEnum.DYNAMIC_TYPE_DRAW
          ? MajorDraw
          : F extends DynamicTypeEnum.DYNAMIC_TYPE_LIVE
          ? MajorLive
          : F extends DynamicTypeEnum.DYNAMIC_TYPE_WORD
          ? MajorWord
          : F extends DynamicTypeEnum.DYNAMIC_TYPE_ARTICLE
          ? MajorArticle
          : F extends DynamicTypeEnum.DYNAMIC_TYPE_NONE
          ? MajorNone
          : unknown
        additional?: {
          reserve?: {
            title?: string
            desc1?: { text: string }
          }
        }
      }
    }
  }
}

export interface DynamicListResponse {
  has_more: boolean
  offset: string
  update_baseline: string
  update_num: number
  items: (
    | DynamicItemResponse<DynamicTypeEnum>
    | DynamicForwardItemResponse<DynamicTypeEnum>
  )[]
}

const getCommon = (item: DynamicItemResponse<DynamicTypeEnum>) => {
  return {
    id: item.id_str,
    // type: item.type,
    face: item.modules.module_author.face,
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

const getWordItem = (
  item: DynamicItemResponse<DynamicTypeEnum.DYNAMIC_TYPE_WORD>,
) => {
  const additional = item.modules.module_dynamic.additional
  let text: string = ''
  let image: string = ''
  if (additional) {
    if ('reserve' in additional) {
      text = [additional?.reserve?.title, additional?.reserve?.desc1?.text]
        .filter(Boolean)
        .join('\n')
    } else if ('ugc' in additional) {
      text = additional.ugc.title
      image = additional.ugc.cover
    }
  }
  return {
    ...getCommon(item),
    type: DynamicTypeEnum.DYNAMIC_TYPE_WORD as const,
    payload: {
      text,
      image,
    },
  }
}

const getVideoItem = (
  item: DynamicItemResponse<DynamicTypeEnum.DYNAMIC_TYPE_AV>,
) => {
  const video = item.modules.module_dynamic.major.archive
  return {
    ...getCommon(item),
    type: DynamicTypeEnum.DYNAMIC_TYPE_AV as const,
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
const getVideoForwardItem = (
  item: DynamicForwardItemResponse<DynamicTypeEnum.DYNAMIC_TYPE_AV>,
) => {
  const forward = item.orig.modules?.module_dynamic || {}
  const common = getCommon(item)
  return {
    ...common,
    type: DynamicTypeEnum.DYNAMIC_TYPE_FORWARD as const,
    payload: {
      type: DynamicMajorTypeEnum.MAJOR_TYPE_ARCHIVE as const,
      text: forward.desc?.text,
      cover: forward.major?.archive.cover,
      title: forward.major?.archive.title,
    },
  }
}
const getWordForwardItem = (
  item: DynamicForwardItemResponse<DynamicTypeEnum.DYNAMIC_TYPE_WORD>,
) => {
  const forward = item.orig.modules.module_dynamic
  return {
    ...getCommon(item),
    type: DynamicTypeEnum.DYNAMIC_TYPE_FORWARD as const,
    payload: {
      type: DynamicMajorTypeEnum.MAJOR_TYPE_WORD as const,
      text: forward.desc?.text,
    },
  }
}
const getDrawForwardItem = (
  item: DynamicForwardItemResponse<DynamicTypeEnum.DYNAMIC_TYPE_DRAW>,
) => {
  const forward = item.orig.modules.module_dynamic
  return {
    ...getCommon(item),
    type: DynamicTypeEnum.DYNAMIC_TYPE_FORWARD as const,
    payload: {
      type: DynamicMajorTypeEnum.MAJOR_TYPE_DRAW as const,
      text: forward.desc?.text,
      images: forward.major.draw.items.map(v => {
        return {
          ratio: v.width / v.height,
          src: v.src,
          width: v.width,
          height: v.height,
        }
      }),
      text2: [
        forward.additional?.reserve?.title,
        forward.additional?.reserve?.desc1?.text,
      ]
        .filter(Boolean)
        .join('\n'),
    },
  }
}
const getArticleForwardItem = (
  item: DynamicForwardItemResponse<DynamicTypeEnum.DYNAMIC_TYPE_ARTICLE>,
) => {
  const forward = item.orig.modules.module_dynamic
  return {
    ...getCommon(item),
    type: DynamicTypeEnum.DYNAMIC_TYPE_FORWARD as const,
    payload: {
      type: DynamicMajorTypeEnum.MAJOR_TYPE_ARTICLE as const,
      text: forward.major.article.desc,
      title: forward.major.article.title,
      cover: forward.major.article.covers[0],
      url: forward.major.article.jump_url,
    },
  }
}
const getLiveForwardItem = (
  item: DynamicForwardItemResponse<DynamicTypeEnum.DYNAMIC_TYPE_LIVE>,
) => {
  const forward = item.orig.modules.module_dynamic
  return {
    ...getCommon(item),
    type: DynamicTypeEnum.DYNAMIC_TYPE_FORWARD as const,
    payload: {
      type: DynamicMajorTypeEnum.MAJOR_TYPE_LIVE as const,
      title: '直播：' + forward.major?.live.title,
      cover: forward.major?.live.cover,
    },
  }
}
const getNoneForwardItem = (
  item: DynamicForwardItemResponse<DynamicTypeEnum.DYNAMIC_TYPE_NONE>,
) => {
  return {
    ...getCommon(item),
    type: DynamicTypeEnum.DYNAMIC_TYPE_FORWARD as const,
    payload: {
      type: DynamicMajorTypeEnum.MAJOR_TYPE_NONE as const,
      text: item.orig.modules.module_dynamic.major.none.tips,
    },
  }
}

const getDrawItem = (
  item: DynamicItemResponse<DynamicTypeEnum.DYNAMIC_TYPE_DRAW>,
) => {
  let text = ''
  const additional = item.modules.module_dynamic.additional
  if (additional && 'reserve' in additional) {
    text = [additional?.reserve?.title, additional?.reserve?.desc1?.text]
      .filter(Boolean)
      .join('\n')
  }
  return {
    ...getCommon(item),
    type: DynamicTypeEnum.DYNAMIC_TYPE_DRAW as const,
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

const getArticleItem = (
  item: DynamicItemResponse<DynamicTypeEnum.DYNAMIC_TYPE_ARTICLE>,
) => {
  return {
    ...getCommon(item),
    type: DynamicTypeEnum.DYNAMIC_TYPE_ARTICLE as const,
    payload: {
      title: item.modules.module_dynamic.major.article.title,
      text: item.modules.module_dynamic.major.article.desc,
      cover: item.modules.module_dynamic.major.article.covers[0],
      url: 'https:' + item.modules.module_dynamic.major.article.jump_url,
    },
  }
}

const getUnknownItem = (item: DynamicItemResponse<DynamicTypeEnum>) => {
  return {
    ...getCommon(item),
    type: item.type,
    payload: {
      text: '暂不支持显示',
      type: item.type,
    },
  }
}

// const getUnknownForwardItem = (item: DynamicItemResponse<DynamicTypeEnum>) => {
//   return {
//     ...getCommon(item),
//     type: DynamicTypeEnum.DYNAMIC_TYPE_FORWARD as const,
//     payload: {
//       text: '暂不支持显示',
//       type: item.type as DynamicTypeEnum,
//     },
//   }
// }

function isForwardType<T extends DynamicTypeEnum>(
  item: any,
  type: T,
): item is DynamicForwardItemResponse<T> {
  return (
    item?.type === DynamicTypeEnum.DYNAMIC_TYPE_FORWARD &&
    item?.orig?.type === type
  )
}

function isType<T extends DynamicTypeEnum>(
  item: any,
  type: T,
): item is DynamicItemResponse<T> {
  return item.type === type
}

const getDynamicItem = (item: DynamicListResponse['items'][0]) => {
  if (isType(item, DynamicTypeEnum.DYNAMIC_TYPE_WORD)) {
    return getWordItem(item)
  }
  if (isType(item, DynamicTypeEnum.DYNAMIC_TYPE_AV)) {
    return getVideoItem(item)
  }
  if (isType(item, DynamicTypeEnum.DYNAMIC_TYPE_DRAW)) {
    return getDrawItem(item)
  }
  if (isType(item, DynamicTypeEnum.DYNAMIC_TYPE_ARTICLE)) {
    return getArticleItem(item)
  }
  if (isType(item, DynamicTypeEnum.DYNAMIC_TYPE_FORWARD)) {
    if (isForwardType(item, DynamicTypeEnum.DYNAMIC_TYPE_AV)) {
      return getVideoForwardItem(item)
    }
    if (isForwardType(item, DynamicTypeEnum.DYNAMIC_TYPE_WORD)) {
      return getWordForwardItem(item)
    }
    if (isForwardType(item, DynamicTypeEnum.DYNAMIC_TYPE_DRAW)) {
      return getDrawForwardItem(item)
    }
    if (isForwardType(item, DynamicTypeEnum.DYNAMIC_TYPE_ARTICLE)) {
      return getArticleForwardItem(item)
    }
    if (isForwardType(item, DynamicTypeEnum.DYNAMIC_TYPE_LIVE)) {
      return getLiveForwardItem(item)
    }
    if (isForwardType(item, DynamicTypeEnum.DYNAMIC_TYPE_NONE)) {
      return getNoneForwardItem(item)
    }
    return getUnknownItem(item)
  }
  return getUnknownItem(item)
}

export async function getDynamicItems(offset = '', uid: string | number) {
  // https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?offset=&host_mid=1458143131&timezone_offset=-480
  const data = await request<DynamicListResponse>(
    `/x/polymer/web-dynamic/v1/feed/space?offset=${offset}&host_mid=${uid}&timezone_offset=-480`,
  )
  return {
    more: data.has_more,
    offset: data.offset,
    items: data.items.map(getDynamicItem),
  }
}

const queue = new PQueue({ concurrency: 3 })

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
  const { $latestUpdateIds, checkingUpdateMap } = useSnapshot(store)

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
