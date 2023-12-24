import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useStore } from '../../store'
import { Button, Text } from '@rneui/themed'
import React from 'react'
import { Icon } from '@rneui/base'
import { useNavigation } from '@react-navigation/native'
import { NavigationProps } from '../../types'

const HeaderTitle = () => {
  const { checkingUpUpdate, $followedUps, updatedCount } = useStore()
  const count = $followedUps.length
  return (
    <View style={styles.titleContainer}>
      <Text style={styles.titleText}>
        关注的UP
        {count
          ? updatedCount
            ? ` (${updatedCount}/${count})`
            : ` (${count})`
          : ''}
      </Text>
      {checkingUpUpdate ? (
        <ActivityIndicator size={'small'} color={'#F85A54'} />
      ) : null}
    </View>
  )
}

export const followHeaderTitle = () => <HeaderTitle />

const HeaderRight = () => {
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

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: { fontSize: 18, fontWeight: '600', marginRight: 10 },
})
