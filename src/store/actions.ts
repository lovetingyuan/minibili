import { CollectVideoInfo } from '@/types'

import { useAppContextMethods } from '.'

export function useMarkVideoWatched() {
  const { get$watchedVideos, set$watchedVideos } = useAppContextMethods()
  return (videoInfo: CollectVideoInfo, newProgress: number) => {
    let playedMap = get$watchedVideos()
    const playedInfo = playedMap[videoInfo.bvid]
    if (playedInfo) {
      set$watchedVideos({
        ...playedMap,
        [videoInfo.bvid]: {
          ...playedInfo,
          watchProgress: Math.max(newProgress, playedInfo.watchProgress),
          watchTime: Date.now(),
          bvid: videoInfo.bvid,
        },
      })
    } else {
      const watchedVideos = Object.values(playedMap)
      if (watchedVideos.length > 500) {
        const values = watchedVideos
          .sort((a, b) => b.watchTime - a.watchTime)
          .slice(0, 400)
        playedMap = {}
        values.forEach(item => {
          playedMap[item.bvid] = item
        })
      } else {
        playedMap = { ...playedMap }
      }
      playedMap[videoInfo.bvid] = {
        watchProgress: newProgress,
        watchTime: Date.now(),
        bvid: videoInfo.bvid,
        name: videoInfo.name!,
        title: videoInfo.title,
        cover: videoInfo.cover!,
        date: videoInfo.date!,
        duration: videoInfo.duration,
      }
      set$watchedVideos(playedMap)
    }
  }
}
