import { Button } from '@rneui/themed'
import React from 'react'
import { Linking } from 'react-native'

export const headerRight = () => (
  <Button
    type="clear"
    size="sm"
    onPress={() => {
      Linking.openURL('https://minibili.tingyuan.in')
    }}>
    更新日志
  </Button>
)
