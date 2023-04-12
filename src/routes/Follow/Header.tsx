import React from 'react'
import { Text, View, Pressable, Image } from 'react-native'
import { Avatar } from '@rneui/themed'
import store from '../../store'
import { useSnapshot } from 'valtio'
import { StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NavigationProps } from '../../types'
import { useUserInfo } from '../../api/user-info'
import { useUserRelation } from '../../api/user-relation'
import { parseNumber } from '../../utils'

export default function Header() {
  const { $userInfo } = useSnapshot(store)
  const navigation = useNavigation<NavigationProps['navigation']>()

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
        size={55}
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
            : require('../../../assets/empty-avatar.png')
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
          navigation.navigate('About')
        }}>
        <Image
          source={require('../../../assets/snow.png')}
          style={styles.infoFace}
        />
      </Pressable>
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
    paddingHorizontal: 18,
    paddingTop: 50,
    paddingBottom: 15,
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