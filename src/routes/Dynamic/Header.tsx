import { Avatar, Button, Icon, Text } from '@rneui/themed'
import React from 'react'
import { View, Pressable, Linking } from 'react-native'
import { useStore } from '../../store'
import { handleShareUp, imgUrl, parseNumber, showToast } from '../../utils'
import { useUserRelation } from '../../api/user-relation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { NavigationProps, RootStackParamList } from '../../types'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useUserInfo } from '../../api/user-info'
import { useLivingInfo } from '../../api/living-info'
import * as Clipboard from 'expo-clipboard'
import { Image } from 'expo-image'
import { Menu, MenuItem } from 'react-native-material-menu'
import { colors } from '@/constants/colors.tw'

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
  const level = dynamicUser?.level ? 'ᴸ' + levelList[dynamicUser.level] : ''
  const userName = dynamicUser?.name ? dynamicUser.name + level : ''
  const sex =
    dynamicUser?.sex === '男' ? '♂️' : dynamicUser?.sex === '女' ? '♀️' : ''
  const { _followedUpsMap } = useStore()
  const followed = dynamicUser?.mid && dynamicUser.mid in _followedUpsMap
  return (
    <View className="flex-row items-center mr-28 left-[-12px] relative">
      {dynamicUser?.face ? (
        <Avatar
          size={33}
          rounded
          onPress={gotoWebPage}
          ImageComponent={Image}
          source={{
            uri: imgUrl(dynamicUser.face, 120),
          }}
        />
      ) : null}
      <Pressable
        className="shrink ml-3"
        onPress={() => {
          props.scrollTop()
        }}>
        <Text
          className="text-lg relative top-[2px] leading-5"
          adjustsFontSizeToFit
          numberOfLines={1}>
          {userName + '   '}
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
      </Pressable>
      {followed ? (
        <Icon
          size={15}
          name="checkbox-marked-circle-outline"
          type="material-community"
          className="relative top-[1px] ml-2"
          color={tw(colors.secondary.text).color}
        />
      ) : null}
      {sex ? <Text className="text-sm ml-2   opacity-80">{sex}</Text> : null}
      {dynamicUser.mid && livingUrl ? (
        <Button
          size="sm"
          type="clear"
          buttonStyle={tw('ml-[10px]')}
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
