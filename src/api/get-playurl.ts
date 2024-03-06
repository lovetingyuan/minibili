import useSWR from 'swr'
import { z } from 'zod'

import { PlayUrlResponseSchema } from './get-playurl.schema'

type Res = z.infer<typeof PlayUrlResponseSchema>

export function usePlayUrl(
  bvid: string,
  cid: string | number,
  highQuality = true,
) {
  const search = new URLSearchParams()
  // https://socialsisteryi.github.io/bilibili-API-collect/docs/video/videostream_url.html
  if (bvid) {
    const query = {
      bvid,
      cid,
      type: 'mp4',
      qn: highQuality ? 64 : 16,
      fnval: 1,
      platform: 'pc',
      high_quality: highQuality ? 1 : 0,
    }
    Object.entries(query).forEach(([k, v]) => {
      search.append(k, v + '')
    })
  }

  const { data } = useSWR<Res>(bvid ? `/x/player/wbi/playurl?${search}` : null)
  return data?.durl
}
