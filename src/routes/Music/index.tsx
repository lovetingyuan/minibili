import { useBackHandler } from '@react-native-community/hooks'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { Button, Icon, Text } from '@rneui/themed'
import { FlashList } from '@shopify/flash-list'
import clsx from 'clsx'
import * as Clipboard from 'expo-clipboard'
import { Image } from 'expo-image'
import React from 'react'
import { Alert, ImageBackground, Linking, View } from 'react-native'
import type { SearchBarCommands } from 'react-native-screens'

import { colors } from '@/constants/colors.tw'
import useUpdateNavigationOptions from '@/hooks/useUpdateNavigationOptions'
import { type AppContextValueType, useStore } from '@/store'
import type { NavigationProps } from '@/types'
import { parseImgUrl, parseTime, showToast } from '@/utils'

import MusicPlayerBar from './Player'

function MusicItem(props: {
  song: AppContextValueType['$musicList'][0]['songs'][0]
  type: 'normal' | 'brief'
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
        text: `删除（${song.name}）`,
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
  if (props.type === 'brief') {
    return (
      <View className="my-2 flex-row gap-2">
        <Text
          className={clsx(
            'shrink items-center text-base leading-5',
            isPlaying && [colors.primary.text, 'font-bold'],
          )}
          numberOfLines={1}
          onPress={() => {
            setPlayingSong(song)
          }}
          onLongPress={() => {
            setOverlayButtons(buttons())
          }}
          ellipsizeMode="tail">
          {song.name}
        </Text>
        {song.singer ? (
          <Text className="shrink-0 italic">👤{song.singer}</Text>
        ) : null}
      </View>
    )
  }
  return (
    <View className="my-3 flex-row gap-3">
      <View className="overflow-hidden rounded">
        <ImageBackground
          source={{ uri: parseImgUrl(song.cover, 240, 160) }}
          className="top-0 h-16 w-20 items-center justify-center">
          {isPlaying ? (
            <Image
              source={require('../../../assets/bbb.webp')}
              className="h-14 w-14"
            />
          ) : (
            <Icon
              name={'play-circle-outline'} // pause-circle-outline
              type="material-community"
              size={45}
              className={clsx(
                'h-16 w-20 items-center justify-center',
                isPlaying && colors.secondary.text,
              )}
              onPress={() => {
                setPlayingSong(song)
              }}
              onLongPress={() => {
                setOverlayButtons(buttons())
              }}
              color={isPlaying ? tw(colors.secondary.text).color : 'white'}
            />
          )}
        </ImageBackground>
      </View>
      <View className="flex-1 gap-2">
        <Text
          className={clsx(
            'items-center text-base leading-5',
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
  const { $musicList } = useStore()
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
  const [displayType, setDisplayType] = React.useState<'normal' | 'brief'>(
    'normal',
  )
  return (
    <View className="flex-1">
      <View className="shrink flex-grow">
        <FlashList
          data={songsList}
          keyExtractor={(v) => `${v.bvid}_${v.cid}`}
          key={displayType}
          renderItem={({ item }) => {
            return <MusicItem song={item} type={displayType} />
          }}
          persistentScrollbar
          estimatedItemSize={100}
          ListHeaderComponent={
            <View>
              <Button
                type="clear"
                title={displayType === 'normal' ? '紧凑' : '常规'}
                size="sm"
                titleStyle={{ fontSize: 15 }}
                buttonStyle={{ width: 40, padding: 0, marginLeft: 'auto' }}
                onPress={() => {
                  setDisplayType(displayType === 'normal' ? 'brief' : 'normal')
                }}
              />
            </View>
          }
          ListEmptyComponent={
            <View className="my-16 flex-1 gap-2">
              {list.length === 0 ? (
                <Text className="text-center text-base">
                  暂无歌曲{'\n\n'}在视频播放页面右上角菜单添加
                </Text>
              ) : (
                <Text className="text-center text-base">无搜索结果</Text>
              )}
            </View>
          }
          ListFooterComponent={
            songsList.length ? (
              <Text
                className={`${colors.gray6.text} my-2 py-1 text-center text-xs`}>
                到底了
              </Text>
            ) : null
          }
          contentContainerStyle={tw('px-4 pt-4')}
          estimatedFirstItemOffset={80}
        />
      </View>
      <View className="shrink-0">
        <MusicPlayerBar />
      </View>
    </View>
  )
}

export default React.memo(MusicList)
