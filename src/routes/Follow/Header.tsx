import React from 'react'
import { View } from 'react-native'
import { Avatar, Icon, Text, useTheme } from '@rneui/themed'
import store, { useStore } from '../../store'

import { StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NavigationProps } from '../../types'
import { useUserRelation } from '../../api/user-relation'
import { parseNumber } from '../../utils'
import { reportNavigation } from '../../utils/report'

export default function Header() {
  const { $userInfo } = useStore()
  const navigation = useNavigation<NavigationProps['navigation']>()
  const { data: relation } = useUserRelation($userInfo?.mid)
  const fansCount = parseNumber(relation?.follower)
  const followedCount = parseNumber(relation?.following)
  const { theme } = useTheme()
  return (
    <View
      style={[
        styles.userContainer,
        { backgroundColor: theme.colors.background },
      ]}>
      <Avatar
        size={50}
        onPress={() => {
          if (store.$userInfo) {
            store.dynamicUser = {
              ...store.$userInfo,
            }
            navigation.navigate('Dynamic', {
              from: 'followed',
            })
          }
        }}
        rounded
        source={{ uri: $userInfo?.face }}
      />
      <View style={styles.right}>
        <View style={styles.nameContainer}>
          <Text>
            <Text style={[styles.myName]}>{$userInfo?.name}</Text>
            <Text style={[styles.fansNumText]}>
              {'    '}
              {fansCount}粉丝
              {'    '}
              {followedCount}关注
            </Text>
          </Text>
          <Icon
            onPress={() => {
              navigation.navigate('About')
              reportNavigation('About')
            }}
            style={styles.snow}
            name="snow"
            type="ionicon"
            size={18}
            color="#00AEEC"
          />
        </View>
        <Text style={[styles.mySign, { color: theme.colors.grey1 }]}>
          {$userInfo?.sign}
        </Text>
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
  mySign: { color: '#555', fontSize: 15 },
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
  snow: { padding: 6 },
})
