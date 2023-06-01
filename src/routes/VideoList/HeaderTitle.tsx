import { Icon, Text, useTheme, useThemeMode } from '@rneui/themed'
import { Pressable, ScrollView, View } from 'react-native'
import store, { useStore } from '../../store'
import React from 'react'
import { StyleSheet } from 'react-native'
import { Menu, MenuDivider, MenuItem } from 'react-native-material-menu'

const HeaderTitle = () => {
  const { videosType, ranksList } = useStore()
  const { theme } = useTheme()
  const { mode, setMode } = useThemeMode()
  const [visible, setVisible] = React.useState(false)
  const hideMenu = () => setVisible(false)
  const showMenu = () => setVisible(true)
  return (
    <View>
      <Menu
        visible={visible}
        style={{ ...styles.menu, backgroundColor: theme.colors.background }}
        anchor={
          <Pressable onPress={showMenu} style={styles.titleContainer}>
            <Text style={[styles.title, { color: theme.colors.grey1 }]}>
              {videosType.label + (videosType.rid === -1 ? '' : '排行')}{' '}
            </Text>
            <Icon
              name="triangle-down"
              type="octicon"
              size={28}
              color={theme.colors.grey1}
            />
            {__DEV__ ? (
              <Text
                onPress={() => {
                  setMode(mode === 'dark' ? 'light' : 'dark')
                  fetch(
                    'https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?offset=&host_mid=14427395&timezone_offset=-480',
                    {
                      headers: {
                        Host: 'api.bilibili.com',
                        'User-Agent':
                          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/113.0',
                        Accept:
                          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                        'Accept-Language':
                          'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2',
                        // 'Accept-Encoding': 'gzip, deflate, br',
                        Connection: 'keep-alive',
                        'Upgrade-Insecure-Requests': '1',
                        'Sec-Fetch-Dest': 'document',
                        'Sec-Fetch-Mode': 'navigate',
                        'Sec-Fetch-Site': 'none',
                        'Sec-Fetch-User': '?1',
                      },
                    },
                  )
                    .then(r => r.text())
                    .then(r => console.log(1111, r))
                }}>
                {'    '}
                dev
              </Text>
            ) : null}
          </Pressable>
        }
        onRequestClose={hideMenu}>
        <ScrollView style={styles.typeList}>
          {ranksList.map((item, i) => {
            const selected = store.videosType.rid === item.rid
            const Item = (
              <MenuItem
                textStyle={{
                  fontSize: 16,
                  fontWeight: i && !selected ? 'normal' : 'bold',
                  color: selected ? theme.colors.primary : theme.colors.black,
                }}
                onPress={() => {
                  store.videosType = item
                  hideMenu()
                }}>
                {item.label}
              </MenuItem>
            )
            return (
              <View key={item.rid}>
                {Item}
                {i ? null : <MenuDivider color={theme.colors.divider} />}
              </View>
            )
          })}
        </ScrollView>
      </Menu>
    </View>
  )
}

export default HeaderTitle

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  title: {
    fontSize: 19,
    fontWeight: 'bold',
  },
  menu: { position: 'relative', top: 50, width: 90 },
  typeList: { maxHeight: 400, width: 90 },
})
