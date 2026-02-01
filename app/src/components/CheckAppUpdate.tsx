import * as Application from 'expo-application'
import React from 'react'

import { useAppUpdateInfo } from '@/api/check-update'
import { useStore } from '@/store'

export const currentVersion = Application.nativeApplicationVersion!

function CheckAppUpdate() {
  const appUpdateInfo = useAppUpdateInfo()
  const { $checkAppUpdateTime } = useStore()
  const needCheckUpdate =
    $checkAppUpdateTime + 1000 * 60 * 60 * 24 * 3 < Date.now() && !__DEV__

  if (needCheckUpdate && appUpdateInfo.hasUpdate) {
    appUpdateInfo.showAlert()
  }
  return null
}

export default React.memo(CheckAppUpdate)
