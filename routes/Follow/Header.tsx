import React from 'react'
import { Text, View, Pressable, Image } from 'react-native'
import { Avatar } from '@rneui/base'

import ButtonsOverlay from '../../components/ButtonsOverlay'
import store from '../../store'
import { useSnapshot } from 'valtio'
import { StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NavigationProps } from '../../types'
import { Alert } from 'react-native'
import { useUserInfo } from '../../api/user-info'
import { useUserFans } from '../../api/user-fans'

const buttons = [
  {
    text: '退出',
    name: 'logout',
  },
  {
    text: '关于',
    name: 'about',
  },
]

export default function Header(props: {
  followedCount: number
  logOut: () => void
}) {
  const { $userInfo } = useSnapshot(store)
  const navigation = useNavigation<NavigationProps['navigation']>()
  const [modalVisible, setModalVisible] = React.useState(false)

  const { data } = useUserInfo($userInfo?.mid)
  if (data?.mid) {
    if (!store.$userInfo) {
      store.$userInfo = {
        name: data.name,
        face: data.face,
        sign: data.sign,
        mid: data.mid + '',
      }
    }
    if (!store.dynamicUser) {
      store.dynamicUser = { ...store.$userInfo }
    }
  }
  const { data: fansCount } = useUserFans($userInfo?.mid)
  if (!$userInfo) {
    return <View style={styles.userContainer} />
  }

  return (
    <View style={styles.userContainer}>
      <Avatar
        size={60}
        containerStyle={{ marginRight: 16 }}
        onPress={() => {
          if ($userInfo) {
            store.dynamicUser = {
              ...$userInfo,
            }
            navigation.navigate('Dynamic', {
              from: 'followed',
            })
          }
        }}
        rounded
        source={
          $userInfo.face
            ? { uri: $userInfo.face }
            : require('../../assets/empty-avatar.png')
        }
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.myName}>
          {$userInfo.name}
          <Text style={styles.fansNumText}>
            {'    '}
            {fansCount}粉丝
            {'    '}
            {props.followedCount}关注
          </Text>
        </Text>
        <Text style={styles.mySign}>{$userInfo.sign}</Text>
      </View>
      <Pressable
        onPress={() => {
          setModalVisible(true)
        }}>
        <Image
          source={require('../../assets/snow.png')}
          style={styles.infoFace}
        />
      </Pressable>
      <ButtonsOverlay
        buttons={buttons}
        visible={modalVisible}
        onPress={(name: string) => {
          if (name === 'logout') {
            Alert.alert('确定退出吗？', '', [
              {
                text: '取消',
              },
              {
                text: '确定',
                onPress: () => {
                  props.logOut()
                },
              },
            ])
          } else if (name === 'about') {
            navigation.navigate('About')
          }
        }}
        dismiss={() => {
          setModalVisible(false)
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  myName: { fontSize: 18, fontWeight: 'bold' },
  mySign: { color: '#555', marginTop: 6 },
  fansNumText: { fontSize: 14, fontWeight: 'normal' },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingTop: 50,
    backgroundColor: 'white',
  },
  infoFace: {
    width: 20,
    height: 20,
    marginRight: 10,
    position: 'relative',
    top: -10,
  },
})
