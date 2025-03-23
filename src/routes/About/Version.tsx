import Constants from 'expo-constants'
import * as Updates from 'expo-updates'
import React from 'react'
import { Alert, Linking } from 'react-native'

import useAppUpdateInfo from '@/api/check-update'
import { site } from '@/constants'

import TextAction from './TextAction'

export default React.memo(Version)

function Version() {
  const updateTime: string = Updates.createdAt
    ? `${Updates.createdAt.toLocaleDateString()} ${Updates.createdAt.toLocaleTimeString()}`
    : Constants.expoConfig?.extra?.buildTime
  const {
    currentVersion,
    checkUpdate,
    latestVersion,
    changelog,
    downloadLink,
    loading: checkingUpdate,
    hasUpdate,
  } = useAppUpdateInfo()
  const handleCheckUpdate = () => {
    if (checkingUpdate) {
      return
    }

    if (hasUpdate) {
      Alert.alert(
        '有新版本',
        `${currentVersion}  ➔  ${latestVersion}\n\n${changelog}`,
        [
          {
            text: '取消',
          },
          {
            text: '下载更新',
            onPress: () => {
              if (downloadLink) {
                Linking.openURL(downloadLink)
              }
            },
          },
        ],
      )
    } else {
      checkUpdate()
    }
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
          text: hasUpdate ? 'APP有更新🎉' : '检查更新',
          loading: checkingUpdate,
          onPress: handleCheckUpdate,
        },
        {
          text: '更新日志',
          onPress: () => {
            Linking.openURL(site + '?showchangelog')
          },
        },
      ]}
    />
  )
}
