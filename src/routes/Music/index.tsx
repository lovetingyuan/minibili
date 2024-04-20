import { Icon, Text } from '@rneui/themed'
import { FlashList } from '@shopify/flash-list'
import { Image } from 'expo-image'
import React from 'react'
import { Alert, View } from 'react-native'

import { colors } from '@/constants/colors.tw'
import useUpdateNavigationOptions from '@/hooks/useUpdateNavigationOptions'
import { AppContextValueType, useStore } from '@/store'
import { parseImgUrl, parseTime } from '@/utils'

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
                list[0].songs = songs.filter(v => {
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
    ]
  }
  return (
    <View className="flex-row my-3 gap-3">
      <View className="">
        <Image
          source={{ uri: parseImgUrl(song.cover, 180, 180) }}
          className="h-20 w-20 rounded"
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
            className="h-20 w-20 justify-center items-center "
            onPress={() => {
              setPlayingSong(song)
            }}
            color={'white'}
          />
          {/* )} */}
        </View>
      </View>
      <View className="justify-between flex-1">
        <Text
          className={`text-base flex-1 ${isPlaying ? colors.primary.text : ''}`}
          numberOfLines={2}
          onLongPress={() => {
            setOverlayButtons(buttons())
          }}
          ellipsizeMode="tail">
          {song.name}
        </Text>
        <Text>{parseTime(song.duration * 1000)}</Text>
      </View>
    </View>
  )
}

function MusicList() {
  const { $musicList, playingSong } = useStore()
  const list = $musicList[0].songs
  useUpdateNavigationOptions(
    React.useMemo(() => {
      return {
        headerTitle: `我的歌单（${list.length}）`,
      }
    }, [list]),
  )
  return (
    <View className="flex-1 relative">
      <FlashList
        data={list}
        keyExtractor={v => v.bvid + '_' + v.cid}
        renderItem={({ item }) => {
          return <MusicItem song={item} />
        }}
        persistentScrollbar
        estimatedItemSize={100}
        // ListHeaderComponent={<MusicPlayerBar />}
        ListEmptyComponent={
          <View className="flex-1 gap-2 my-16">
            <Text className="text-center text-base">暂无歌曲</Text>
            <Text className="text-center text-base">
              你可以在视频播放页面右上角添加
            </Text>
          </View>
        }
        ListFooterComponent={
          list.length ? (
            <Text
              className={`${colors.gray6.text} text-xs text-center my-2 ${playingSong ? 'mb-32' : ''}`}>
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
