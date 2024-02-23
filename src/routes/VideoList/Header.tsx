import { useNavigation } from '@react-navigation/native'
import { Badge, Button, Icon, Text } from '@rneui/themed'
import React from 'react'
import {
  Animated,
  Linking,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native'
import { Menu, MenuDivider, MenuItem } from 'react-native-material-menu'

import { colors } from '@/constants/colors.tw'

import useMounted from '../../hooks/useMounted'
import { getAppUpdateInfo, useStore } from '../../store'
import type { NavigationProps, PromiseResult } from '../../types'

function NewVersionTip() {
  const [newVersion, setNewVersion] = React.useState<PromiseResult<
    typeof getAppUpdateInfo
  > | null>(null)
  const opacityValue = React.useRef(new Animated.Value(0)).current

  React.useEffect(() => {
    const blinkAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    )

    blinkAnimation.start()

    return () => {
      blinkAnimation.stop()
    }
  }, [opacityValue])

  useMounted(() => {
    getAppUpdateInfo.then(r => {
      setNewVersion(r)
    })
  })
  return newVersion?.hasUpdate ? (
    <Button
      type="clear"
      size="sm"
      titleStyle={tw(`text-sm ${colors.primary.text}`)}
      onPress={() => {
        Linking.openURL(newVersion.downloadLink)
      }}>
      有新版本
      <Animated.View style={{ opacity: opacityValue }}>
        <Icon
          name="fiber-new"
          color={tw(colors.secondary.text).color}
          size={20}
        />
      </Animated.View>
    </Button>
  ) : null
}

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
        pressColor={tw(colors.gray5.text).color}
        textStyle={tw(
          `text-base ${selected ? 'font-bold' : ''} ${item.rid === -1 ? colors.secondary.text : selected ? colors.primary.text : colors.black.text}`,
        )}
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
              className={`text-lg font-bold ${
                currentVideosCate.rid === -1
                  ? colors.secondary.text
                  : colors.gray7.text
              }`}>
              {currentVideosCate.label +
                (currentVideosCate.rid === -1 ? '' : '排行')}{' '}
            </Text>
            <Icon
              name="triangle-down"
              type="octicon"
              size={28}
              color={tw(colors.gray6.text).color}
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
                  <MenuDivider color={tw(colors.gray3.text).color} />
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
      <NewVersionTip />
    </View>
  )
})

const HeaderRight = React.memo(function HeaderRight() {
  const navigation = useNavigation<NavigationProps['navigation']>()
  const { _updatedCount, livingUps } = useStore()
  const hasLiving = Object.values(livingUps).filter(Boolean).length > 0
  return (
    <View>
      {_updatedCount ? (
        <Badge
          status="success"
          value={_updatedCount}
          badgeStyle={tw(
            `h-4 absolute left-10 top-1 ${hasLiving ? colors.primary.bg : colors.secondary.bg}`,
          )}
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
