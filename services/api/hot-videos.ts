import useSWRInfinite from 'swr/infinite'
import fetcher from './fetcher'

const fetcher2 = (url: string) => {
  __DEV__ && console.log('fetch hot videos: ' + url)
  return fetcher<{ list: HotVideoResponse[]; no_more: boolean }>(url).then(
    res => res.list,
  )
}

export interface HotVideoResponse {
  // https://api.bilibili.com/x/web-interface/popular?ps=20&pn=1
  aid: number
  bvid: string
  cid: number
  copyright: 1 | 0
  ctime: number
  desc: string
  dimension: { width: number; height: number; rotate: number }
  duration: number
  dynamic: string
  first_frame: string
  is_ogv: boolean
  ogv_info: null
  owner: { mid: number; name: string; face: string }
  pic: string
  pubdate: number
  // rcmd_reason: {content: '百万播放', corner_mark: 0}
  // rights: {bp: 0, elec: 0, download: 0, movie: 0, pay: 0, …}
  // season_type: 0
  short_link: string
  short_link_v2: string
  stat: {
    aid: number
    view: number
    danmaku: number
    favorite: number
    his_rank: number
    like: number
    now_rank: number
    reply: number
    share: number
  }
  state: number
  tid: number
  title: string
  tname: string
  videos: number
}
const getVideo = (item: HotVideoResponse) => {
  return {
    aid: item.aid,
    bvid: item.bvid,
    cid: item.cid,
    title: item.title,
    cover: item.pic,
    duration: item.duration,
    pubDate: item.pubdate,
    name: item.owner.name,
    mid: item.owner.mid,
    playNum: item.stat.view,
    shareNum: item.stat.share,
    tag: item.tname,
    videosNum: item.videos,
  }
}

export type VideoItem = ReturnType<typeof getVideo>

// https://api.bilibili.com/x/web-interface/popular?ps=20&pn=1

export function useHotVideos() {
  // const blackUps = await getBlackUps;
  const { data, mutate, size, setSize, isValidating, isLoading } =
    useSWRInfinite<HotVideoResponse[]>(
      index => {
        return `/x/web-interface/popular?ps=20&pn=${index + 1}`
      },
      fetcher2,
      {
        revalidateFirstPage: false,
      },
    )

  const hotVideos = data ? data.flat() : []

  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined')
  const isEmpty = data?.[0]?.length === 0
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.length < 20)
  const isRefreshing = isValidating && !!data && data.length === size

  return {
    list: hotVideos.map(getVideo),
    page: size,
    setSize,
    isRefreshing,
    isReachingEnd,
    loading: isLoadingMore,
    refresh: mutate,
  }
}
