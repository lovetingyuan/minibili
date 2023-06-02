import { Icon, Text, useTheme, useThemeMode } from '@rneui/themed'
import { Pressable, ScrollView, View } from 'react-native'
import store, { useStore } from '../../store'
import React from 'react'
import { StyleSheet } from 'react-native'
import { Menu, MenuDivider, MenuItem } from 'react-native-material-menu'

const HeaderTitle = () => {
  const { currentVideosCate, $ranksList } = useStore()
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
              {currentVideosCate.label +
                (currentVideosCate.rid === -1 ? '' : '排行')}{' '}
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
                  alert(store.cookie)
                }}>
                {'    '}
                dev
              </Text>
            ) : null}
          </Pressable>
        }
        onRequestClose={hideMenu}>
        <ScrollView style={styles.typeList}>
          {$ranksList.map((item, i) => {
            const selected = store.currentVideosCate.rid === item.rid
            const Item = (
              <MenuItem
                textStyle={{
                  fontSize: 16,
                  fontWeight: i && !selected ? 'normal' : 'bold',
                  color: selected ? theme.colors.primary : theme.colors.black,
                }}
                onPress={() => {
                  store.currentVideosCate = item
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
