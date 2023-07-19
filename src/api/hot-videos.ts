import useSWRInfinite from 'swr/infinite'
import { z } from 'zod'
import fetcher from './fetcher'
import { VideoItemResponseSchema } from './hot-videos.schema'

const fetcher2 = (url: string) => {
  // eslint-disable-next-line no-console
  __DEV__ && console.log('fetch hot videos: ' + url)

  return fetcher<{ list: HotVideoResponse[]; no_more: boolean }>(url)
}

export type HotVideoResponse = z.infer<typeof VideoItemResponseSchema>

export const getVideo = (item: HotVideoResponse) => {
  return {
    aid: item.aid,
    bvid: item.bvid,
    // cid: item.cid,
    title: item.title,
    desc: item.desc,
    cover: item.pic,
    duration: item.duration,
    pubDate: item.pubdate,
    name: item.owner.name,
    mid: item.owner.mid,
    face: item.owner.face,
    playNum: item.stat.view,
    shareNum: item.stat.share,
    likeNum: item.stat.like,
    commentNum: item.stat.reply,
    tag: item.tname,
    videosNum: item.videos,
  }
}

export type VideoItem = ReturnType<typeof getVideo>

// https://api.bilibili.com/x/web-interface/popular?ps=20&pn=1

export function useHotVideos() {
  const { data, mutate, size, setSize, isValidating, isLoading, error } =
    useSWRInfinite(
      index => {
        return `/x/web-interface/popular?ps=20&pn=${index + 1}`
      },
      fetcher2,
      {
        revalidateFirstPage: false,
        // 热门的请求结果并不是严格按照pn来返回的，而是跟请求顺序有关，
        // 比如请求第一页再请求第三页，这个第三页返回的数据其实是第二页
        // 所以此处不再验证首页，而实直接按顺序请求下一页
      },
    )
  const hotVideos =
    data?.reduce((a, b) => {
      return a.concat(b.list)
    }, [] as HotVideoResponse[]) || []

  const isLoadingMore =
    isLoading || (size > 0 && !!data && typeof data[size - 1] === 'undefined')
  const isReachingEnd = !!data && !!data[data.length - 1]?.no_more
  const isRefreshing = isValidating && !!data && data.length === size
  const list = hotVideos.map(getVideo)

  return {
    list: list, // list.length ? list : store.$cachedHotVideos,
    page: size,
    setSize,
    isRefreshing,
    isReachingEnd,
    loading: isLoadingMore,
    refresh: () => {
      mutate()
    },
    error,
  }
}
