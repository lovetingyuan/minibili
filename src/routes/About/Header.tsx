import { Button, Icon } from '@rneui/themed'
import React from 'react'
import { Share } from 'react-native'

import { site } from '@/constants'

export const headerRight = () => (
  <Button
    type="clear"
    size="sm"
    onPress={() => {
      Share.share({
        message: `MiniBili - 简单的B站浏览\n点击下载：${site}`,
      })
    }}>
    <Icon name="share" type="material-community" />
  </Button>
)
