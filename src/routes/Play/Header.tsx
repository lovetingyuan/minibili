import { type RouteProp, useRoute } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Icon, Text } from '@rneui/themed'
import clsx from 'clsx'
import * as Clipboard from 'expo-clipboard'
import React from 'react'
import { Linking, View } from 'react-native'
import { Menu, MenuItem } from 'react-native-material-menu'

import { getDownloadUrl } from '@/api/play-url'
import { useUserRelation } from '@/api/user-relation'
import { useVideoInfo } from '@/api/video-info'
import { colors } from '@/constants/colors.tw'
import type { RootStackParamList } from '@/types'
import { parseNumber, showToast } from '@/utils'

import { useStore } from '../../store'

export function PlayHeaderTitle() {
  const route = useRoute<RouteProp<RootStackParamList, 'Play'>>()
  const { data: vi } = useVideoInfo(route.params.bvid)
  const { data: fans } = useUserRelation(route.params?.mid || vi?.mid)
  const { _followedUpsMap, $blackUps } = useStore()
  const followed = route.params?.mid && route.params.mid in _followedUpsMap
  const isBlackUp = route.params?.mid && route.params.mid in $blackUps
  return (
    <View className="flex-row items-center relative left-[-10px]">
      <Text
        className={clsx(
          'text-lg font-semibold',
          isBlackUp && 'line-through',
          followed && colors.secondary.text,
        )}>
        {route.params?.name || vi?.name}
      </Text>
      <Text
        className="ml-3 text-gray-500 dark:text-gray-400"
        onPress={() => {
          fans && showToast(`粉丝：${fans.follower}`)
        }}>
        {` ${fans?.follower ? parseNumber(fans.follower) : ''}粉丝`}
      </Text>
    </View>
  )
}

export function PlayHeaderRight(props: { cid?: number; refresh: () => void }) {
  const [visible, setVisible] = React.useState(false)
  const hideMenu = () => setVisible(false)
  const showMenu = () => setVisible(true)
  const route =
    useRoute<NativeStackScreenProps<RootStackParamList, 'Play'>['route']>()
  const videoInfo = route.params
  return (
    <View className="flex-row items-center gap-2">
      <Menu
        visible={visible}
        // @ts-expect-error className will be handled
        className="bg-white dark:bg-zinc-900"
        anchor={
          <Icon
            name="dots-vertical"
            type="material-community"
            onPress={showMenu}
          />
        }
        onRequestClose={hideMenu}>
        <MenuItem
          textStyle={tw('text-black dark:text-gray-300')}
          pressColor={tw(colors.gray4.text).color}
          onPress={() => {
            if (props.cid) {
              showToast('请稍后在浏览器中下载')
              getDownloadUrl(videoInfo.bvid, props.cid)
                ?.then(url => {
                  if (url) {
                    Linking.openURL(url)
                  } else {
                    return Promise.reject()
                  }
                })
                .catch(() => {
                  showToast('暂不支持下载')
                })
            } else {
              showToast('稍后再试')
            }
            hideMenu()
          }}>
          下载视频
        </MenuItem>
        <MenuItem
          textStyle={tw('text-black dark:text-gray-300')}
          pressColor={tw(colors.gray4.text).color}
          onPress={() => {
            hideMenu()
            Linking.openURL('https://www.bilibili.com/video/' + videoInfo.bvid)
          }}>
          浏览器打开
        </MenuItem>
        <MenuItem
          textStyle={tw('text-black dark:text-gray-300')}
          pressColor={tw(colors.gray4.text).color}
          onPress={() => {
            Clipboard.setStringAsync(
              'https://www.bilibili.com/video/' + videoInfo.bvid,
            ).then(() => {
              showToast('已复制视频链接')
              hideMenu()
            })
          }}>
          复制链接
        </MenuItem>
        {/* <MenuItem
          textStyle={tw(' text-black dark:text-gray-300')}
          pressColor={tw(colors.gray4.text).color}
          onPress={() => {
            // props.refresh()
            showToast('暂未实现')
          }}>
          刷新
        </MenuItem> */}
        <MenuItem
          textStyle={tw(' text-black dark:text-gray-300')}
          pressColor={tw(colors.gray4.text).color}
          onPress={() => {
            showToast('暂未实现')
          }}>
          切换高清
        </MenuItem>
        {/* <MenuItem
          textStyle={tw(' text-black dark:text-gray-300')}
          pressColor={tw(colors.gray4.text).color}
          onPress={() => {
            showToast('暂未实现')
          }}>
          后台播放
        </MenuItem> */}
      </Menu>
    </View>
  )
}
