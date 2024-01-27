import { Icon, Text, useTheme, Button, Badge } from '@rneui/themed'
import { Linking, ScrollView, View, TouchableOpacity } from 'react-native'
import { getAppUpdateInfo, useStore } from '../../store'
import React from 'react'
import { Menu, MenuDivider, MenuItem } from 'react-native-material-menu'
import { NavigationProps, PromiseResult } from '../../types'
import { useNavigation } from '@react-navigation/native'
import useMounted from '../../hooks/useMounted'

function splitArrayIntoChunks(arr: any[]) {
  const result = [[arr[0]]]
  for (let i = 1; i < arr.length; i += 2) {
    result.push(arr.slice(i, i + 2))
  }

  return result
}

const HeaderTitle = React.memo(function HeaderTitle() {
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
        className={item.rid === -1 ? 'max-w-32' : 'max-w-24'}
        pressColor={theme.colors.grey5}
        textStyle={tw(`text-base ${selected ? 'font-bold' : ''}`, {
          color:
            item.rid === -1
              ? theme.colors.secondary
              : selected
                ? theme.colors.primary
                : theme.colors.black,
        })}
        onPress={() => {
          setCurrentVideosCate(item)
          hideMenu()
        }}>
        {item.label}
      </MenuItem>
    )
  }
  return (
    <View className="flex-row items-center gap-4">
      <Menu
        visible={visible}
        // @ts-expect-error className will be handled
        className="relative top-14 w-48 bg-white dark:bg-zinc-900"
        anchor={
          <TouchableOpacity
            activeOpacity={0.5}
            onPress={showMenu}
            className="flex-row items-center h-full">
            <Text
              className={`text-lg font-semibold ${
                currentVideosCate.rid === -1
                  ? 'text-pink-500'
                  : 'text-gray-800 dark:text-gray-300'
              }`}>
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
        <ScrollView className="max-h-96 w-48">
          {list.map((items, i) => {
            if (i === 0) {
              return (
                <View key={i} className="flex-1">
                  {getItem(items[0])}
                  <MenuDivider color={theme.colors.divider} />
                </View>
              )
            }
            return (
              <View key={i} className="flex-row flex-1">
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
          titleStyle={tw('text-sm', { color: theme.colors.secondary })}
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

const HeaderRight = React.memo(function HeaderRight() {
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
          badgeStyle={tw('h-4 absolute left-10 top-1', {
            backgroundColor: hasLiving
              ? theme.colors.primary
              : theme.colors.secondary,
          })}
          textStyle={tw('text-[11px]')}
        />
      ) : null}
      <Button
        type="clear"
        titleStyle={tw('text-lg')}
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
