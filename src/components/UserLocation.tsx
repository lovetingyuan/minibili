import * as SentryExpo from '@sentry/react-native'
import React from 'react'

import { useUserLocation } from '@/api/user-location'
import { Tags } from '@/utils/report'

function UserLocation() {
  const loc = useUserLocation()
  if (loc) {
    const locationStr = [loc.country, loc.province, loc.city].join('/')
    SentryExpo.setTag(Tags.user_location, locationStr)
    SentryExpo.setContext('location', loc)
    SentryExpo.captureMessage('Open app')
  }
  return null
}

export default React.memo(UserLocation)
