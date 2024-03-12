import { useNavigation } from '@react-navigation/native'
import { Icon } from '@rneui/base'
import { Button, Text } from '@rneui/themed'
import React from 'react'
import { View } from 'react-native'

import { colors } from '@/constants/colors.tw'

import { useStore } from '../../store'
import type { NavigationProps } from '../../types'

export function HeaderTitle() {
  const { $followedUps, _updatedCount } = useStore()
  const count = $followedUps.length
  return (
    <View className="flex-row items-center">
      <Text className="text-lg font-semibold mr-3">
        关注的UP
        {count
          ? _updatedCount
            ? ` (${_updatedCount}/${count})`
            : ` (${count})`
          : ''}
      </Text>
    </View>
  )
}

export const followHeaderTitle = () => <HeaderTitle />

export function HeaderRight() {
  const navigation = useNavigation<NavigationProps['navigation']>()

  return (
    <View className="gap-4 flex-row items-center">
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
      <Icon
        name="search"
        size={24}
        onPress={() => {
          navigation.navigate('SearchUps')
        }}
      />
    </View>
  )
}

export const followHeaderRight = () => {
  return <HeaderRight />
}
