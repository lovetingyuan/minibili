import useSWR from 'swr'

import type { HotSearchWebResType } from './hot-search.schema'

export function useHotSearch() {
  // https://app.bilibili.com/x/v2/search/trending/ranking
  // https://api.bilibili.com/x/web-interface/wbi/search/square?limit=30&platform=web
  const { data } = useSWR<HotSearchWebResType>(
    // 'https://app.bilibili.com/x/v2/search/trending/ranking',
    '/x/web-interface/wbi/search/square?limit=30',
    {
      refreshInterval: 10 * 60 * 1000,
    },
  )
  return data?.trending.list.map((item, i) => {
    return {
      hot_id: item.keyword + i,
      keyword: item.keyword,
      show_name: item.show_name,
      icon: item.icon,
      position: i + 1,
    }
  })
}
