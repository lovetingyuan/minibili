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

import useAppUpdateInfo from '@/api/check-update'
import { colors } from '@/constants/colors.tw'
import { useUpUpdateCount } from '@/store/derives'

import useMounted from '../../hooks/useMounted'
import { useStore } from '../../store'
import type { NavigationProps } from '../../types'

function HeaderTitleComp() {
  const { current: opacityValue } = React.useRef(new Animated.Value(0))
  const appUpdateInfo = useAppUpdateInfo()
  useMounted(() => {
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
  })

  return appUpdateInfo.hasUpdate ? (
    <Button
      type="clear"
      size="sm"
      buttonStyle={tw('mx-2')}
      titleStyle={tw(`text-sm ${colors.primary.text}`)}
      onPress={() => {
        const downloadLink = appUpdateInfo.downloadLink
        if (downloadLink) {
          Linking.openURL(downloadLink)
        }
      }}>
      {'有新版本'}
      <Animated.View
        style={
          /* eslint-disable-next-line react-compiler/react-compiler */
          { opacity: opacityValue }
        }>
        <Icon
          name="fiber-new"
          color={tw(colors.secondary.text).color}
          size={24}
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

function HeaderLeftComp() {
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
            className="h-full flex-row items-center">
            <Text
              className={`text-lg font-bold ${
                currentVideosCate.rid === -1
                  ? __DEV__
                    ? colors.success.text
                    : colors.secondary.text
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
              <View key={i} className="flex-1 flex-row">
                {items.map((item) => getItem(item))}
              </View>
            )
          })}
        </ScrollView>
      </Menu>
    </View>
  )
}

const HeaderLeft = React.memo(HeaderLeftComp)
const HeaderTitle = React.memo(HeaderTitleComp)
const HeaderRight = React.memo(HeaderRightComp)

function HeaderRightComp() {
  const navigation = useNavigation<NavigationProps['navigation']>()
  const { livingUps } = useStore()
  const _updatedCount = useUpUpdateCount()
  const hasLiving = Object.values(livingUps).filter(Boolean).length > 0
  return (
    <View className="flex-row items-center gap-1">
      <Button
        radius={'sm'}
        size="sm"
        type="clear"
        onPress={() => {
          navigation.navigate('SearchVideos')
        }}>
        <Icon name="search" color={tw(colors.gray7.text).color} size={24} />
      </Button>
      <View className="relative">
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
          size="sm"
          titleStyle={tw('text-lg')}
          onPress={() => {
            navigation.navigate('Follow')
          }}>
          {` 关注 ${_updatedCount ? '  ' : ''}`}
        </Button>
      </View>
    </View>
  )
}

export const videoListHeaderLeft = () => <HeaderLeft />
export const videoListHeaderRight = () => <HeaderRight />
export const videoListHeaderTitle = () => <HeaderTitle />
