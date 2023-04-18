import request from './fetcher'

import useSWR from 'swr'
import { HotVideoResponse, getVideo } from './hot-videos'

export const useRankList = (rid?: number) => {
  const { data, error, isLoading, mutate } = useSWR<{
    list: HotVideoResponse[]
    note: string
  }>(
    typeof rid === 'number' && rid > -1
      ? `/x/web-interface/ranking/v2?rid=${rid}&type=all`
      : null,
    (url: string) => {
      return request(url)
    },
    {
      refreshInterval: 10 * 60 * 1000,
    },
  )
  return {
    data: data?.list.map(getVideo),
    mutate,
    error,
    isLoading,
  }
}
