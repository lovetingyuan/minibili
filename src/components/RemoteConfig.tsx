import { Dialog, Text } from '@rn-vui/themed'
import React from 'react'
import { Linking } from 'react-native'

import { setUA } from '@/constants'
import { colors } from '@/constants/colors.tw'

import { useRemoteConfig } from '../api/remote-config'
import Modal2 from './Modal2'

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
        overlayStyle={tw(colors.gray2.bg)}
        ModalComponent={Modal2 as unknown as typeof React.Component}
        backdropStyle={tw('bg-neutral-900/90')}
        onBackdropPress={
          remoteConfig.statement.dismiss ? toggleDialog : undefined
        }>
        <Dialog.Title
          title={remoteConfig.statement.title}
          titleStyle={tw(colors.black.text)}
        />
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
