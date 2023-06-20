import React from 'react'
import { Linking } from 'react-native'
import { site } from '../../constants'
import { Button } from '@rneui/themed'

export default () => (
  <Button
    type="clear"
    size="sm"
    onPress={() => {
      Linking.openURL(site + '?showchangelog=true')
    }}>
    更新日志
  </Button>
)
