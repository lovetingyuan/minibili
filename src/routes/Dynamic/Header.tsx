import { Avatar, Button, Icon, Text, useTheme } from '@rneui/themed'
import React from 'react'
import { View, StyleSheet, Pressable, StyleProp, ViewStyle } from 'react-native'
import { useStore } from '../../store'
import { handleShareUp, parseNumber } from '../../utils'
import { useUserRelation } from '../../api/user-relation'

import { useNavigation, useRoute } from '@react-navigation/native'
import { NavigationProps, RootStackParamList } from '../../types'
import { NativeStackScreenProps } from '@react-navigation/native-stack'

export function HeaderLeft(props: {
  scrollTop: () => void
  style?: StyleProp<ViewStyle>
}) {
  const { livingUps } = useStore()
  const route =
    useRoute<NativeStackScreenProps<RootStackParamList, 'Dynamic'>['route']>()
  const dynamicUser = route.params?.user
  const { data: fans } = useUserRelation(dynamicUser?.mid)
  const navigation = useNavigation<NavigationProps['navigation']>()
  const gotoWebPage = () => {
    if (dynamicUser) {
      navigation.navigate('WebPage', {
        url: `https://space.bilibili.com/${dynamicUser.mid}`,
        title: dynamicUser.name + '的主页',
      })
    }
  }
  return (
    <View style={[styles.left, props.style]}>
      <Avatar
        size={33}
        rounded
        onPress={gotoWebPage}
        source={{
          uri: dynamicUser?.face + '@240w_240h_1c.webp',
        }}
      />
      <Pressable
        style={styles.titleContainer}
        key={fans?.follower || '-'}
        onPress={() => {
          props.scrollTop()
        }}>
        <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.titleText]}>
          {(dynamicUser?.name || '') + '  '}
        </Text>
      </Pressable>
      <Text style={[styles.fansText]}>{parseNumber(fans?.follower)}粉丝</Text>
      {dynamicUser && livingUps[dynamicUser.mid] ? (
        <Button
          size="sm"
          type="clear"
          buttonStyle={{ marginLeft: 10 }}
          onPress={() => {
            if (dynamicUser) {
              navigation.navigate('WebPage', {
                title: dynamicUser.name + '的直播间',
                url: livingUps[dynamicUser.mid],
              })
            }
          }}>
          直播中
        </Button>
      ) : null}
    </View>
  )
}

export function HeaderRight() {
  const { theme } = useTheme()
  const route =
    useRoute<NativeStackScreenProps<RootStackParamList, 'Dynamic'>['route']>()
  const dynamicUser = route.params?.user
  return (
    <Pressable
      style={styles.right}
      onPress={() => {
        if (dynamicUser) {
          const { name, mid, sign } = dynamicUser
          handleShareUp(name, mid, sign)
        }
      }}>
      <Icon
        type="fontisto"
        name="share-a"
        size={13}
        color={theme.colors.grey1}
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 110,
  },
  titleContainer: { flexShrink: 1, marginLeft: 12 },
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
