import useSWR from 'swr'

import type { HotSearchResType } from './hot-search.schema'

export function useHotSearch() {
  // https://app.bilibili.com/x/v2/search/trending/ranking
  const { data } = useSWR<HotSearchResType>(
    'https://app.bilibili.com/x/v2/search/trending/ranking',
    {
      refreshInterval: 10 * 60 * 1000,
    },
  )
  return data?.list
}
