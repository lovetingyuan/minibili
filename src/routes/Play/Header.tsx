import { type RouteProp, useRoute } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Dialog, Icon, Input, Text } from '@rn-vui/themed'
import { clsx } from 'clsx'
import * as Clipboard from 'expo-clipboard'
import React from 'react'
import { Linking, View } from 'react-native'
import { Menu, MenuItem } from 'react-native-material-menu'

import { getDownloadUrl } from '@/api/play-url'
import { useUserRelation } from '@/api/user-relation'
import { useVideoInfo } from '@/api/video-info'
import { colors } from '@/constants/colors.tw'
import { useStore } from '@/store'
import { useFollowedUpsMap, useMusicSongsMap } from '@/store/derives'
import type { RootStackParamList } from '@/types'
import { parseImgUrl, parseNumber, showToast } from '@/utils'

export function PlayHeaderTitle() {
  const route = useRoute<RouteProp<RootStackParamList, 'Play'>>()
  const { data: vi } = useVideoInfo(route.params.bvid)
  const { data: fans } = useUserRelation(route.params?.mid || vi?.mid)
  const { $blackUps } = useStore()
  const _followedUpsMap = useFollowedUpsMap()
  const followed = route.params?.mid && route.params.mid in _followedUpsMap
  const isBlackUp = route.params?.mid && `_${route.params.mid}` in $blackUps
  return (
    <View className="relative left-[-10px] flex-row items-center">
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

function SongInfoModal(props: {
  videoInfo: any
  cid: number
  onClose: () => void
}) {
  const [title, setTitle] = React.useState(props.videoInfo.title)
  const [singer, setSinger] = React.useState('')
  const [year, setYear] = React.useState('')
  const { set$musicList, get$musicList } = useStore()

  const handleSearchInternet = () => {
    Linking.openURL(`https://www.baidu.com/s?wd=${encodeURIComponent(title)}`)
  }
  const handleAddSong = () => {
    const musicList = get$musicList()
    // console.log(videoInfo)
    musicList[0].songs.unshift({
      name: title,
      bvid: props.videoInfo.bvid,
      cid: props.cid,
      cover: props.videoInfo.cover,
      singer,
      year,
      duration: props.videoInfo.duration,
      createTime: Date.now(),
    })
    set$musicList([...musicList])
    showToast('添加成功')
    props.onClose()
  }
  return (
    <Dialog
      isVisible={true}
      overlayStyle={tw(colors.gray2.bg)}
      backdropStyle={tw('bg-neutral-900/90')}
      onBackdropPress={props.onClose}>
      <Dialog.Title title={'添加到歌单'} titleStyle={tw(colors.black.text)} />
      <View className="mt-3">
        <Input
          label="歌曲名称"
          placeholder="歌曲名称"
          autoFocus
          // className="mt-5 h-20"
          maxLength={100}
          value={title}
          placeholderTextColor={tw(colors.gray4.text).color}
          onChangeText={(value) => {
            setTitle(value)
          }}
        />
        <Input
          label="演唱者"
          placeholder="演唱者名称"
          // className="mt-5 h-20"
          maxLength={60}
          value={singer}
          placeholderTextColor={tw(colors.gray4.text).color}
          onChangeText={(value) => {
            setSinger(value)
          }}
        />
        <Input
          label="年份"
          placeholder="创作年份"
          // className="mt-5 h-20"
          maxLength={10}
          value={`${year}`}
          placeholderTextColor={tw(colors.gray4.text).color}
          onChangeText={(value) => {
            setYear(value)
          }}
        />
      </View>
      <Dialog.Actions>
        <Dialog.Button title="添加到歌单" onPress={handleAddSong} />
        <Dialog.Button
          title="网络搜索"
          titleStyle={tw(colors.success.text)}
          onPress={handleSearchInternet}
        />
        <Dialog.Button
          titleStyle={tw(colors.gray6.text)}
          title="取消"
          onPress={() => {
            props.onClose()
          }}
        />
      </Dialog.Actions>
    </Dialog>
  )
}

export function PlayHeaderRight(props: { cid?: number; refresh: () => void }) {
  const [visible, setVisible] = React.useState(false)
  const hideMenu = () => setVisible(false)
  const showMenu = () => setVisible(true)
  const route =
    useRoute<NativeStackScreenProps<RootStackParamList, 'Play'>['route']>()
  const { data } = useVideoInfo(route.params.bvid)
  const videoInfo = {
    ...route.params,
    ...data,
  }
  const [showAddSongInfoModal, setShowAddSongInfoModal] = React.useState(false)
  const musicSongsMap = useMusicSongsMap()
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
                ?.then((url) => {
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
            if (videoInfo.cover) {
              Linking.openURL(parseImgUrl(videoInfo.cover))
            } else {
              showToast('暂时无法获取封面')
            }
          }}>
          下载封面
        </MenuItem>
        <MenuItem
          textStyle={tw('text-black dark:text-gray-300')}
          pressColor={tw(colors.gray4.text).color}
          onPress={() => {
            hideMenu()
            props.refresh()
          }}>
          刷新
        </MenuItem>
        <MenuItem
          textStyle={tw('text-black dark:text-gray-300')}
          pressColor={tw(colors.gray4.text).color}
          onPress={() => {
            hideMenu()
            Linking.openURL(`https://www.bilibili.com/video/${videoInfo.bvid}`)
          }}>
          浏览器打开
        </MenuItem>
        <MenuItem
          textStyle={tw('text-black dark:text-gray-300')}
          pressColor={tw(colors.gray4.text).color}
          onPress={() => {
            Clipboard.setStringAsync(
              `https://www.bilibili.com/video/${videoInfo.bvid}`,
            ).then(() => {
              showToast('已复制视频链接')
              hideMenu()
            })
          }}>
          复制链接
        </MenuItem>
        <MenuItem
          textStyle={tw(' text-black dark:text-gray-300')}
          pressColor={tw(colors.gray4.text).color}
          onPress={() => {
            hideMenu()
            if (!props.cid || !videoInfo.cover || !videoInfo.duration) {
              showToast('请稍候再试')
              return
            }
            const id = `${videoInfo.bvid}_${props.cid}`
            if (id in musicSongsMap) {
              showToast('当前视频已经在歌单当中')
              return
            }
            setShowAddSongInfoModal(true)
          }}>
          添加到歌单
        </MenuItem>
      </Menu>
      {showAddSongInfoModal && props.cid ? (
        <SongInfoModal
          videoInfo={videoInfo}
          cid={props.cid}
          // mid={videoInfo.mid}
          onClose={() => {
            setShowAddSongInfoModal(false)
          }}
        />
      ) : null}
    </View>
  )
}
