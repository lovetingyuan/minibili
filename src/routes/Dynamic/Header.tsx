import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Avatar, Button, Icon, Text } from '@rneui/themed'
import * as Clipboard from 'expo-clipboard'
import { Image } from 'expo-image'
import React from 'react'
import { Linking, View } from 'react-native'
import { Menu, MenuItem } from 'react-native-material-menu'

import { colors } from '@/constants/colors.tw'

import { useLivingInfo } from '../../api/living-info'
import { useUserInfo } from '../../api/user-info'
import { useUserRelation } from '../../api/user-relation'
import { useStore } from '../../store'
import type { NavigationProps, RootStackParamList } from '../../types'
import { handleShareUp, imgUrl, parseNumber, showToast } from '../../utils'

const levelList = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']

export function HeaderLeft(props: { scrollTop: () => void }) {
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
  const level = dynamicUser?.level ? 'ᴸⱽ' + levelList[dynamicUser.level] : ''
  const userName = dynamicUser?.name ? dynamicUser.name + level : ''
  const sex =
    dynamicUser?.sex === '男' ? '♂️' : dynamicUser?.sex === '女' ? '♀️' : ''
  const { _followedUpsMap } = useStore()
  const followed = dynamicUser?.mid && dynamicUser.mid in _followedUpsMap
  return (
    <View className="flex-row items-center mr-28 left-[-12px] relative">
      {dynamicUser?.face ? (
        <View className="relative">
          <Avatar
            size={33}
            rounded
            onPress={gotoWebPage}
            ImageComponent={Image}
            source={{
              uri: imgUrl(dynamicUser.face, 120),
            }}
          />
          {sex ? (
            <Text className="text-xs opacity-80 absolute top-0 right-[-8px]">
              {sex}
            </Text>
          ) : null}
        </View>
      ) : null}

      <Text
        className="ml-3 text-lg relative top-[2px] leading-5 align-middle"
        adjustsFontSizeToFit
        numberOfLines={2}>
        <Text
          onPress={() => {
            props.scrollTop()
          }}>
          {userName + '   '}
        </Text>
        {fans ? (
          <Text
            className="text-sm text-gray-500 dark:text-gray-400"
            onPress={() => {
              showToast(`粉丝：${fans.follower}`)
            }}>
            {parseNumber(fans.follower)}粉丝
          </Text>
        ) : null}
      </Text>
      {followed ? (
        <Icon
          size={15}
          name="checkbox-marked-circle-outline"
          type="material-community"
          className="relative top-[1px] ml-2"
          onPress={() => {
            showToast('已关注')
          }}
          color={tw(colors.secondary.text).color}
        />
      ) : null}
      {dynamicUser.mid && livingUrl ? (
        <Button
          size="sm"
          type="clear"
          buttonStyle={tw('ml-[10px] mr-[10px]')}
          titleStyle={tw('text-sm')}
          onPress={() => {
            if (dynamicUser.mid) {
              navigation.navigate('WebPage', {
                title: dynamicUser.name + '的直播间',
                url: livingUrl,
              })
            }
          }}>
          直播中
        </Button>
      ) : null}
    </View>
  )
}

export const headerRight = () => <HeaderRight />

function HeaderRight() {
  const route =
    useRoute<NativeStackScreenProps<RootStackParamList, 'Dynamic'>['route']>()
  const dynamicUser = route.params?.user
  const [visible, setVisible] = React.useState(false)
  const hideMenu = () => setVisible(false)
  const showMenu = () => setVisible(true)
  const { get$followedUps, _followedUpsMap, set$followedUps } = useStore()
  const followed = dynamicUser?.mid && dynamicUser.mid in _followedUpsMap
  return (
    <View className="flex-row items-center gap-2">
      <Menu
        visible={visible}
        // @ts-expect-error className will be handled
        className="bg-white dark:bg-zinc-900"
        anchor={
          <Icon
            name="dots-vertical"
            type="material-community"
            onPress={showMenu}
          />
        }
        onRequestClose={hideMenu}>
        {!followed && (
          <MenuItem
            textStyle={tw('text-black dark:text-gray-300')}
            pressColor={tw(colors.gray4.text).color}
            onPress={() => {
              if (dynamicUser) {
                set$followedUps([
                  {
                    name: dynamicUser.name,
                    mid: dynamicUser.mid,
                    face: dynamicUser.face,
                    sign: dynamicUser.sign,
                  },
                  ...get$followedUps(),
                ])
                showToast('已关注')
              }
              hideMenu()
            }}>
            关注UP
          </MenuItem>
        )}
        <MenuItem
          textStyle={tw('text-black dark:text-gray-300')}
          pressColor={tw(colors.gray4.text).color}
          onPress={() => {
            if (dynamicUser) {
              const { name, mid, sign } = dynamicUser
              handleShareUp(name, mid, sign)
            }
            hideMenu()
          }}>
          分享UP
        </MenuItem>
        <MenuItem
          textStyle={tw(' text-black dark:text-gray-300')}
          pressColor={tw(colors.gray4.text).color}
          onPress={() => {
            if (dynamicUser?.face) {
              Linking.openURL(dynamicUser.face)
            }
            hideMenu()
          }}>
          查看头像
        </MenuItem>
        <MenuItem
          textStyle={tw(' text-black dark:text-gray-300')}
          pressColor={tw(colors.gray4.text).color}
          onPress={() => {
            if (!dynamicUser) {
              return
            }
            Clipboard.setStringAsync(dynamicUser.name).then(() => {
              showToast('已复制用户名')
              hideMenu()
            })
          }}>
          复制用户名
        </MenuItem>
        <MenuItem
          textStyle={tw(' text-black dark:text-gray-300')}
          pressColor={tw(colors.gray4.text).color}
          onPress={() => {
            if (!dynamicUser) {
              return
            }
            Clipboard.setStringAsync(dynamicUser.mid + '').then(() => {
              showToast('已复制用户ID')
              hideMenu()
            })
          }}>
          复制用户ID
        </MenuItem>
        <MenuItem
          textStyle={tw(' text-black dark:text-gray-300')}
          pressColor={tw(colors.gray4.text).color}
          onPress={() => {
            if (!dynamicUser) {
              return
            }
            Linking.openURL(`https://space.bilibili.com/${dynamicUser.mid}`)
            hideMenu()
          }}>
          浏览器打开
        </MenuItem>
      </Menu>
    </View>
  )
}
