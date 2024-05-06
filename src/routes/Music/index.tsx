import { useBackHandler } from '@react-native-community/hooks'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { Icon, Text } from '@rneui/themed'
import { FlashList } from '@shopify/flash-list'
import clsx from 'clsx'
import * as Clipboard from 'expo-clipboard'
import { Image } from 'expo-image'
import React from 'react'
import { Alert, Linking, View } from 'react-native'
import type { SearchBarCommands } from 'react-native-screens'

import { colors } from '@/constants/colors.tw'
import useUpdateNavigationOptions from '@/hooks/useUpdateNavigationOptions'
import { type AppContextValueType, useStore } from '@/store'
import type { NavigationProps } from '@/types'
import { parseImgUrl, parseTime, showToast } from '@/utils'

import MusicPlayerBar from './Player'

function MusicItem(props: {
  song: AppContextValueType['$musicList'][0]['songs'][0]
}) {
  const { song } = props
  const {
    setPlayingSong,
    playingSong,
    get$musicList,
    set$musicList,
    setOverlayButtons,
  } = useStore()
  const navigation = useNavigation<NavigationProps['navigation']>()
  const isPlaying =
    playingSong?.bvid === song.bvid && playingSong.cid === song.cid
  const buttons = () => {
    return [
      {
        text: '移除',
        onPress: () => {
          Alert.alert('确定要移除该歌曲吗？', '', [
            {
              text: '取消',
            },
            {
              text: '确定',
              onPress: () => {
                const list = get$musicList()
                const songs = list[0].songs
                list[0].songs = songs.filter((v) => {
                  if (v.bvid !== song.bvid) {
                    return true
                  }
                  if (v.cid !== song.cid) {
                    return true
                  }
                  return false
                })
                set$musicList([...list])
                if (isPlaying) {
                  setPlayingSong(null)
                }
              },
            },
          ])
        },
      },
      {
        text: '查看视频',
        onPress: () => {
          navigation.push('Play', {
            bvid: song.bvid,
            cid: song.cid,
            title: song.name,
            cover: song.cover,
            desc: song.description,
          })
        },
      },
      {
        text: '网络搜索',
        onPress: () => {
          Linking.openURL(
            `https://www.baidu.com/s?wd=${encodeURIComponent(song.name + (song.singer ? ` ${song.singer}` : ''))}`,
          )
        },
      },
      {
        text: '复制歌曲名',
        onPress: () => {
          Clipboard.setStringAsync(song.name).then(() => {
            showToast('已复制')
          })
        },
      },
    ]
  }
  return (
    <View className="flex-row my-3 gap-3">
      <View className="">
        <Image
          source={{ uri: parseImgUrl(song.cover, 240, 160) }}
          className="h-16 w-20 rounded"
        />
        <View className="absolute top-0 justify-center items-center">
          {/* {isPlaying ? (
            <Image
              source={require('../../../assets/playing.gif')}
              className="h-14 w-10 self-center align-middle"
            />
          ) : ( */}
          <Icon
            name={'play-circle-outline'} // pause-circle-outline
            type="material-community"
            size={45}
            className="h-16 w-20 justify-center items-center"
            onPress={() => {
              setPlayingSong(song)
            }}
            onLongPress={() => {
              setOverlayButtons(buttons())
            }}
            color={'white'}
          />
          {/* )} */}
        </View>
      </View>
      <View className="gap-2 flex-1">
        <Text
          className={clsx(
            'text-base items-center leading-5',
            isPlaying && [colors.primary.text, 'font-bold'],
          )}
          numberOfLines={2}
          onPress={() => {
            setPlayingSong(song)
          }}
          onLongPress={() => {
            setOverlayButtons(buttons())
          }}
          ellipsizeMode="tail">
          {song.name}
        </Text>
        <View className="flex-row gap-3">
          <Text className={colors.gray5.text}>👤{song.singer || '佚名'}</Text>
          <Text className={colors.gray5.text}>
            {parseTime(song.duration * 1000)}
          </Text>
          <Text className={colors.gray5.text}>
            {song.year ? `${song.year}年` : ''}
          </Text>
        </View>
      </View>
    </View>
  )
}

function MusicList() {
  const { $musicList, playingSong } = useStore()
  const list = $musicList[0].songs
  const blackColor = tw(colors.black.text).color
  const searchBarRef = React.useRef<SearchBarCommands | null>(null)
  const [searchKeyWord, setSearchKeyWord] = React.useState('')
  const focused = useIsFocused()
  useBackHandler(() => {
    if (searchKeyWord && focused) {
      searchBarRef.current?.blur()
      searchBarRef.current?.setText('')
      setSearchKeyWord('')
      return true
    }
    return false
  })
  useUpdateNavigationOptions(
    React.useMemo(() => {
      return {
        headerTitle: `🎵 我的歌单（${list.length}）`,
        headerSearchBarOptions: {
          ref: searchBarRef,
          placeholder: '搜索歌曲',
          headerIconColor: blackColor,
          hintTextColor: blackColor,
          textColor: blackColor,
          tintColor: blackColor,
          disableBackButtonOverride: false,
          shouldShowHintSearchIcon: false,
          onClose: () => {
            setSearchKeyWord('')
          },
          onSearchButtonPress: ({ nativeEvent: { text } }) => {
            const keyword = text.trim()
            if (!keyword) {
              return
            }
            setSearchKeyWord(keyword)
          },
        },
      }
    }, [list, blackColor]),
  )
  const songsList = React.useMemo(() => {
    const keyword = searchKeyWord.trim()
    if (keyword) {
      return list.filter((v) => v.name.includes(keyword))
    }
    return list
  }, [list, searchKeyWord])
  return (
    <View className="flex-1 relative">
      <FlashList
        data={songsList}
        keyExtractor={(v) => `${v.bvid}_${v.cid}`}
        renderItem={({ item }) => {
          return <MusicItem song={item} />
        }}
        persistentScrollbar
        estimatedItemSize={100}
        // ListHeaderComponent={<MusicPlayerBar />}
        ListEmptyComponent={
          <View className="flex-1 gap-2 my-16">
            <Text className="text-center text-base">暂无歌曲</Text>
            {list.length === 0 ? (
              <Text className="text-center text-base">
                你可以在视频播放页面右上角添加
              </Text>
            ) : null}
          </View>
        }
        ListFooterComponent={
          songsList.length ? (
            <Text
              className={`${colors.gray6.text} text-xs text-center py-1 my-2 ${playingSong ? 'mb-32' : ''}`}>
              到底了
            </Text>
          ) : null
        }
        contentContainerStyle={tw('px-4 pt-4')}
        estimatedFirstItemOffset={80}
      />
      <MusicPlayerBar />
    </View>
  )
}

export default React.memo(MusicList)
