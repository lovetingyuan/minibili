import { Icon, Text, useTheme, Button, Badge } from '@rneui/themed'
import { Linking, ScrollView, View, Pressable } from 'react-native'
import store, { useStore } from '../../store'
import React from 'react'
import { StyleSheet } from 'react-native'
import { Menu, MenuDivider, MenuItem } from 'react-native-material-menu'
import { NavigationProps, PromiseResult } from '../../types'
import { useNavigation } from '@react-navigation/native'

const HeaderTitle = React.memo(() => {
  const { currentVideosCate, $videoCatesList } = useStore()
  const [newVersion, setNewVersion] = React.useState<PromiseResult<
    typeof store.appUpdateInfo
  > | null>(null)
  if (!newVersion) {
    store.appUpdateInfo.then(res => {
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
            <Text
              style={[
                styles.title,
                {
                  color:
                    currentVideosCate.rid === -1
                      ? '#F85A54'
                      : theme.colors.grey1,
                },
              ]}>
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
          {$videoCatesList.map((item, i) => {
            const selected = store.currentVideosCate.rid === item.rid
            const Item = (
              <MenuItem
                textStyle={{
                  fontSize: 16,
                  fontWeight: i && !selected ? 'normal' : 'bold',
                  color:
                    item.rid === -1
                      ? '#F85A54'
                      : selected
                      ? theme.colors.primary
                      : theme.colors.black,
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
})

const HeaderRight = () => {
  const navigation = useNavigation<NavigationProps['navigation']>()
  const { updatedCount, livingUps } = useStore()
  const hasLiving = Object.values(livingUps).filter(Boolean).length > 0
  return (
    <View>
      {updatedCount ? (
        <Badge
          status="success"
          value={updatedCount}
          badgeStyle={{
            height: 17,
            backgroundColor: hasLiving ? '#00a1d6' : '#fb7299',
            position: 'absolute',
            left: 35,
            top: 2,
          }}
          textStyle={{
            fontSize: 11,
          }}
        />
      ) : null}
      <Button
        type="clear"
        onPress={() => {
          navigation.navigate('Follow')
        }}
        titleStyle={{ fontSize: 18 }}>
        关注{__DEV__ ? 'dev' : ''}
      </Button>
    </View>
  )
}
export const videoListHeaderTitle = () => <HeaderTitle />
export const videoListHeaderRight = () => <HeaderRight />

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
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
  avatar: {
    marginHorizontal: 20,
  },
})
