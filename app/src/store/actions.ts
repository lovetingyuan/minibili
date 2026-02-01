import type { CollectVideoInfo } from '@/types'

import { useStore } from '.'

export function useMarkVideoWatched() {
  const { get$watchedVideos, set$watchedVideos } = useStore()
  return (videoInfo: CollectVideoInfo, newProgress: number) => {
    let playedMap = get$watchedVideos()
    const playedInfo = playedMap[videoInfo.bvid]
    if (playedInfo) {
      set$watchedVideos({
        ...playedMap,
        [videoInfo.bvid]: {
          ...playedInfo,
          watchProgress: Math.min(
            Math.max(newProgress, playedInfo.watchProgress),
            100,
          ),
          watchTime: Date.now(),
          bvid: videoInfo.bvid,
          mid: videoInfo.mid,
        },
      })
    } else {
      const watchedVideos = Object.values(playedMap)
      if (watchedVideos.length > 500) {
        const values = watchedVideos
          .sort((a, b) => b.watchTime - a.watchTime)
          .slice(0, 400)
        playedMap = {}
        values.forEach((item) => {
          playedMap[item.bvid] = item
        })
      } else {
        playedMap = { ...playedMap }
      }
      playedMap[videoInfo.bvid] = {
        watchProgress: Math.min(newProgress, 100),
        watchTime: Date.now(),
        bvid: videoInfo.bvid,
        name: videoInfo.name!,
        mid: videoInfo.mid!,
        title: videoInfo.title,
        cover: videoInfo.cover!,
        date: videoInfo.date!,
        duration: videoInfo.duration,
      }
      set$watchedVideos(playedMap)
    }
  }
}

export function useMarkHotSearchViewed() {
  const { set$watchedHotSearch, get$watchedHotSearch } = useStore()
  return (name: string) => {
    const viewed = { ...get$watchedHotSearch() }
    viewed[name] = Date.now()
    let list = Object.entries(viewed)
    if (list.length > 100) {
      list = list.sort((a, b) => b[1] - a[1]).slice(0, 100)
      const newViewed: typeof viewed = {}
      for (const [k, t] of list) {
        newViewed[k] = t
      }
      set$watchedHotSearch(newViewed)
    } else {
      set$watchedHotSearch(viewed)
    }
  }
}
