import { Icon } from '@rneui/themed'
import React from 'react'
import { View, Linking, Share } from 'react-native'
import store, { useStore } from '../../store'
import { Menu, MenuItem } from 'react-native-material-menu'
import * as Clipboard from 'expo-clipboard'
import { RouteProp, useRoute } from '@react-navigation/native'
import { RootStackParamList } from '../../types'
import { showToast } from '../../utils'

export default function HeaderRight(props: { reload: () => void }) {
  const { webViewMode } = useStore()
  const [visible, setVisible] = React.useState(false)
  const route = useRoute<RouteProp<RootStackParamList, 'WebPage'>>()
  const { url, title } = route.params

  const hideMenu = () => setVisible(false)

  const showMenu = () => setVisible(true)

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Menu
        visible={visible}
        anchor={
          <Icon
            name="dots-vertical"
            type="material-community"
            onPress={showMenu}
          />
        }
        onRequestClose={hideMenu}>
        <MenuItem
          onPress={() => {
            store.webViewMode = store.webViewMode === 'MOBILE' ? 'PC' : 'MOBILE'
            hideMenu()
          }}>
          {webViewMode === 'MOBILE' ? '电脑模式' : '手机模式'}
        </MenuItem>
        <MenuItem
          onPress={() => {
            hideMenu()
            Linking.openURL(url)
          }}>
          浏览器打开
        </MenuItem>
        <MenuItem
          onPress={() => {
            hideMenu()
            props.reload()
          }}>
          刷新页面
        </MenuItem>
        <MenuItem
          onPress={() => {
            Clipboard.setStringAsync(url).then(() => {
              showToast('已复制链接：' + url)
              hideMenu()
            })
          }}>
          复制链接
        </MenuItem>
        <MenuItem
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
