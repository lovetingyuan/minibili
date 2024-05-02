import useSWRImmutable from 'swr/immutable'
import type { z } from 'zod'

import type getLocationSchema from './user-location.schema'

type UserLocation = z.infer<typeof getLocationSchema>

// https://api.bilibili.com/x/web-interface/zone

export function useUserLocation() {
  const { data } = useSWRImmutable<UserLocation>('/x/web-interface/zone')
  return data
}
