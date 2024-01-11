import { Icon, Text, useTheme, Button, Badge } from '@rneui/themed'
import { Linking, ScrollView, View, TouchableOpacity } from 'react-native'
import { getAppUpdateInfo, useStore } from '../../store'
import React from 'react'
import { StyleSheet } from 'react-native'
import { Menu, MenuDivider, MenuItem } from 'react-native-material-menu'
import { NavigationProps, PromiseResult } from '../../types'
import { useNavigation } from '@react-navigation/native'
import useMounted from '../../hooks/useMounted'
import { s } from '../../styles'

function splitArrayIntoChunks(arr: any[]) {
  const result = [[arr[0]]]
  for (let i = 1; i < arr.length; i += 2) {
    result.push(arr.slice(i, i + 2))
  }

  return result
}

const HeaderTitle = React.memo(() => {
  const { currentVideosCate, $videoCatesList, setCurrentVideosCate } =
    useStore()
  const [newVersion, setNewVersion] = React.useState<PromiseResult<
    typeof getAppUpdateInfo
  > | null>(null)
  useMounted(() => {
    getAppUpdateInfo.then(r => {
      setNewVersion(r)
    })
  })
  const { theme } = useTheme()
  const [visible, setVisible] = React.useState(false)
  const hideMenu = () => setVisible(false)
  const showMenu = () => setVisible(true)
  const list = splitArrayIntoChunks($videoCatesList)
  const getItem = (item: any) => {
    const selected = currentVideosCate.rid === item.rid
    return (
      <MenuItem
        key={item.rid}
        style={{
          maxWidth: item.rid === -1 ? 120 : 90,
        }}
        textStyle={{
          fontSize: 16,
          fontWeight: selected ? 'bold' : 'normal',
          color:
            item.rid === -1
              ? theme.colors.secondary
              : selected
                ? theme.colors.primary
                : theme.colors.black,
        }}
        onPress={() => {
          setCurrentVideosCate(item)
          hideMenu()
        }}>
        {item.label}
      </MenuItem>
    )
  }
  return (
    <View style={styles.container}>
      <Menu
        visible={visible}
        style={{ ...styles.menu, backgroundColor: theme.colors.background }}
        anchor={
          <TouchableOpacity
            activeOpacity={0.5}
            onPress={showMenu}
            style={styles.titleContainer}>
            <Text
              style={[
                styles.title,
                {
                  color:
                    currentVideosCate.rid === -1
                      ? theme.colors.secondary
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
          </TouchableOpacity>
        }
        onRequestClose={hideMenu}>
        <ScrollView style={styles.typeList}>
          {list.map((items, i) => {
            if (i === 0) {
              return (
                <View
                  key={i}
                  style={{
                    flex: 1,
                  }}>
                  {getItem(items[0])}
                  <MenuDivider color={theme.colors.divider} />
                </View>
              )
            }
            return (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  flex: 1,
                }}>
                {items.map(item => getItem(item))}
              </View>
            )
          })}
        </ScrollView>
      </Menu>
      {newVersion?.hasUpdate ? (
        <Button
          type="clear"
          size="sm"
          titleStyle={[styles.updateBtnText, { color: theme.colors.secondary }]}
          onPress={() => {
            Linking.openURL(newVersion.downloadLink)
          }}>
          有新版本
          <Icon name="fiber-new" color={theme.colors.secondary} size={20} />
        </Button>
      ) : null}
    </View>
  )
})

const HeaderRight = React.memo(() => {
  const navigation = useNavigation<NavigationProps['navigation']>()
  const { _updatedCount, livingUps } = useStore()
  const hasLiving = Object.values(livingUps).filter(Boolean).length > 0
  const { theme } = useTheme()
  return (
    <View>
      {_updatedCount ? (
        <Badge
          status="success"
          value={_updatedCount}
          badgeStyle={{
            height: 16,
            backgroundColor: hasLiving
              ? theme.colors.primary
              : theme.colors.secondary,
            position: 'absolute',
            left: 43,
            top: 5,
          }}
          textStyle={styles.updateCountText}
        />
      ) : null}
      <Button
        type="clear"
        titleStyle={s.t('text-emerald-600')}
        onPress={() => {
          navigation.navigate('Follow')
        }}>
        {' 关注 '}
      </Button>
    </View>
  )
})

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
    fontSize: 18,
    fontWeight: '600',
  },
  menu: { position: 'relative', top: 50, width: 180 },
  typeList: { maxHeight: 400, width: 180 },
  updateBtnText: { fontSize: 14 },
  avatar: {
    marginHorizontal: 20,
  },
  updateCountText: {
    fontSize: 11,
  },
})
