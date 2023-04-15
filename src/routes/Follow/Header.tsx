import React from 'react'
import { Text, View, Pressable } from 'react-native'
import { Avatar, Icon } from '@rneui/themed'
import store from '../../store'
import { useSnapshot } from 'valtio'
import { StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NavigationProps } from '../../types'
import { useUserRelation } from '../../api/user-relation'
import { parseNumber } from '../../utils'

export default function Header() {
  const { $userInfo } = useSnapshot(store)
  const navigation = useNavigation<NavigationProps['navigation']>()
  const { data: relation } = useUserRelation($userInfo?.mid)
  const fansCount = parseNumber(relation?.follower)
  const followedCount = parseNumber(relation?.following)
  if (!$userInfo) {
    return null
  }
  return (
    <View style={styles.userContainer}>
      <Avatar
        size={55}
        onPress={() => {
          store.dynamicUser = {
            ...$userInfo,
          }
          navigation.navigate('Dynamic', {
            from: 'followed',
          })
        }}
        rounded
        source={{ uri: $userInfo?.face }}
      />
      <View style={styles.right}>
        <View style={styles.nameContainer}>
          <Text>
            <Text style={styles.myName}>{$userInfo.name}</Text>
            <Text style={styles.fansNumText}>
              {'    '}
              {fansCount}粉丝
              {'    '}
              {followedCount}关注
            </Text>
          </Text>
          <Pressable
            style={{ padding: 5 }}
            onPress={() => {
              navigation.navigate('About')
            }}>
            <Icon name="snow" type="ionicon" size={18} color="#00AEEC" />
          </Pressable>
        </View>
        <Text style={styles.mySign}>{$userInfo.sign}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  right: { flex: 1, marginLeft: 16 },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  myName: { fontSize: 20, fontWeight: 'bold' },
  mySign: { color: '#555', marginTop: 5, fontSize: 15 },
  fansNumText: { fontSize: 14 },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 45,
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
