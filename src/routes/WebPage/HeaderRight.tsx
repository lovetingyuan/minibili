import { Icon } from '@rneui/themed'
import React from 'react'
import { View, Linking, ToastAndroid, Share } from 'react-native'
import store, { useStore } from '../../store'
import { Menu, MenuItem } from 'react-native-material-menu'
import * as Clipboard from 'expo-clipboard'

export default function HeaderRight(props: {
  url: string
  title?: string
  reload: () => void
}) {
  const { webViewMode } = useStore()
  const [visible, setVisible] = React.useState(false)

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
            Linking.openURL(props.url)
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
            Clipboard.setStringAsync(props.url).then(() => {
              ToastAndroid.show('已复制链接：' + props.url, ToastAndroid.SHORT)
              hideMenu()
            })
          }}>
          复制链接
        </MenuItem>
        <MenuItem
          onPress={() => {
            hideMenu()
            Share.share({
              message: [props.title, props.url].filter(Boolean).join('\n'),
            })
          }}>
          分享页面
        </MenuItem>
        {/* <MenuItem disabled>Disabled item</MenuItem> */}
        {/* <MenuDivider />
        <MenuItem onPress={hideMenu}>Menu item 4</MenuItem> */}
      </Menu>
    </View>
  )
}
