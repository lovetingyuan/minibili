import { Avatar, Icon } from '@rneui/themed'
import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { UserInfo } from '../../store'
import { handleShareUp, parseNumber } from '../../utils'

export function HeaderLeft(props: {
  user: UserInfo
  fans?: number
  width: number
  gotoWebPage: () => void
  scrollTop: () => void
}) {
  const userName = props.user.name
  return (
    <View style={styles.left}>
      <Pressable onPress={props.gotoWebPage}>
        <Avatar
          size={32}
          containerStyle={{ marginRight: 12 }}
          rounded
          source={{
            uri: props.user.face + '@240w_240h_1c.webp',
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
              fontSize: userName
                ? Math.min((props.width * 0.45) / userName.length, 18)
                : 18,
            },
          ]}>
          {userName}的动态
        </Text>
      </Pressable>
      <Text style={{ fontSize: 14, marginLeft: 12 }}>
        {parseNumber(props.fans)}粉丝
      </Text>
    </View>
  )
}

export function HeaderRight(props: { user: UserInfo }) {
  return (
    <View style={styles.right}>
      <Pressable
        style={{ marginLeft: 10 }}
        onPress={() => {
          if (props.user) {
            handleShareUp(props.user.name, props.user.mid, props.user.sign)
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
