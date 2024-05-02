import { type RouteProp, useRoute } from '@react-navigation/native'
import { Icon } from '@rneui/themed'
import * as Clipboard from 'expo-clipboard'
import React from 'react'
import { Linking, Share, View } from 'react-native'
import { Menu, MenuItem } from 'react-native-material-menu'

import { colors } from '@/constants/colors.tw'

import { useStore } from '../../store'
import type { RootStackParamList } from '../../types'
import { showToast } from '../../utils'

export default React.memo(HeaderRight)

function HeaderRight(props: { reload: () => void }) {
  const { webViewMode, setWebViewMode } = useStore()
  const [visible, setVisible] = React.useState(false)
  const route = useRoute<RouteProp<RootStackParamList, 'WebPage'>>()
  const { url, title } = route.params
  const hideMenu = () => setVisible(false)

  const showMenu = () => setVisible(true)

  return (
    <View className="flex-row items-center gap-3">
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
        <MenuItem
          textStyle={tw('text-black dark:text-gray-300')}
          pressColor={tw(colors.gray4.text).color}
          onPress={() => {
            setWebViewMode(webViewMode === 'MOBILE' ? 'PC' : 'MOBILE')
            hideMenu()
          }}>
          {webViewMode === 'MOBILE' ? '电脑模式' : '手机模式'}
        </MenuItem>
        <MenuItem
          textStyle={tw('text-black dark:text-gray-300')}
          pressColor={tw(colors.gray4.text).color}
          onPress={() => {
            hideMenu()
            Linking.openURL(url)
          }}>
          浏览器打开
        </MenuItem>
        <MenuItem
          textStyle={tw('text-black dark:text-gray-300')}
          pressColor={tw(colors.gray4.text).color}
          onPress={() => {
            hideMenu()
            props.reload()
          }}>
          刷新页面
        </MenuItem>
        <MenuItem
          textStyle={tw('text-black dark:text-gray-300')}
          pressColor={tw(colors.gray4.text).color}
          onPress={() => {
            Clipboard.setStringAsync(url).then(() => {
              showToast(`已复制链接：${url}`)
              hideMenu()
            })
          }}>
          复制链接
        </MenuItem>
        <MenuItem
          textStyle={tw('text-black dark:text-gray-300')}
          pressColor={tw(colors.gray4.text).color}
          onPress={() => {
            hideMenu()
            Share.share({
              message: [title, url].filter(Boolean).join('\n'),
            })
          }}>
          分享页面
        </MenuItem>
      </Menu>
    </View>
  )
}
