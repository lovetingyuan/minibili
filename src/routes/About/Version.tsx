import React from 'react'
import { View, StyleSheet, Alert, Appearance, Linking } from 'react-native'
import { Button, Text } from '@rneui/themed'
import Constants from 'expo-constants'
import * as Updates from 'expo-updates'
import {
  checkUpdate as checkUpdateApi,
  currentVersion,
} from '../../api/check-update'
import { showToast } from '../../utils'
import commonStyles from '../../styles'

export default React.memo(function Version() {
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
      data => {
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
    <View style={styles.infoItem}>
      <Text
        style={commonStyles.font16}
        onPress={() => {
          Alert.alert(
            '版本信息',
            [
              `当前版本：${currentVersion} (${
                Constants.expoConfig?.extra?.gitHash || '-'
              }-${Appearance.getColorScheme() === 'dark' ? 1 : 0})`,
              `更新时间：${updateTime || '-'}`,
              `版本频道：${Updates.channel} - ${Updates.runtimeVersion}`,
              Updates.updateId && `更新ID：${Updates.updateId}`,
            ]
              .filter(Boolean)
              .join('\n'),
          )
        }}>
        当前版本：{currentVersion}
      </Text>
      <Button
        type="clear"
        size="sm"
        loading={checkingUpdate}
        onPress={() => {
          checkUpdate()
        }}>
        {hasUpdate === false ? '暂无更新' : '检查更新'}
      </Button>
    </View>
  )
})

const styles = StyleSheet.create({
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
})
