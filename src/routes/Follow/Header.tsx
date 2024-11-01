import { useNavigation } from '@react-navigation/native'
import { Button, Icon } from '@rneui/themed'
import React from 'react'
import { View } from 'react-native'

import { colors } from '@/constants/colors.tw'

import type { NavigationProps } from '../../types'

export function HeaderRight() {
  const navigation = useNavigation<NavigationProps['navigation']>()

  return (
    <View className="flex-row items-center gap-1">
      <Button
        radius={'sm'}
        type="clear"
        onPress={() => {
          navigation.navigate('SearchUps')
        }}>
        <Icon name="search" color={tw(colors.gray7.text).color} size={24} />
      </Button>
      <Button
        radius={'sm'}
        type="clear"
        onPress={() => {
          navigation.navigate('About')
        }}>
        <Icon
          name="snow"
          type="ionicon"
          size={20}
          color={tw(colors.primary.text).color}
        />
      </Button>
    </View>
  )
}

export const followHeaderRight = () => {
  return <HeaderRight />
}
