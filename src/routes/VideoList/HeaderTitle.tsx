import { Icon, Text, useTheme, Button } from '@rneui/themed'
import { Linking, Pressable, ScrollView, View } from 'react-native'
import store, { useStore } from '../../store'
import React from 'react'
import { StyleSheet } from 'react-native'
import { Menu, MenuDivider, MenuItem } from 'react-native-material-menu'
import { PromiseResult } from '../../types'

const HeaderTitle = () => {
  const { currentVideosCate, $ranksList } = useStore()
  const [newVersion, setNewVersion] = React.useState<PromiseResult<
    typeof store.updateInfo
  > | null>(null)
  if (!newVersion) {
    store.updateInfo.then(res => {
      setNewVersion(res)
    })
  }
  const { theme } = useTheme()
  const [visible, setVisible] = React.useState(false)
  const hideMenu = () => setVisible(false)
  const showMenu = () => setVisible(true)
  return (
    <View style={styles.container}>
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
      {newVersion?.hasUpdate ? (
        <Button
          type="clear"
          size="sm"
          titleStyle={[styles.updateBtnText, { color: '#f25985' }]}
          onPress={() => {
            Linking.openURL(newVersion.downloadLink)
          }}>
          有新版本
          <Icon name="fiber-new" color="#f25985" size={20} />
        </Button>
      ) : null}
    </View>
  )
}

export default HeaderTitle

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 16 },
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
  updateBtnText: { fontSize: 14 },
})
