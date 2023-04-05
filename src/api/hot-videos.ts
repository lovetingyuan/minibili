import useSWRInfinite from 'swr/infinite'
import { z } from 'zod'
import fetcher from './fetcher'
import { HotVideoResponseSchema } from './hot-videos.schema'

const fetcher2 = (url: string) => {
  __DEV__ && console.log('fetch hot videos: ' + url)
  return fetcher<{ list: HotVideoResponse[]; no_more: boolean }>(url).then(
    res => res.list,
  )
}

export type HotVideoResponse = z.infer<typeof HotVideoResponseSchema>

const getVideo = (item: HotVideoResponse) => {
  return {
    aid: item.aid,
    bvid: item.bvid,
    cid: item.cid,
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
