import useSWRInfinite from 'swr/infinite'

import { parseUrl } from '../utils'
import type {
  SearchVideoItemType,
  SearchVideoResponse,
} from './search-video.schema'
import fetcher from './fetcher'

function getVideoInfo(video: SearchVideoItemType) {
  return {
    name: video.author,
    title: video.title,
    desc: video.description,
    cover: parseUrl(video.pic),
    tag: video.typename,
    bvid: video.bvid,
    face: parseUrl(video.upic),
    date: video.pubdate,
    mid: video.mid,
    aid: video.aid,
    // ---
    duration: video.duration,
    danmaku: video.danmaku,
    play: video.play,
    like: video.like,
  }
}

export const useSearchVideos = (name: string) => {
  const { data, size, setSize, isValidating, isLoading, error } =
    useSWRInfinite<SearchVideoResponse>(
      (index) => {
        return name
          ? `/x/web-interface/wbi/search/type?keyword=${encodeURIComponent(name)}&page=${index + 1}&page_size=50&platform=pc&search_type=video`
          : null
      },
      fetcher,
      {
        revalidateFirstPage: false,
      },
    )
  const isReachingEnd =
    !!data && (data[data.length - 1]?.result?.length ?? 0) < 50
  // const isRefreshing = isValidating && !!data && data.length === size
  const bvidMap: Record<string, boolean> = {}
  const list = data?.reduce((a, b) => {
    if (b.result) {
      return a.concat(
        b.result
          .filter((v) => {
            if (v.type !== 'video') {
              return false
            }
            if (v.bvid in bvidMap) {
              return false
            }
            bvidMap[v.bvid] = true
            return true
          })
          .map(getVideoInfo),
      )
    }
    return a
  }, [] as SearchedVideoType[])

  return {
    data: list,
    error,
    isLoading,
    isValidating,
    isReachingEnd,
    update: () => {
      if (isReachingEnd) {
        return
      }
      setSize(size + 1)
    },
  }
}

export type SearchedVideoType = ReturnType<typeof getVideoInfo>
