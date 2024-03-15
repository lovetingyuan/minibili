import { useNavigation } from '@react-navigation/native'
import React from 'react'

import { NavigationProps } from '@/types'

import TextAction from './TextAction'

function Collect() {
  const navigation = useNavigation<NavigationProps['navigation']>()

  return (
    <TextAction
      text="⭐️ 我的收藏"
      buttons={[
        {
          text: '查看',
          onPress: () => {
            navigation.navigate('Collect')
          },
        },
      ]}
    />
  )
}

export default React.memo(Collect)
