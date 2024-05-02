import useSWR from 'swr'

import type { AiConclusionResType } from './ai-conclusion.schema'

export function useAiConclusion(
  bvid: string,
  cid?: number,
  mid?: string | number,
) {
  const { data, isLoading, error } = useSWR<AiConclusionResType>(
    bvid && cid && mid
      ? `/x/web-interface/view/conclusion/get?bvid=${bvid}&cid=${cid}&up_mid=${mid}`
      : null,
  )
  return {
    summary: data?.model_result.summary,
    error,
    isLoading,
  }
}
