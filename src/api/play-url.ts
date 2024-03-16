import useSWR from 'swr'
import { z } from 'zod'

import { PlayUrlResponseSchema } from './play-url.schema'

type Res = z.infer<typeof PlayUrlResponseSchema>

export function usePlayUrl(
  bvid: string,
  cid?: string | number,
  highQuality = true,
) {
  const search = new URLSearchParams()
  // https://socialsisteryi.github.io/bilibili-API-collect/docs/video/videostream_url.html
  if (bvid && cid) {
    const query = {
      bvid,
      cid,
      type: 'mp4',
      qn: highQuality ? 64 : 16,
      fnval: 1,
      try_look: 1,
      platform: 'pc',
      high_quality: highQuality ? 1 : 0,
    }
    Object.entries(query).forEach(([k, v]) => {
      search.append(k, v + '')
    })
  }

  const { data } = useSWR<Res>(
    bvid && cid ? `/x/player/wbi/playurl?${search}` : null,
    {
      dedupingInterval: 2 * 60 * 1000 * 1000 - 60 * 1000,
    },
  )
  return data?.durl
}

export function useVideoDownloadUrl(bvid: string, cid?: string | number) {
  const search = new URLSearchParams()
  // https://socialsisteryi.github.io/bilibili-API-collect/docs/video/videostream_url.html
  if (bvid && cid) {
    const query = {
      bvid,
      cid,
      type: 'mp4',
      qn: 64,
      fnval: 4048,
      platform: 'html5',
      high_quality: 1,
      try_look: 1,
    }
    Object.entries(query).forEach(([k, v]) => {
      search.append(k, v + '')
    })
  }

  const { data } = useSWR<Res>(
    bvid && cid ? `/x/player/wbi/playurl?${search}` : null,
    {
      dedupingInterval: 2 * 60 * 1000 * 1000,
    },
  )
  return data?.durl
}
