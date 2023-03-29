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
import { useUserRelation } from '../../api/user-relation'
import { parseNumber } from '../../utils'

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

const logOut = () => {
  store.$userInfo = null
  store.updatedUps = {}
  store.dynamicUser = null
  store.$followedUps = []
}
export default function Header() {
  const { $userInfo } = useSnapshot(store)
  const navigation = useNavigation<NavigationProps['navigation']>()
  const [modalVisible, setModalVisible] = React.useState(false)

  const { data: user } = useUserInfo($userInfo?.mid)
  const { data: relation } = useUserRelation($userInfo?.mid)

  if (!$userInfo) {
    return <View style={styles.userContainer} />
  }
  if (user?.mid) {
    if (!store.$userInfo) {
      store.$userInfo = {
        name: user.name,
        face: user.face,
        sign: user.sign,
        mid: user.mid + '',
      }
    }
    if (!store.dynamicUser) {
      store.dynamicUser = { ...store.$userInfo }
    }
  }
  const fansCount = parseNumber(relation?.follower)
  const followedCount = parseNumber(relation?.following)
  return (
    <View style={styles.userContainer}>
      <Avatar
        size={60}
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
      <View style={styles.right}>
        <Text style={styles.myName}>
          {$userInfo.name}
          <Text style={styles.fansNumText}>
            {'    '}
            {fansCount}粉丝
            {'    '}
            {followedCount}关注
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
                onPress: logOut,
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
  right: { flex: 1, marginLeft: 16 },
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
