import { Avatar, Button, Icon, Text, useTheme } from '@rneui/themed'
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
  const { theme } = useTheme()
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
    <View className="flex-row items-center mr-27 left-[-10px] relative">
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
        <Text className="text-lg" adjustsFontSizeToFit numberOfLines={1}>
          {userName + '   '}
          {fans ? (
            <Text className="text-sm" style={{ color: theme.colors.grey2 }}>
              {parseNumber(fans.follower)}粉丝
            </Text>
          ) : null}
        </Text>
      </Pressable>
      {sex ? <Text className="text-sm">{'  ' + sex}</Text> : null}
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
  const { theme } = useTheme()
  const route =
    useRoute<NativeStackScreenProps<RootStackParamList, 'Dynamic'>['route']>()
  const dynamicUser = route.params?.user
  const [visible, setVisible] = React.useState(false)
  const hideMenu = () => setVisible(false)
  const showMenu = () => setVisible(true)
  const { $followedUps, set$followedUps } = useStore()
  const followed = $followedUps.find(v => v.mid == dynamicUser?.mid)

  return (
    <View className="flex-row items-center gap-2">
      <Menu
        visible={visible}
        style={{ backgroundColor: theme.colors.background }}
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
            textStyle={{ color: theme.colors.black }}
            pressColor={theme.colors.grey4}
            onPress={() => {
              if (dynamicUser) {
                set$followedUps([
                  {
                    name: dynamicUser.name,
                    mid: dynamicUser.mid,
                    face: dynamicUser.face,
                    sign: dynamicUser.sign,
                  },
                  ...$followedUps,
                ])
                showToast('已关注')
              }
              hideMenu()
            }}>
            关注UP
          </MenuItem>
        )}
        <MenuItem
          textStyle={{ color: theme.colors.black }}
          pressColor={theme.colors.grey4}
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
          textStyle={{ color: theme.colors.black }}
          pressColor={theme.colors.grey4}
          onPress={() => {
            if (dynamicUser?.face) {
              Linking.openURL(dynamicUser.face)
            }
            hideMenu()
          }}>
          查看头像
        </MenuItem>
        <MenuItem
          textStyle={{ color: theme.colors.black }}
          pressColor={theme.colors.grey4}
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
          textStyle={{ color: theme.colors.black }}
          pressColor={theme.colors.grey4}
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
          textStyle={{ color: theme.colors.black }}
          pressColor={theme.colors.grey4}
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
