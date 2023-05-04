import { Avatar, Icon } from '@rneui/themed'
import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native'
import store, { useStore } from '../../store'
import { handleShareUp, parseNumber } from '../../utils'
import { useUserRelation } from '../../api/user-relation'

import { useNavigation } from '@react-navigation/native'
import { NavigationProps } from '../../types'

export function HeaderLeft(props: {
  scrollTop: () => void
  style?: StyleProp<ViewStyle>
}) {
  const { dynamicUser } = useStore()
  const { data: fans } = useUserRelation(dynamicUser?.mid)
  const navigation = useNavigation<NavigationProps['navigation']>()
  const gotoWebPage = () => {
    const user = store.dynamicUser
    if (user) {
      navigation.navigate('WebPage', {
        url: `https://space.bilibili.com/${user?.mid}`,
        title: user?.name + '的主页',
      })
    }
  }
  return (
    <View style={[styles.left, props.style]}>
      <Pressable onPress={gotoWebPage}>
        <Avatar
          size={32}
          rounded
          source={{
            uri: dynamicUser?.face + '@240w_240h_1c.webp',
          }}
        />
      </Pressable>
      <Pressable
        style={styles.titleContainer}
        key={fans?.follower || '-'}
        onPress={() => {
          props.scrollTop()
        }}>
        <Text adjustsFontSizeToFit numberOfLines={1} style={styles.titleText}>
          {(dynamicUser?.name || '') + '  '}
        </Text>
      </Pressable>
      <Text style={styles.fansText}>{parseNumber(fans?.follower)}粉丝</Text>
    </View>
  )
}

export function HeaderRight() {
  return (
    <Pressable
      style={styles.right}
      onPress={() => {
        if (store.dynamicUser) {
          const { name, mid, sign } = store.dynamicUser
          handleShareUp(name, mid, sign)
        }
      }}>
      <Icon type="fontisto" name="share-a" size={13} color="#666" />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 110,
  },
  titleContainer: { flexShrink: 1, marginLeft: 10 },
  titleText: {
    fontSize: 18,
    // marginRight: 10,
  },
  fansText: { fontSize: 14 },
  right: {
    marginLeft: 10,
    padding: 5,
  },
})
