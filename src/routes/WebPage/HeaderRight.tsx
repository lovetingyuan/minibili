import { Icon, useTheme } from '@rneui/themed'
import React from 'react'
import { View, Linking, Share } from 'react-native'
import { useStore } from '../../store'
import { Menu, MenuItem } from 'react-native-material-menu'
import * as Clipboard from 'expo-clipboard'
import { RouteProp, useRoute } from '@react-navigation/native'
import { RootStackParamList } from '../../types'
import { showToast } from '../../utils'

export default React.memo(function HeaderRight(props: { reload: () => void }) {
  const { webViewMode, setWebViewMode } = useStore()
  const [visible, setVisible] = React.useState(false)
  const route = useRoute<RouteProp<RootStackParamList, 'WebPage'>>()
  const { url, title } = route.params
  const { theme } = useTheme()
  const hideMenu = () => setVisible(false)

  const showMenu = () => setVisible(true)

  return (
    <View className="flex-row items-center gap-3">
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
        <MenuItem
          textStyle={{ color: theme.colors.black }}
          pressColor={theme.colors.grey4}
          onPress={() => {
            setWebViewMode(webViewMode === 'MOBILE' ? 'PC' : 'MOBILE')
            hideMenu()
          }}>
          {webViewMode === 'MOBILE' ? '电脑模式' : '手机模式'}
        </MenuItem>
        <MenuItem
          textStyle={{ color: theme.colors.black }}
          pressColor={theme.colors.grey4}
          onPress={() => {
            hideMenu()
            Linking.openURL(url)
          }}>
          浏览器打开
        </MenuItem>
        <MenuItem
          textStyle={{ color: theme.colors.black }}
          pressColor={theme.colors.grey4}
          onPress={() => {
            hideMenu()
            props.reload()
          }}>
          刷新页面
        </MenuItem>
        <MenuItem
          textStyle={{ color: theme.colors.black }}
          pressColor={theme.colors.grey4}
          onPress={() => {
            Clipboard.setStringAsync(url).then(() => {
              showToast('已复制链接：' + url)
              hideMenu()
            })
          }}>
          复制链接
        </MenuItem>
        <MenuItem
          textStyle={{ color: theme.colors.black }}
          pressColor={theme.colors.grey4}
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
})
