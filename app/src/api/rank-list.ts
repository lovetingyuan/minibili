import useSWR from 'swr'

import request from './fetcher'
import { getVideo, type HotVideoResponse } from './hot-videos'

const getUrl = (rid?: number) => {
  if (rid === undefined || rid === -1) {
    return null
  }
  let type = 'all'
  let _rid = rid
  if (rid === -2) {
    type = 'origin'
    _rid = 0
  }
  if (rid === -3) {
    type = 'rookie'
    _rid = 0
  }
  return `/x/web-interface/ranking/v2?rid=${_rid}&type=${type}`
}

export const useRankList = (rid?: number) => {
  const { data, error, isLoading, mutate } = useSWR<{
    list: HotVideoResponse[]
    note: string
  }>(getUrl(rid), request, {
    refreshInterval: 10 * 60 * 1000,
  })
  return {
    data: data?.list.map(getVideo),
    mutate,
    error,
    isLoading,
  }
}
