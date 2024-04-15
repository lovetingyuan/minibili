import { useAudioUrl } from '@/api/play-url'
import { colors } from '@/constants/colors.tw'
import { AppContextValueType, useStore } from '@/store'
import { Text } from '@rneui/themed'
import { FlashList } from '@shopify/flash-list'
import { Image } from 'expo-image'
import React from 'react'
import { View } from 'react-native'
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av'
import { UA } from '@/constants'

function MusicItem(props: {
  song: AppContextValueType['$musicList'][0]['songs'][0]
}) {
  const { song } = props
  const { setPlayingSong } = useStore()
  return (
    <View className="flex-row">
      <Image
        source={{ uri: song.cover }}
        style={{ height: 80, width: 80 }}></Image>
      <Text
        onPress={() => {
          setPlayingSong(song)
        }}>
        {song.name}
      </Text>
    </View>
  )
}

function MusicPlayerBar() {
  const { playingSong, setPlayingSong } = useStore()
  const { url, time, error } = useAudioUrl(
    playingSong?.bvid || '',
    playingSong?.cid,
  )
  console.log(url, time, playingSong, error)
  React.useEffect(() => {
    if (!url) {
      return
    }
    let soundObj: Audio.Sound | null = null
    Audio.Sound.createAsync({
      uri: url,
      headers: {
        'user-agent': UA,
        referer: 'https://www.bilibili.com',
      },
    }).then(({ sound }) => {
      soundObj = sound
      return sound.playAsync()
    })
    Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      interruptionModeIOS: InterruptionModeIOS.DuckOthers,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: true,
    })
    return () => {
      console.log('Unloading Sound')
      soundObj?.unloadAsync()
    }
  }, [url])
  if (!playingSong) {
    return null
  }
  return (
    <View>
      <Text>{playingSong.name}</Text>
    </View>
  )
}

function MusicList() {
  const { $musicList } = useStore()
  const list = $musicList[0].songs
  return (
    <View className="flex-1">
      <FlashList
        data={list}
        keyExtractor={v => v.bvid + '_' + v.cid}
        renderItem={({ item }) => {
          return <MusicItem song={item} />
        }}
        persistentScrollbar
        estimatedItemSize={100}
        ListHeaderComponent={<MusicPlayerBar></MusicPlayerBar>}
        ListEmptyComponent={
          <Text className="text-center text-base my-10">暂无歌曲</Text>
        }
        ListFooterComponent={
          list.length ? (
            <Text className={`${colors.gray6.text} text-xs text-center my-2`}>
              到底了
            </Text>
          ) : null
        }
        contentContainerStyle={tw('px-1 pt-6')}
        estimatedFirstItemOffset={80}
      />
    </View>
  )
}

export default React.memo(MusicList)
