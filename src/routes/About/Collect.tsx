import { useNavigation } from '@react-navigation/native'
import React from 'react'

import type { NavigationProps } from '@/types'

import TextAction from './TextAction'

function MyCollect() {
  const navigation = useNavigation<NavigationProps['navigation']>()

  return (
    <TextAction
      text="⭐️ 我的收藏"
      buttons={[
        {
          text: '查看收藏',
          onPress: () => {
            navigation.navigate('Collect')
          },
        },
      ]}
    />
  )
}

export default React.memo(MyCollect)
