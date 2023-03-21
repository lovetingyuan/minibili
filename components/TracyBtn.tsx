import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { FAB, Avatar } from '@rneui/base'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../types'
import { useSnapshot } from 'valtio'
import store from '../valtio/store'

type NavigationProps = NativeStackScreenProps<RootStackParamList>

export default function TracyBtn() {
  const navigation = useNavigation<NavigationProps['navigation']>()
  const { specialUser } = useSnapshot(store)
  if (!specialUser) {
    return null
  }
  return (
    <FAB
      visible={true}
      icon={
        <Avatar
          size={56}
          rounded
          source={{
            uri: specialUser.face,
          }}
        />
      }
      color="#fb7299"
      placement="right"
      onPress={() => {
        store.dynamicUser = { ...specialUser }
        setTimeout(() => {
          navigation.navigate('Dynamic', { ...specialUser })
        }, 200)
      }}
    />
  )
}
