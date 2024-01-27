import { View } from 'react-native'
import { useStore } from '../../store'
import { Button, Text } from '@rneui/themed'
import React from 'react'
import { Icon } from '@rneui/base'
import { useNavigation } from '@react-navigation/native'
import { NavigationProps } from '../../types'

function HeaderTitle() {
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
      {/* {checkingUpUpdate ? (
        <ActivityIndicator size={'small'} color={'#F85A54'} />
      ) : null} */}
    </View>
  )
}

export const followHeaderTitle = () => <HeaderTitle />

function HeaderRight() {
  const navigation = useNavigation<NavigationProps['navigation']>()

  return (
    <Button
      radius={'sm'}
      type="clear"
      onPress={() => {
        navigation.navigate('About')
      }}>
      <Icon name="snow" type="ionicon" size={20} color="#00AEEC" />
    </Button>
  )
}

export const followHeaderRight = () => <HeaderRight />
