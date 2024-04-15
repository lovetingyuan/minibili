import React from 'react'
import { useStore } from '.'
import { CollectVideoInfo, UpInfo } from '@/types'
import { MusicSong, UpdateUpInfo } from './types'

export const useFollowedUpsMap = () => {
  const { $followedUps } = useStore()
  return React.useMemo(() => {
    const ups: Record<string, UpInfo> = {}
    for (const up of $followedUps) {
      ups[up.mid] = up
    }
    return ups
  }, [$followedUps])
}

export const useUpUpdateCount = () => {
  const { $upUpdateMap } = useStore()
  return React.useMemo(() => {
    const aa = Object.values<UpdateUpInfo>($upUpdateMap)
    const count = aa.filter(item => {
      return item.latestId !== item.currentLatestId
    }).length
    return count
  }, [$upUpdateMap])
}

export const useCollectedVideosMap = () => {
  const { $collectedVideos } = useStore()
  return React.useMemo(() => {
    const _map: Record<string, CollectVideoInfo> = {}
    $collectedVideos.forEach(vi => {
      _map[vi.bvid] = vi
    })
    return _map
  }, [$collectedVideos])
}

export const useMusicSongsMap = () => {
  const { $musicList } = useStore()
  return React.useMemo(() => {
    const map: Record<string, MusicSong> = {}
    $musicList.forEach(music => {
      music.songs.forEach(song => {
        map[song.bvid + '_' + song.cid] = song
      })
    })
    return map
  }, [$musicList])
}
