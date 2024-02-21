import useSWR from 'swr'
import type { z } from 'zod'

import type { UserRelationResponseSchema } from './user-relation.schema'

type UserRelationResponse = z.infer<typeof UserRelationResponseSchema>

export function useUserRelation(mid?: number | string) {
  const { data, mutate, error, isValidating, isLoading } =
    useSWR<UserRelationResponse>(mid ? `/x/relation/stat?vmid=${mid}` : null)

  return {
    data,
    mutate,
    error,
    isValidating,
    isLoading,
  }
}
