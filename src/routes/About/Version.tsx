import Constants from 'expo-constants'
import * as Updates from 'expo-updates'
import React from 'react'
import { Alert, Linking } from 'react-native'

import {
  checkUpdate as checkUpdateApi,
  currentVersion,
} from '../../api/check-update'
import { showToast } from '../../utils'
import TextAction from './TextAction'

export default React.memo(Version)

function Version() {
  const updateTime: string = Updates.createdAt
    ? `${Updates.createdAt.toLocaleDateString()} ${Updates.createdAt.toLocaleTimeString()}`
    : Constants.expoConfig?.extra?.buildTime
  const [checkingUpdate, setCheckingUpdate] = React.useState(false)
  const [hasUpdate, setHasUpdate] = React.useState<boolean | null>(null)
  const checkUpdate = () => {
    if (checkingUpdate) {
      return
    }
    setCheckingUpdate(true)
    checkUpdateApi().then(
      (data) => {
        setHasUpdate(data.hasUpdate)
        if (data.hasUpdate) {
          Alert.alert(
            '有新版本',
            `${data.currentVersion}  ⟶  ${data.latestVersion}\n\n${data.changelog}`,
            [
              {
                text: '取消',
              },
              {
                text: '下载更新',
                onPress: () => {
                  Linking.openURL(data.downloadLink!)
                },
              },
            ],
          )
        }
        setCheckingUpdate(false)
      },
      () => {
        showToast('检查更新失败')
        setCheckingUpdate(false)
      },
    )
  }
  return (
    <TextAction
      text={`💡 当前版本：${currentVersion}`}
      onTextLongPress={() => {
        Alert.alert(
          '版本信息',
          [
            `当前版本：${currentVersion} (${
              Constants.expoConfig?.extra?.gitHash || '-'
            })`,
            `更新时间：${updateTime || '-'}`,
            `版本频道：${Updates.channel} - ${Updates.runtimeVersion}`,
            Updates.updateId && `更新ID：${Updates.updateId}`,
          ]
            .filter(Boolean)
            .join('\n'),
        )
      }}
      buttons={[
        {
          text: hasUpdate === false ? '暂无更新' : '检查更新',
          loading: checkingUpdate,
          onPress: checkUpdate,
        },
      ]}
    />
  )
}
