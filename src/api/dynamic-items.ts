import useSWRInfinite from 'swr/infinite'

import { parseUrl } from '../utils'
import {
  reportUnknownAdditional,
  reportUnknownDynamicItem,
} from '../utils/report'
import type {
  DynamicItemBaseType,
  DynamicItemResponse,
  DynamicListResponse,
  RichTextItem,
} from './dynamic-items.schema'
import {
  type DynamicTypes,
  HandledAdditionalTypeEnum,
  HandledDynamicTypeEnum,
  HandledForwardTypeEnum,
  MajorTypeEnum,
  type OtherForwardTypeEnum,
} from './dynamic-items.type'
import request from './fetcher'

type OmitUndef<T> = {
  [K in keyof T as T[K] extends undefined ? never : K]: T[K]
}
type RemoveUndef<T> = T extends { type: string }
  ? {
      [K in keyof T]: K extends 'payload' ? OmitUndef<T[K]> : T[K]
    }
  : never
export type DynamicItemAllType = RemoveUndef<ReturnType<typeof getDynamicItem>>
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
    desc: dynamic.desc,
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
  if (
    item.modules.module_dynamic.additional?.type &&
    !Object.keys(HandledAdditionalTypeEnum).includes(
      item.modules.module_dynamic.additional.type,
    )
  ) {
    reportUnknownAdditional(item)
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
        danmu: video.stat.danmaku,
      },
    }
  }
  if (item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_WORD) {
    const { additional, major } = item.modules.module_dynamic
    let title = ''
    let texts: RichTextItem[] = []
    let images: { height: number; width: number; src: string }[] = []
    if (major?.type === MajorTypeEnum.MAJOR_TYPE_OPUS) {
      title = major.opus.title
      texts = major.opus.summary.rich_text_nodes
      images = major.opus.pics.map(p => {
        return { width: p.width, height: p.height, src: p.url }
      })
    }
    return {
      ...getCommon(item),
      type: HandledDynamicTypeEnum.DYNAMIC_TYPE_WORD as const,
      payload: {
        additional,
        images,
        title,
        texts,
      },
    }
  }
  if (item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_DRAW) {
    const additional = item.modules.module_dynamic.additional
    return {
      ...getCommon(item),
      type: HandledDynamicTypeEnum.DYNAMIC_TYPE_DRAW as const,
      payload: {
        texts: [],
        title: '',
        additional,
        images:
          item.modules?.module_dynamic?.major?.draw?.items?.map(v => {
            return {
              src: v.src,
              width: v.width,
              height: v.height,
              ratio: v.width / v.height,
            }
          }) || [],
      },
    }
  }
  if (item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_ARTICLE) {
    const { type: t } = item.modules.module_dynamic.major
    if (t === MajorTypeEnum.MAJOR_TYPE_ARTICLE) {
      const { article } = item.modules.module_dynamic.major
      return {
        ...getCommon(item),
        type: HandledDynamicTypeEnum.DYNAMIC_TYPE_ARTICLE as const,
        payload: {
          title: article.title,
          text: article.desc,
          cover: article.covers[0],
          url: parseUrl(article.jump_url),
        },
      }
    }
    const { opus } = item.modules.module_dynamic.major
    return {
      ...getCommon(item),
      type: HandledDynamicTypeEnum.DYNAMIC_TYPE_ARTICLE as const,
      payload: {
        text: opus.summary.text,
        title: opus.title,
        cover: opus.pics?.[0]?.url,
        url: parseUrl(opus.jump_url),
      },
    }
  }
  if (item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_MUSIC) {
    const { music } = item.modules.module_dynamic.major
    return {
      ...getCommon(item),
      type: HandledDynamicTypeEnum.DYNAMIC_TYPE_MUSIC as const,
      payload: {
        title: music.title,
        text: music.label,
        cover: music.cover,
        url: music.jump_url,
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
        url: parseUrl(pgc.jump_url),
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
        url: parseUrl(common.jump_url),
        // badge: common.badge.text,
      },
    }
  }
  if (item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_LIVE_RCMD) {
    return {
      ...getCommon(item),
      type: HandledDynamicTypeEnum.DYNAMIC_TYPE_LIVE_RCMD as const,
      payload: {},
    }
  }
  if (item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_FORWARD) {
    const type = HandledDynamicTypeEnum.DYNAMIC_TYPE_FORWARD as const
    const getForwardCommon = () => {
      const author = item.orig.modules.module_author
      const topic = item.orig.modules.module_dynamic.topic
      const desc = item.orig.modules.module_dynamic.desc
      const additional = item.orig.modules.module_dynamic.additional
      return {
        name: author.name,
        face: author.face,
        id: item.orig.id_str,
        mid: author.mid,
        desc,
        topic,
        additional,
      }
    }
    if (item.orig.type === HandledForwardTypeEnum.DYNAMIC_TYPE_AV) {
      const forward = item.orig.modules.module_dynamic
      return {
        ...getCommon(item),
        type: type,
        payload: {
          ...getForwardCommon(),
          text: '',
          video:
            forward.major.type === MajorTypeEnum.MAJOR_TYPE_NONE
              ? forward.major.none.tips
              : forward.major.archive,
          type: HandledForwardTypeEnum.DYNAMIC_TYPE_AV as const,
        },
      }
    }
    if (item.orig.type === HandledForwardTypeEnum.DYNAMIC_TYPE_WORD) {
      return {
        ...getCommon(item),
        type: type,
        payload: {
          ...getForwardCommon(),
          type: HandledForwardTypeEnum.DYNAMIC_TYPE_WORD as const,
          text: '',
          images: [],
        },
      }
    }
    if (item.orig.type === HandledForwardTypeEnum.DYNAMIC_TYPE_DRAW) {
      const { draw } = item.orig.modules.module_dynamic.major
      return {
        ...getCommon(item),
        type: type,
        payload: {
          ...getForwardCommon(),
          type: HandledForwardTypeEnum.DYNAMIC_TYPE_DRAW as const,
          text: '',
          images:
            draw?.items?.map(v => {
              return {
                ratio: v.width / v.height,
                src: v.src,
                width: v.width,
                height: v.height,
              }
            }) || [],
        },
      }
    }
    if (item.orig.type === HandledForwardTypeEnum.DYNAMIC_TYPE_ARTICLE) {
      if (
        item.orig.modules.module_dynamic.major.type ===
        MajorTypeEnum.MAJOR_TYPE_ARTICLE
      ) {
        const { article } = item.orig.modules.module_dynamic.major
        return {
          ...getCommon(item),
          type,
          payload: {
            ...getForwardCommon(),
            type: HandledForwardTypeEnum.DYNAMIC_TYPE_ARTICLE as const,
            text: article.desc,
            title: article.title,
            cover: article.covers?.[0],
            url: parseUrl(article.jump_url),
          },
        }
      }
      const { opus } = item.orig.modules.module_dynamic.major
      return {
        ...getCommon(item),
        type,
        payload: {
          ...getForwardCommon(),
          type: HandledForwardTypeEnum.DYNAMIC_TYPE_ARTICLE as const,
          text: opus.summary.text,
          title: opus.title,
          cover: opus.pics?.[0]?.url,
          url: parseUrl(opus.jump_url),
        },
      }
    }
    if (item.orig.type === HandledForwardTypeEnum.DYNAMIC_TYPE_LIVE) {
      const { live } = item.orig.modules.module_dynamic.major
      return {
        ...getCommon(item),
        type: type,
        payload: {
          ...getForwardCommon(),
          type: HandledForwardTypeEnum.DYNAMIC_TYPE_LIVE as const,
          title: live.title,
          text:
            live.badge.text + '：' + live.desc_first + '\n' + live.desc_second,
          cover: live.cover,
          url: parseUrl(live.jump_url),
        },
      }
    }
    if (item.orig.type === HandledForwardTypeEnum.DYNAMIC_TYPE_NONE) {
      return {
        ...getCommon(item),
        type: type,
        payload: {
          ...getForwardCommon(),
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
          ...getForwardCommon(),
          type: HandledForwardTypeEnum.DYNAMIC_TYPE_MUSIC as const,
          title,
          text: label,
          cover,
          url: parseUrl(jump_url),
        },
      }
    }
    if (item.orig.type === HandledForwardTypeEnum.DYNAMIC_TYPE_PGC) {
      const { pgc } = item.orig.modules.module_dynamic.major
      return {
        ...getCommon(item),
        type: type,
        payload: {
          ...getForwardCommon(),
          type: HandledForwardTypeEnum.DYNAMIC_TYPE_PGC as const,
          title: pgc.title,
          cover: pgc.cover,
          text: `${pgc.badge.text} (${pgc.stat.play}播放)`,
          url: parseUrl(pgc.jump_url),
        },
      }
    }
    if (item.orig.type === HandledForwardTypeEnum.DYNAMIC_TYPE_PGC_UNION) {
      const { pgc } = item.orig.modules.module_dynamic.major
      return {
        ...getCommon(item),
        type: type,
        payload: {
          ...getForwardCommon(),
          type: HandledForwardTypeEnum.DYNAMIC_TYPE_PGC_UNION as const,
          title: pgc.title,
          cover: pgc.cover,
          text: `${pgc.badge.text} (${pgc.stat.play}播放)`,
          url: parseUrl(pgc.jump_url),
        },
      }
    }
    if (item.orig.type === HandledForwardTypeEnum.DYNAMIC_TYPE_COMMON_SQUARE) {
      const { common } = item.orig.modules.module_dynamic.major
      return {
        ...getCommon(item),
        type: type,
        payload: {
          ...getForwardCommon(),
          type: HandledForwardTypeEnum.DYNAMIC_TYPE_COMMON_SQUARE as const,
          title: common.title,
          cover: common.cover,
          text: `${common.badge.text ? common.badge.text + '：' : ''}${
            common.desc
          }`,
          url: parseUrl(common.jump_url),
          // badge: common.badge.text,
        },
      }
    }
    if (item.orig.type === HandledForwardTypeEnum.DYNAMIC_TYPE_MEDIALIST) {
      const { medialist } = item.orig.modules.module_dynamic.major
      return {
        ...getCommon(item),
        type,
        payload: {
          ...getForwardCommon(),
          type: HandledForwardTypeEnum.DYNAMIC_TYPE_MEDIALIST as const,
          title: medialist.title,
          cover: medialist.cover,
          text: `${medialist.badge.text ? medialist.badge.text + '：' : ''}${
            medialist.sub_title
          }`,
          url: parseUrl(medialist.jump_url),
        },
      }
    }
    if (item.orig.type === HandledForwardTypeEnum.DYNAMIC_TYPE_COURSES_SEASON) {
      const { courses } = item.orig.modules.module_dynamic.major
      return {
        ...getCommon(item),
        type,
        payload: {
          ...getForwardCommon(),
          type: HandledForwardTypeEnum.DYNAMIC_TYPE_COURSES_SEASON as const,
          title: courses.title,
          cover: courses.cover,
          text: `${courses.badge.text ? courses.badge.text + '：' : ''}${
            courses.sub_title
          }\n${courses.desc}`,
          url: parseUrl(courses.jump_url),
        },
      }
    }
    if (item.orig.type === HandledForwardTypeEnum.DYNAMIC_TYPE_LIVE_RCMD) {
      const {
        live_rcmd: { content },
      } = item.orig.modules.module_dynamic.major
      type Content = {
        live_play_info: {
          area_name: string
          cover: string
          link: string
          title: string
          live_status: number
        }
      }
      const { live_play_info } = JSON.parse(content) as Content
      return {
        ...getCommon(item),
        type,
        payload: {
          ...getForwardCommon(),
          type: HandledForwardTypeEnum.DYNAMIC_TYPE_LIVE_RCMD as const,
          title: live_play_info.title,
          cover: live_play_info.cover,
          text: `${live_play_info.area_name + '：'}${
            live_play_info.live_status === 1 ? '正在直播' : '直播结束'
          }`,
          url: parseUrl(live_play_info.link),
        },
      }
    }
    reportUnknownDynamicItem(item)
    return {
      ...getCommon(item),
      type: HandledDynamicTypeEnum.DYNAMIC_TYPE_FORWARD as const,
      payload: {
        ...getForwardCommon(),
        text: '暂不支持显示此动态',
        type: item.type as unknown as OtherForwardTypeEnum,
      },
    }
  }

  reportUnknownDynamicItem(item)
  return {
    ...getCommon(item),
    type: item.type,
    payload: {
      text: '暂不支持显示此动态',
      type: item.type,
    },
  }
}

export function useDynamicItems(mid?: string | number) {
  const { data, mutate, size, setSize, isValidating, isLoading, error } =
    useSWRInfinite<DynamicListResponse>(
      (offset, response) => {
        if (response && (!response.has_more || !response.items.length)) {
          return null
        }
        if (!mid) {
          return null
        }
        // https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?offset=&host_mid=1458143131&timezone_offset=-480&features=itemOpusStyle
        if (!offset) {
          // &features=itemOpusStyle,listOnlyfans,opusBigCover,onlyfansVote
          return `/x/polymer/web-dynamic/v1/feed/space?offset=&host_mid=${mid}`
        }
        return `/x/polymer/web-dynamic/v1/feed/space?offset=${response?.offset ?? ''}&host_mid=${mid}`
      },
      {
        revalidateFirstPage: true,
        errorRetryCount: 3,
        errorRetryInterval: 600,
        dedupingInterval: 60 * 1000,
      },
    )
  // console.log(4444, data)
  const dynamicItems: DynamicListResponse['items'] =
    data?.reduce(
      (a, b) => {
        return a.concat(b.items)
      },
      [] as DynamicListResponse['items'],
    ) || []

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
    isLoading,
    isValidating,
    refresh: mutate,
  }
}

export function checkSingleUpUpdate(mid: string | number) {
  const url = `/x/polymer/web-dynamic/v1/feed/space?offset=&host_mid=${mid}`
  return request<DynamicListResponse>(url)
    .then(data => {
      let latestTime = 0
      let latestId = ''
      if (data?.items) {
        data.items.forEach(item => {
          if (item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_LIVE_RCMD) {
            return
          }
          const pubTime = item.modules?.module_author?.pub_ts
          if (pubTime > latestTime) {
            latestTime = pubTime
            latestId = item.id_str
          }
        })
      }
      return latestId
    })
    .catch(() => {
      return '' // 忽略失败
    })
}
