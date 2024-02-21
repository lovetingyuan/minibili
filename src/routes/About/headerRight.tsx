import { Button } from '@rneui/themed'
import React from 'react'
import { Linking } from 'react-native'

import { site } from '../../constants'
// import { s } from '../../styles'

export default () => (
  <Button
    type="clear"
    size="sm"
    // titleStyle={s.t`text-sm`}
    onPress={() => {
      Linking.openURL(site + '?showchangelog=true')
    }}>
    更新日志
  </Button>
)
