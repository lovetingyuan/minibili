import { Dialog, Text } from '@rneui/themed'
import React from 'react'
import { Linking } from 'react-native'

import { setUA } from '@/constants'

import { useRemoteConfig } from '../api/remote-config'

export default function RemoteConfig() {
  const remoteConfig = useRemoteConfig()
  const [visible, setVisible] = React.useState(true)
  const toggleDialog = () => {
    setVisible(!visible)
  }
  // const { setUserAgent } = useStore()
  if (!remoteConfig) {
    return null
  }
  // remoteConfig.statement.show = true
  // remoteConfig.statement.dismiss = false
  if (remoteConfig.statement.show) {
    return (
      <Dialog
        isVisible={visible}
        // overlayStyle={{ opacity: 0.8 }}
        backdropStyle={tw('bg-neutral-900/90')}
        onBackdropPress={
          remoteConfig.statement.dismiss ? toggleDialog : undefined
        }>
        <Dialog.Title title={remoteConfig.statement.title} />
        <Text>{remoteConfig.statement.content}</Text>
        <Dialog.Actions>
          {remoteConfig.statement.dismiss ? (
            <Dialog.Button title="关闭" onPress={() => toggleDialog()} />
          ) : null}
          {remoteConfig.statement.url ? (
            <Dialog.Button
              title="详情"
              onPress={() => {
                Linking.openURL(remoteConfig.statement.url!)
              }}
            />
          ) : null}
        </Dialog.Actions>
      </Dialog>
    )
  }
  if (remoteConfig.userAgent) {
    setUA(remoteConfig.userAgent)
  }
  return null
}
