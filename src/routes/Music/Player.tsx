import { Icon, Slider, Text } from '@rneui/themed'
import clsx from 'clsx'
import {
  Audio,
  type AVPlaybackStatus,
  // InterruptionModeAndroid,
  // InterruptionModeIOS,
} from 'expo-av'
// import { Image } from 'expo-image'
import React, { useEffect } from 'react'
import { ImageBackground, TouchableOpacity, View } from 'react-native'

// import { throttle } from 'throttle-debounce'
import { useAudioUrl } from '@/api/play-url'
import { UA } from '@/constants'
import { colors } from '@/constants/colors.tw'
// import useBackgroundTask from '@/hooks/useBackgroundTask'
import useDataChange from '@/hooks/useDataChange'
import useIsDark from '@/hooks/useIsDark'
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

// const audioSoundCache = {}
function PlayerBar(props: { url?: string; time?: number; error?: boolean }) {
  const { playingSong, get$musicList, setPlayingSong } = useStore()
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [playFinished, setPlayFinished] = React.useState(false)
  const [playingTime, setPlayingTime] = React.useState(0)
  const soundRef = React.useRef<Audio.Sound | null>(null)
  const unmountRef = React.useRef(false)

  const stop = () => {
    return soundRef.current?.unloadAsync().catch(() => {})
  }

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
      (s) => s.bvid === playingSong.bvid && s.cid === playingSong.cid,
    )
    return {
      prevSong: songs[index - 1] ?? null,
      nextSong: songs[index + 1] ?? null,
    }
  }, [playingSong, get$musicList])

  const handlePlayStatusChange = useMemoizedFn(
    React.useMemo(() => {
      return (status: AVPlaybackStatus) => {
        if (status.isLoaded) {
          setIsPlaying(status.isPlaying)
          setPlayFinished(status.didJustFinish)
          setPlayingTime(status.positionMillis)
          if (status.didJustFinish) {
            if (playMode === 'order') {
              soundRef.current?.stopAsync()
              if (nextSong) {
                setPlayingSong(nextSong)
              }
            }
          }
        }
      }
    }, [playMode, nextSong, setPlayingSong]),
  )
  useDataChange(() => {
    if (!props.url) {
      return
    }
    setIsPlaying(false)
    setPlayingTime(0)
    setPlayFinished(false)
    if (unmountRef.current) {
      return
    }
    Promise.resolve(stop())
      .then(() => {
        return Audio.Sound.createAsync(
          {
            uri: props.url!,
            headers: {
              'user-agent': UA,
              referer: 'https://www.bilibili.com',
            },
          },
          {
            isLooping: playMode === 'loop' || playMode === 'order',
            shouldPlay: true,
          },
          handlePlayStatusChange,
        )
      })
      .then(({ sound }) => {
        soundRef.current = sound
        if (unmountRef.current) {
          stop()
          return
        }
      })
      .catch(() => {
        showToast('抱歉，播放失败')
      })
    return () => {
      stop()
    }
  }, [props.url])

  useEffect(() => {
    return () => {
      unmountRef.current = true
      stop()
    }
  }, [])

  // useFocusEffect(
  //   React.useCallback(() => {
  //     return () => {
  //       unmountRef.current = true
  //       stop()
  //     }
  //   }, []),
  // )

  const isDark = useIsDark()
  if (!playingSong) {
    return null
  }

  return (
    <ImageBackground
      source={
        isDark
          ? require('../../../assets/bg-342.png')
          : require('../../../assets/bg-111.webp')
      }
      resizeMode="stretch"
      className={`px-4 py-6 ${colors.white.bg}`}
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
            size={50}
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
          <View className="flex-row justify-between items-center">
            <Text
              className="text-lg flex-1"
              ellipsizeMode="tail"
              onPress={() => {
                soundRef.current?.playAsync()
              }}
              numberOfLines={1}>
              {playingSong?.name || '-'}
            </Text>
            <Text className={colors.gray5.text}>
              {playingSong?.singer ? playingSong.singer : ''}
            </Text>
          </View>
          <View className="flex-row gap-6">
            <TouchableOpacity
              activeOpacity={0.6}
              disabled={!prevSong}
              onPress={() => {
                setPlayingSong(prevSong)
              }}>
              <Text
                className={clsx(
                  prevSong ? colors.primary.text : 'opacity-60 line-through',
                )}>
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
                className={clsx(
                  nextSong ? colors.primary.text : 'opacity-60 line-through',
                )}>
                下一首
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => {
                const mode =
                  playMode === 'single'
                    ? 'order'
                    : playMode === 'order'
                      ? 'loop'
                      : 'single'
                setPlayMode(mode)
                soundRef.current?.setIsLoopingAsync(
                  mode === 'loop' || mode === 'order',
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
                onValueChange={(currentTime) => {
                  soundRef.current?.setPositionAsync(currentTime)
                }}
                maximumValue={props.time}
                minimumValue={0}
                step={1000}
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
    </ImageBackground>
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
  return <PlayerBarComp key={url} url={url} time={time} error={!!error} />
}

export default React.memo(MusicPlayerBar)
