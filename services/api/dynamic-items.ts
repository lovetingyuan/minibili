import { GetFuncPromiseType } from '../../types'
import request from './fetcher'

export type DynamicItem = GetFuncPromiseType<typeof getDynamicItems>['items'][0]

export const enum DynamicType {
  Video = 'video',
  Draw = 'draw',
  Word = 'word',
  ForwardVideo = 'ForwardVideo',
  ForwardDraw = 'ForwardDraw',
  ForwardOther = 'ForwardOther',
}

export async function getDynamicItems(offset = '', uid: string | number) {
  // https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?offset=&host_mid=1458143131&timezone_offset=-480
  interface Author {
    face: string
    following: boolean
    jump_url: string
    label: string
    mid: number
    name: string
    pub_location_text: string
    pub_time: string
    pub_ts: number
    type: 'AUTHOR_TYPE_NORMAL'
  }
  interface Desc {
    text: string
  }
  interface AV {
    desc: Desc | null
    major: {
      type: 'MAJOR_TYPE_ARCHIVE'
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
  }
  interface Draw {
    desc: Desc | null
    major: {
      type: 'MAJOR_TYPE_DRAW'
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
  }
  interface Article {
    desc: null
    major: {
      type: 'MAJOR_TYPE_ARTICLE'
      article: {
        covers: string[]
        desc: string
        label: string
        title: string
        items: {
          src: string
          width: number
          height: number
          size: number
        }[]
      }
    }
  }
  interface Word {
    major: null
    desc: Desc
    additional?: any
  }
  interface Topic {
    major: null
    desc: Desc
    topic?: {
      name: string
    }
  }
  interface Live {
    major: {
      type: 'MAJOR_TYPE_LIVE'
      live: {
        cover: string
        title: string
      }
    }
    desc: null
    topic: null
  }
  interface Res {
    has_more: boolean
    items: (
      | {
          type: 'DYNAMIC_TYPE_AV'
          modules: {
            module_author: Author
            module_dynamic: AV
            module_tag?: { text: string }
          }
          id_str: string
        }
      | {
          type: 'DYNAMIC_TYPE_FORWARD'
          id_str: string
          modules: {
            module_author: Author
            module_dynamic: {
              desc: Desc | null
              major: null
            }
            module_tag?: { text: string }
          }
          orig: {
            id_str: string
            modules: {
              module_author: Author
              module_dynamic: AV | Draw | Article | Word | Topic | Live
              module_tag?: { text: string }
            }
          }
        }
      | {
          type: 'DYNAMIC_TYPE_DRAW'
          id_str: string
          modules: {
            module_author: Author
            module_dynamic: Draw
            module_tag?: { text: string }
          }
        }
      | {
          type: 'DYNAMIC_TYPE_WORD'
          id_str: string
          modules: {
            module_author: Author
            module_dynamic: Word
            module_tag?: { text: string }
          }
        }
    )[]
    offset: string
    update_baseline: string
    update_num: number
  }
  const data = await request<Res>(
    `/x/polymer/web-dynamic/v1/feed/space?offset=${offset}&host_mid=${uid}&timezone_offset=-480`,
  )
  // if (code) {
  //   return Promise.reject(new Error(message));
  // }
  return {
    more: data.has_more,
    offset: data.offset,
    items: data.items
      .map(item => {
        const common = {
          id: item.id_str,
          date: item.modules?.module_author?.pub_time,
          time: item.modules?.module_author?.pub_ts,
          mid: item.modules?.module_author?.mid,
          name: item.modules?.module_author?.name,
          text: item.modules?.module_dynamic?.desc?.text,
          top: item.modules?.module_tag?.text === '置顶',
        }
        if (item.type === 'DYNAMIC_TYPE_WORD') {
          return {
            ...common,
            type: DynamicType.Word as const,
            additionalText:
              item.modules.module_dynamic.additional?.reserve?.desc1?.text,
          }
        }
        if (item.type === 'DYNAMIC_TYPE_AV') {
          const video = item.modules.module_dynamic.major.archive
          return {
            ...common,
            type: DynamicType.Video as const,
            cover: video.cover,
            title: video.title,
            play: video.stat.play,
            bvid: video.bvid,
            aid: video.aid,
            duration: video.duration_text,
          }
        }
        if (item.type === 'DYNAMIC_TYPE_DRAW') {
          return {
            ...common,
            type: DynamicType.Draw as const,
            images: item.modules?.module_dynamic?.major?.draw?.items?.map(v => {
              return {
                src: v.src,
                ratio: v.width / v.height,
              }
            }),
          }
        }
        if (item.type === 'DYNAMIC_TYPE_FORWARD') {
          const forward = item.orig.modules?.module_dynamic || {}
          if (forward.major?.type === 'MAJOR_TYPE_ARCHIVE') {
            return {
              ...common,
              type: DynamicType.ForwardVideo as const,
              forwardText: forward.desc?.text || '无',
              cover: forward.major?.archive.cover,
              title: forward.major?.archive.title,
            }
          }
          if (forward.major?.type === 'MAJOR_TYPE_DRAW') {
            return {
              ...common,
              type: DynamicType.ForwardDraw as const,
              forwardText: forward.desc?.text || '无',
              images: forward.major.draw.items.map(v => {
                return {
                  ratio: v.width / v.height,
                  src: v.src,
                }
              }),
            }
          }
          if (forward.major?.type === 'MAJOR_TYPE_ARTICLE') {
            return {
              ...common,
              type: DynamicType.ForwardDraw as const,
              forwardText: forward.major?.article?.title || '无',
              images: forward.major?.article?.covers?.map(v => {
                return {
                  ratio: 2,
                  src: v,
                }
              }),
            }
          }
          if (forward.major?.type === 'MAJOR_TYPE_LIVE') {
            return {
              ...common,
              type: DynamicType.ForwardVideo as const,
              forwardText: '直播',
              title: forward.major?.live.title,
              cover: forward.major?.live.cover,
            }
          }
          return {
            ...common,
            type: DynamicType.ForwardOther as const,
            forwardText:
              (forward.desc?.text || '无') +
              ('topic' in forward && forward.topic?.name
                ? '#' + forward.topic.name
                : ''),
          }
        }
      })
      .filter(Boolean),
  }
}
