import { Icon, Slider, Text } from '@rneui/themed'
import {
  Audio,
  AVPlaybackStatus,
  // InterruptionModeAndroid,
  // InterruptionModeIOS,
} from 'expo-av'
// import { Image } from 'expo-image'
import React from 'react'
import { ImageBackground, View } from 'react-native'
import { throttle } from 'throttle-debounce'

import { useAudioUrl } from '@/api/play-url'
import { UA } from '@/constants'
import { colors } from '@/constants/colors.tw'
import { useStore } from '@/store'
import { parseImgUrl, parseTime, showToast } from '@/utils'

Audio.setAudioModeAsync({
  staysActiveInBackground: true,
  playsInSilentModeIOS: true,
  // interruptionModeIOS: InterruptionModeIOS.DuckOthers,
  // interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
  // shouldDuckAndroid: true,
  // playThroughEarpieceAndroid: true,
})

function PlayerBar(props: { url?: string; time?: number }) {
  const { playingSong } = useStore()
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [playingTime, setPlayingTime] = React.useState(0)
  const soundRef = React.useRef<Audio.Sound | null>(null)
  const updatePlayedTime = (currentTime: number) => {
    soundRef.current?.setPositionAsync(currentTime)
  }
  const handlePlayStatusChange = React.useMemo(() => {
    return throttle(200, (status: AVPlaybackStatus) => {
      if (status.isLoaded) {
        setIsPlaying(status.isPlaying)
        setPlayingTime(status.positionMillis)
        // console.log(status.positionMillis)
      }
    })
  }, [])
  // console.log(url?.substring(0, 30), time, playingSong?.name, error)

  React.useEffect(() => {
    setIsPlaying(false)
    setPlayingTime(0)
    let promise: Promise<any> = Promise.resolve()
    if (soundRef.current) {
      promise = soundRef.current.unloadAsync()
      soundRef.current = null
    }
    promise
      .then(() => {
        if (!props.url) {
          return null
        }
        return Audio.Sound.createAsync(
          {
            uri: props.url,
            headers: {
              'user-agent': UA,
              referer: 'https://www.bilibili.com',
            },
          },
          {},
          status => {
            handlePlayStatusChange(status)
          },
        )
      })
      .then(res => {
        if (!res) {
          return
        }
        soundRef.current = res.sound
        return res.sound.playAsync().catch(() => {
          showToast('出错了，播放失败')
        })
      })
    return () => {
      // console.log('Unloading Sound' + playingSong?.name)
      soundRef.current?.unloadAsync()
    }
  }, [props.url, handlePlayStatusChange, playingSong?.name])
  if (!playingSong) {
    return null
  }
  return (
    <View
      className={`flex-1 absolute bottom-0 z-10 left-0 right-0 px-4 py-6 ${colors.white.bg}`}
      style={{
        shadowColor: 'black',
        shadowOpacity: 0.8,
        shadowOffset: { width: 0, height: -12 },
        shadowRadius: 10,
        elevation: 10, // 添加 Android 阴影效果
      }}>
      <View className="flex-row gap-2">
        <ImageBackground
          source={
            playingSong
              ? { uri: parseImgUrl(playingSong.cover, 180, 180) }
              : require('../../../assets/loading.png')
          }
          resizeMode="cover"
          className="w-16 h-16 rounded">
          <Icon
            name={isPlaying ? 'pause-circle-outline' : 'play-circle-outline'} // pause-circle-outline
            type="material-community"
            size={40}
            className="h-16 justify-center items-center"
            onPress={() => {
              if (isPlaying) {
                soundRef.current?.pauseAsync()
              } else {
                soundRef.current?.playAsync()
              }
            }}
            color={'white'}
          />
        </ImageBackground>
        <View className="flex-1">
          <Text
            className="flex-1 text-base"
            ellipsizeMode="tail"
            numberOfLines={1}>
            {playingSong?.name || '-'}
          </Text>
          <View className="flex-row gap-2 items-center">
            <Text className="text-xs" style={{ fontVariant: ['tabular-nums'] }}>
              {parseTime(playingTime)}
            </Text>
            <Slider
              // @ts-ignore
              className="flex-1"
              value={playingTime}
              onValueChange={updatePlayedTime}
              maximumValue={props.time}
              minimumValue={0}
              step={1}
              allowTouchTrack
              minimumTrackTintColor={tw(colors.secondary.text).color}
              trackStyle={tw('h-1 rounded')}
              thumbStyle={tw(`${colors.secondary.bg} w-3 h-3 rounded-full`)}
            />
            <Text className="text-xs">{parseTime(props.time || 0)}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
const PlayerBarComp = React.memo(PlayerBar)
function MusicPlayerBar() {
  const { playingSong, setPlayingSong } = useStore()
  const { url, time, error } = useAudioUrl(
    playingSong?.bvid || '',
    playingSong?.cid,
  )

  React.useEffect(() => {
    if (error) {
      showToast('抱歉，无法获取音乐')
    }
  }, [error])

  React.useEffect(() => {
    return () => {
      setPlayingSong(null)
    }
  }, [setPlayingSong])
  return <PlayerBarComp url={url} time={time} />
}

export default React.memo(MusicPlayerBar)
