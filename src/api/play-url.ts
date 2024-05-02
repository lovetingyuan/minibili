import useSWR from 'swr'
import type { z } from 'zod'

import request from './fetcher'
import type { DashUrlResponseSchema, PlayUrlResponseSchema } from './play-url.schema'

type Res = z.infer<typeof PlayUrlResponseSchema>

type DashRes = z.infer<typeof DashUrlResponseSchema>

export function useVideoMp4Url(
  bvid: string,
  cid?: number,
  highQuality?: boolean,
) {
  const search = new URLSearchParams()
  // https://socialsisteryi.github.io/bilibili-API-collect/docs/video/videostream_url.html
  if (bvid && cid) {
    const query = {
      bvid,
      cid,
      type: 'mp4',
      qn: highQuality ? 64 : 32,
      fnval: 1,
      try_look: 1,
      platform: 'pc',
      high_quality: highQuality ? 1 : 0,
    }
    Object.entries(query).forEach(([k, v]) => {
      search.append(k, `${v}`)
    })
  }

  const { data, error } = useSWR<Res>(
    bvid && cid ? `/x/player/wbi/playurl?${search}` : null,
    {
      dedupingInterval: 2 * 60 * 1000 * 1000 - 60 * 1000,
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 0,
    },
  )
  let url = data?.durl
    ? data.durl[0]?.backup_url?.[0] || data.durl[0]?.url || ''
    : null
  if (highQuality && url) {
    url += '&_high_quality=true'
  }
  return {
    videoUrl: url,
    error,
  }
}

export function getDownloadUrl(bvid: string, cid: number) {
  const search = new URLSearchParams()
  if (!bvid || !cid) {
    return
  }
  // https://socialsisteryi.github.io/bilibili-API-collect/docs/video/videostream_url.html

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
    search.append(k, `${v}`)
  })
  return request<Res>(`/x/player/wbi/playurl?${search}`).then(res => {
    return res.durl?.[0]?.url
  })
}

export function useAudioUrl(bvid: string, cid?: number | string) {
  const search = new URLSearchParams()
  // https://socialsisteryi.github.io/bilibili-API-collect/docs/video/videostream_url.html
  if (bvid && cid) {
    const query = {
      bvid,
      cid,
      // type: 'mp4',
      qn: 64,
      fnval: 16, // DASH格式才可以获取到音频
      try_look: 1,
      platform: 'pc',
      high_quality: 1,
    }
    Object.entries(query).forEach(([k, v]) => {
      search.append(k, `${v}`)
    })
  }

  const { data, error } = useSWR<DashRes>(
    bvid && cid ? `/x/player/wbi/playurl?${search}` : null,
    {
      dedupingInterval: 2 * 60 * 1000 * 1000 - 60 * 1000,
    },
  )
  // if (error) {
  //   console.log(error)
  // }

  return {
    url: data?.dash.audio?.sort((a, b) => a.id - b.id).at(-1)?.baseUrl,
    time: data?.timelength,
    error,
  }
}
