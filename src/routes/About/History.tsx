import { useNavigation } from '@react-navigation/native'
import React from 'react'

import type { NavigationProps } from '@/types'

import TextAction from './TextAction'

function Collect() {
  const navigation = useNavigation<NavigationProps['navigation']>()

  return (
    <TextAction
      text="⏰ 观看历史"
      buttons={[
        {
          text: '查看记录',
          onPress: () => {
            navigation.navigate('History')
          },
        },
      ]}
    />
  )
}

export default React.memo(Collect)
