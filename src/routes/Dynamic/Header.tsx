import { Avatar, Button, Icon, Text, useTheme } from '@rneui/themed'
import React from 'react'
import { View, StyleSheet, Pressable, Linking } from 'react-native'
import store, { useStore } from '../../store'
import { handleShareUp, parseNumber, showToast } from '../../utils'
import { useUserRelation } from '../../api/user-relation'
import { Image } from 'expo-image'
import { useNavigation, useRoute } from '@react-navigation/native'
import { NavigationProps, RootStackParamList } from '../../types'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useUserInfo } from '../../api/user-info'
import { useLivingInfo } from '../../api/living-info'
import * as Clipboard from 'expo-clipboard'
import commonStyles from '../../styles'
import { Menu, MenuItem } from 'react-native-material-menu'

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
          source={{
            uri: dynamicUser?.face + '@120w_120h_1c.webp',
          }}
        />
      ) : null}
      <Pressable
        style={styles.titleContainer}
        onPress={() => {
          props.scrollTop()
        }}>
        <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.titleText]}>
          {userName + '   '}
          {fans ? (
            <Text style={[styles.fansText]}>
              {parseNumber(fans.follower)}粉丝
            </Text>
          ) : null}
        </Text>
      </Pressable>
      {sex ? (
        <Text
          style={[
            commonStyles.font13,
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

export const headerRight = () => <HeaderRight />

function HeaderRight() {
  const { theme } = useTheme()
  const route =
    useRoute<NativeStackScreenProps<RootStackParamList, 'Dynamic'>['route']>()
  const dynamicUser = route.params?.user
  const [visible, setVisible] = React.useState(false)
  const hideMenu = () => setVisible(false)
  const showMenu = () => setVisible(true)
  const { $followedUps } = useStore()
  const followed = $followedUps.find(v => v.mid == dynamicUser?.mid)

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
                store.$followedUps.unshift({
                  name: dynamicUser.name,
                  mid: dynamicUser.mid,
                  face: dynamicUser.face,
                  sign: dynamicUser.sign,
                })
                showToast('已关注')
              }
              hideMenu()
            }}>
            关注Up
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
          分享Up
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
  },
  fansText: { fontSize: 14 },
  right: {
    marginLeft: 10,
    padding: 5,
  },
})
