// https://api.bilibili.com/x/player/online/total?bvid=BV14S421N7pv&cid=1448255346
/**
 * {
    "code": 0,
    "message": "0",
    "ttl": 1,
    "data": {
        "total": "2",
        "count": "2",
        "show_switch": {
            "total": true,
            "count": true
        },
        "abtest": {
            "group": "b"
        }
    }
}
 */

import useSWR from 'swr'

import type { WatchingCountResponseType } from './watching-count.schema'

export function useWatchingCount(bvid: string, cid: string | number) {
  const { data } = useSWR<WatchingCountResponseType>(
    bvid ? `/x/player/online/total?bvid=${bvid}&cid=${cid}` : null,
    {
      refreshInterval: 60 * 1000,
    },
  )
  return data
}
