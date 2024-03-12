import useSWRInfinite from 'swr/infinite'

import { parseUrl } from '../utils'
import type { SearchResponse, SearchUpResType } from './search-up.schema'

function getUpInfo(up: SearchUpResType) {
  return {
    name: up.uname,
    face: parseUrl(up.upic),
    sign: up.usign,
    mid: up.mid,
    fans: up.fans,
  }
}

export const useSearchUps = (name: string) => {
  const { data, size, setSize, isValidating, isLoading, error } =
    useSWRInfinite<SearchResponse>(
      index => {
        return name
          ? `/x/web-interface/wbi/search/type?keyword=${encodeURIComponent(name)}&page=${index + 1}&page_size=50&platform=pc&search_type=bili_user`
          : null
      },
      {
        revalidateFirstPage: false,
      },
    )
  const isReachingEnd =
    !!data && (data[data.length - 1]?.result?.length ?? 0) < 50
  // const isRefreshing = isValidating && !!data && data.length === size
  const list = data?.reduce(
    (a, b) => {
      if (b.result) {
        return a.concat(b.result.map(getUpInfo))
      }
      return a
    },
    [] as ReturnType<typeof getUpInfo>[],
  )
  return {
    data: list,
    error,
    isLoading,
    isValidating,
    isReachingEnd,
    update: () => {
      if (isReachingEnd) {
        return
      }
      setSize(size + 1)
    },
  }
}

export type SearchedUpType = Exclude<
  ReturnType<typeof useSearchUps>['data'],
  undefined
>[0]
