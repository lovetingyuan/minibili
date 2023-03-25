import { ToastAndroid } from 'react-native'
// import { getBlackUps } from '../routes/Hot/blackUps';
import { DynamicType } from '../types'
import { URL } from 'react-native-url-polyfill'

let errorTime = Date.now()

// https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?offset=&host_mid=326081112&timezone_offset=-480
export function request<D extends Record<string, any>>(
  url: string,
  referer?: string,
) {
  const requestUrl = url.startsWith('http')
    ? url
    : 'http://api.bilibili.com' + url
  const { origin, hostname } = new URL(requestUrl)
  return fetch(requestUrl + '&_t=' + Date.now(), {
    headers: {
      // authority: host,
      // referer: 'https://api.bilibili.com/',
      host: hostname,
      origin,
      accept: 'application/json, text/plain, */*',
      'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
      'cache-control': 'max-age=0',
      'sec-ch-ua':
        '"Chromium";v="104", " Not A;Brand";v="99", "Microsoft Edge";v="104"',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"Android"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      // 'upgrade-insecure-requests': '1',
      'user-agent': 'BiLiBiLi ANDROID Client/8.0.0 (orz@****.my)',
    },
    referrer: referer || 'https://space.bilibili.com',
    referrerPolicy: 'no-referrer-when-downgrade',
    // referrerPolicy: 'strict-origin-when-cross-origin',
    body: null,
    method: 'GET',
    mode: 'cors',
    // credentials: 'omit',
    credentials: 'include',
  })
    .then(r => r.json())
    .then((res: { code: number; message: string; data: D }) => {
      if (res.code) {
        __DEV__ && console.log('error', res.code, res.message)
        if (Date.now() - errorTime > 20000) {
          ToastAndroid.show(' 数据获取失败 ', ToastAndroid.SHORT)
          errorTime = Date.now()
        }
        throw new Error('未能获取当前数据' + (__DEV__ ? ' ' + url : ''))
      }
      return res.data
    })
  // );
}

export async function getUserInfo(uid: string | number) {
  // https://api.bilibili.com/x/space/acc/info?mid=1458143131
  interface Res {
    birthday: string
    coins: number
    face: string
    level: number
    live_room: {
      cover: string
      liveStatus: 0 | 1
      roomStatus: 1 | 0
      roomid: number
      title: string
      url: string
    } | null
    mid: number
    name: string
    sex: string
    sign: string
    top_photo: string
  }
  const data = await request<Res>(
    //?mid=1717066021&token=&platform=web&jsonp=jsonp
    '/x/space/acc/info?mid=' + uid + '&token=&platform=web&jsonp=jsonp',
    'https://space.bilibili.com/' + uid,
  )
  // if (code) {
  //   throw new Error('获取用户信息失败');
  // }
  return {
    living: !!data.live_room?.liveStatus,
    liveUrl: data.live_room?.url,
    face: data.face,
    name: data.name,
    sign: data.sign,
    mid: data.mid,
    level: data.level,
    sex: data.sex,
  }
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

export async function getFollowUps(uid: number | string) {
  // https://api.bilibili.com/x/relation/followings?vmid=14427395&pn=1&ps=50&order=desc&jsonp=jsonp
  interface Followed {
    face: string
    mid: number | string
    mtime: number
    official_verify: { type: number; desc: string }
    sign: string
    // special: 0;
    tag: null
    uname: string
  }
  const data = await request<{
    list: Followed[]
    total: number
  }>(`/x/relation/followings?vmid=${uid}&pn=1&ps=50&order=desc&jsonp=jsonp`)
  const total = data.total
  const list = [data.list]
  const pages = Math.ceil(total / 50) - 1
  await Promise.all(
    Array.from({ length: pages }).map((v, i) => {
      return request<{
        list: Followed[]
        total: number
      }>(
        `/x/relation/followings?vmid=${uid}&pn=${
          i + 2
        }&ps=50&order=desc&jsonp=jsonp`,
      ).then(res => {
        list[i + 1] = res.list
      })
    }),
  )
  // if (code) {
  //   throw new Error('获取关注列表失败');
  // }
  return {
    total,
    list: list.reduce(
      (a, b) => {
        return a.concat(
          b.map(up => {
            return {
              face: up.face,
              mid: up.mid,
              name: up.uname,
              sign: up.sign,
            }
          }),
        )
      },
      [] as {
        face: string
        mid: string | number
        name: string
        sign: string
      }[],
    ),
  }
}

export const getLiveStatus = async (mid: number | string) => {
  interface LiveUserInfo {
    room_id: number
    info: {
      face: string
      uid: number
      uname: string
    }
  }
  interface LiveInfo {
    uid: number
    room_id: number
    attention: number
    online: number
    description: string
    live_status: number
    title: string
    user_cover: string
    is_strict_room: boolean
    live_time: string
  }
  const {
    room_id,
    info: { uname, face },
  } = await request<LiveUserInfo>(
    'https://api.live.bilibili.com/live_user/v1/Master/info?uid=' + mid,
  )
  if (!room_id) {
    return {
      living: false,
      roomId: '',
      name: uname,
      face,
    }
  }

  const { live_status } = await request<LiveInfo>(
    'https://api.live.bilibili.com/room/v1/Room/get_info?room_id=' + room_id,
  )
  return {
    living: live_status === 1,
    roomId: room_id as number,
    name: uname,
    face,
  }
}
