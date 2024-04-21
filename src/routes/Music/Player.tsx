import { Icon, Slider, Text } from '@rneui/themed'
import clsx from 'clsx'
import {
  Audio,
  AVPlaybackStatus,
  // InterruptionModeAndroid,
  // InterruptionModeIOS,
} from 'expo-av'
// import { Image } from 'expo-image'
import React from 'react'
import { ImageBackground, TouchableOpacity, View } from 'react-native'
import { throttle } from 'throttle-debounce'

import { useAudioUrl } from '@/api/play-url'
import { UA } from '@/constants'
import { colors } from '@/constants/colors.tw'
import useMemoizedFn from '@/hooks/useMemoizedFn'
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

const shadowStyle = {
  shadowColor: 'black',
  shadowOpacity: 0.8,
  shadowOffset: { width: 0, height: -12 },
  shadowRadius: 10,
  elevation: 10, // 添加 Android 阴影效果
}

function PlayerBar(props: { url?: string; time?: number }) {
  const { playingSong, get$musicList, setPlayingSong } = useStore()
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [playFinished, setPlayFinished] = React.useState(false)
  const [playingTime, setPlayingTime] = React.useState(0)
  const soundRef = React.useRef<Audio.Sound | null>(null)
  const [playMode, setPlayMode] = React.useState<'single' | 'order' | 'loop'>(
    'single',
  )

  const { prevSong, nextSong } = React.useMemo(() => {
    if (!playingSong) {
      return {
        prevSong: null,
        nextSong: null,
      }
    }
    const [{ songs }] = get$musicList()
    const index = songs.findIndex(
      s => s.bvid === playingSong.bvid && s.cid === playingSong.cid,
    )
    return {
      prevSong: songs[index - 1] ?? null,
      nextSong: songs[index + 1] ?? null,
    }
  }, [playingSong, get$musicList])
  const handlePlayStatusChange = useMemoizedFn(
    React.useMemo(() => {
      return throttle(200, (status: AVPlaybackStatus) => {
        if (status.isLoaded) {
          setIsPlaying(status.isPlaying)
          setPlayFinished(status.didJustFinish)
          setPlayingTime(status.positionMillis)
          if (status.didJustFinish) {
            if (playMode === 'loop') {
              soundRef.current?.replayAsync()
            } else if (playMode === 'order') {
              if (nextSong) {
                setPlayingSong(nextSong)
              }
            }
          }
        }
      })
    }, [playMode, nextSong, setPlayingSong]),
  )

  React.useEffect(() => {
    setIsPlaying(false)
    setPlayingTime(0)
    setPlayFinished(false)
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
          handlePlayStatusChange,
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
  }, [props.url, handlePlayStatusChange])

  if (!playingSong) {
    return null
  }

  return (
    <View
      className={`flex-1 absolute bottom-0 z-10 left-0 right-0 px-4 py-6 ${colors.white.bg}`}
      style={shadowStyle}>
      <View className="flex-row gap-3">
        <ImageBackground
          source={
            playingSong
              ? { uri: parseImgUrl(playingSong.cover, 180, 180) }
              : require('../../../assets/loading.png')
          }
          resizeMode="cover"
          className="w-20 h-20 rounded">
          <Icon
            name={isPlaying ? 'pause-circle-outline' : 'play-circle-outline'} // pause-circle-outline
            type="material-community"
            size={40}
            className="h-full justify-center items-center"
            onPress={() => {
              if (isPlaying) {
                soundRef.current?.pauseAsync()
              } else if (playFinished) {
                soundRef.current?.replayAsync()
              } else {
                soundRef.current?.playAsync()
              }
            }}
            color={'white'}
          />
        </ImageBackground>
        <View className="flex-1 justify-between">
          <Text className="text-base" ellipsizeMode="tail" numberOfLines={1}>
            {playingSong?.name || '-'}
          </Text>
          <View className="flex-row gap-6">
            <TouchableOpacity
              activeOpacity={0.6}
              disabled={!prevSong}
              onPress={() => {
                setPlayingSong(prevSong)
              }}>
              <Text
                className={clsx(prevSong ? colors.primary.text : 'opacity-60')}>
                上一首
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.6}
              disabled={!nextSong}
              onPress={() => {
                setPlayingSong(nextSong)
              }}>
              <Text
                className={clsx(nextSong ? colors.primary.text : 'opacity-60')}>
                下一首
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => {
                setPlayMode(
                  playMode === 'single'
                    ? 'order'
                    : playMode === 'order'
                      ? 'loop'
                      : 'single',
                )
              }}>
              <Text className={colors.primary.text}>
                {playMode === 'single'
                  ? '单曲播放'
                  : playMode === 'order'
                    ? '顺序播放'
                    : '循环单曲'}
              </Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row gap-2 items-center">
            <Text className="text-xs" style={{ fontVariant: ['tabular-nums'] }}>
              {parseTime(playingTime)}
            </Text>

            {props.url ? (
              <Slider
                // @ts-ignore
                className="flex-1 h-2"
                value={playingTime}
                onValueChange={currentTime => {
                  soundRef.current?.setPositionAsync(currentTime)
                }}
                maximumValue={props.time}
                minimumValue={0}
                step={1}
                allowTouchTrack
                minimumTrackTintColor={tw(colors.secondary.text).color}
                trackStyle={tw('h-1 rounded')}
                thumbStyle={tw(`${colors.secondary.bg} w-3 h-3 rounded-full`)}
              />
            ) : null}
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
