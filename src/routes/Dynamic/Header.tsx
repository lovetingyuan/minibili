import { Avatar, Button, Icon, Text, useTheme } from '@rneui/themed'
import React from 'react'
import { View, StyleSheet, Pressable, Linking } from 'react-native'
import store, { useStore } from '../../store'
import { handleShareUp, parseNumber } from '../../utils'
import { useUserRelation } from '../../api/user-relation'
import { Image } from 'expo-image'
import { useNavigation, useRoute } from '@react-navigation/native'
import { NavigationProps, RootStackParamList } from '../../types'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useUserInfo } from '../../api/user-info'
import { useLivingInfo } from '../../api/living-info'

const levelList = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']

export function HeaderLeft(props: { scrollTop: () => void }) {
  const { livingUps } = useStore()
  const route =
    useRoute<NativeStackScreenProps<RootStackParamList, 'Dynamic'>['route']>()
  const { data: userInfo } = useUserInfo(route.params?.user.mid)
  const { livingUrl } = useLivingInfo(route.params?.user.mid)
  const dynamicUser = {
    ...route.params?.user,
    ...userInfo,
  }
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
  const level = dynamicUser?.level ? 'ᴸ' + levelList[dynamicUser.level] : ''
  const userName = dynamicUser?.name ? dynamicUser.name + level : ''
  const sex =
    dynamicUser?.sex === '男' ? '♂️' : dynamicUser?.sex === '女' ? '♀️' : ''
  return (
    <View style={[styles.left]}>
      {dynamicUser?.face ? (
        <Avatar
          size={33}
          rounded
          ImageComponent={Image}
          onPress={gotoWebPage}
          onLongPress={() => {
            store.overlayButtons = [
              {
                text: '查看头像',
                onPress: () => {
                  if (dynamicUser?.face) {
                    Linking.openURL(dynamicUser.face)
                  }
                },
              },
            ]
          }}
          source={{
            uri: dynamicUser?.face + '@120w_120h_1c.webp',
          }}
        />
      ) : null}
      <Pressable
        style={styles.titleContainer}
        key={fans?.follower || '-'}
        onPress={() => {
          props.scrollTop()
        }}>
        <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.titleText]}>
          {userName + '  '}
        </Text>
      </Pressable>
      {fans ? (
        <Text style={[styles.fansText]}>{parseNumber(fans.follower)}粉丝</Text>
      ) : null}
      {sex ? (
        <Text
          style={[
            { fontSize: 13 },
            dynamicUser?.sex === '女'
              ? {
                  color: '#FF6699',
                }
              : null,
          ]}>
          {' ' + sex}
        </Text>
      ) : null}
      {dynamicUser.mid && (livingUps[dynamicUser.mid] || livingUrl) ? (
        <Button
          size="sm"
          type="clear"
          buttonStyle={{ marginLeft: 10 }}
          onPress={() => {
            if (dynamicUser.mid) {
              navigation.navigate('WebPage', {
                title: dynamicUser.name + '的直播间',
                url: livingUps[dynamicUser.mid] || livingUrl,
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
    position: 'relative',
    left: -10,
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
