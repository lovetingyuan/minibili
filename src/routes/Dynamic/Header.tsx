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
import store from '../../store'
import { handleShareUp, parseNumber } from '../../utils'
import { useUserRelation } from '../../api/user-relation'
import { useSnapshot } from 'valtio'
import { useNavigation } from '@react-navigation/native'
import { NavigationProps } from '../../types'

export function HeaderLeft(props: {
  scrollTop: () => void
  style?: StyleProp<ViewStyle>
}) {
  const { dynamicUser: user } = useSnapshot(store)
  const { data: fans } = useUserRelation(user?.mid)
  const userName = user?.name
  const navigation = useNavigation<NavigationProps['navigation']>()
  const gotoWebPage = () => {
    navigation.navigate('WebPage', {
      url: `https://space.bilibili.com/${user?.mid}`,
      title: user?.name + '的主页',
    })
  }
  return (
    <View style={[styles.left, props.style]}>
      <Pressable onPress={gotoWebPage}>
        <Avatar
          size={32}
          containerStyle={{ marginRight: 12 }}
          rounded
          source={{
            uri: user?.face + '@240w_240h_1c.webp',
          }}
        />
      </Pressable>
      <Pressable
        onPress={() => {
          props.scrollTop()
        }}>
        <Text
          adjustsFontSizeToFit
          numberOfLines={2}
          ellipsizeMode="head"
          style={[
            {
              fontSize: 16,
            },
          ]}>
          {userName}的动态
        </Text>
      </Pressable>
      <Text style={{ fontSize: 14, marginLeft: 12 }}>
        {parseNumber(fans?.follower)}粉丝
      </Text>
    </View>
  )
}

export function HeaderRight() {
  const { dynamicUser: user } = useSnapshot(store)
  return (
    <View style={styles.right}>
      <Pressable
        style={{ marginLeft: 10 }}
        onPress={() => {
          if (user) {
            handleShareUp(user.name, user.mid, user.sign)
          }
        }}>
        <Icon type="fontisto" name="share-a" size={13} color="#666" />
      </Pressable>
    </View>
  )
}
const styles = StyleSheet.create({
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  // userName: {
  //   // fontSize: 18,
  //   // flexShrink: 1,
  //   flexWrap: 'wrap',
  // },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    // width: 200,
  },
})
