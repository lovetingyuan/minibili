import { useNavigation } from '@react-navigation/native'
import { FAB } from '@rn-vui/themed'
import { FlashList } from '@shopify/flash-list'
import React from 'react'
import { Alert, Dimensions, Linking, TouchableOpacity } from 'react-native'

import type { VideoItem as VideoItemType } from '@/api/hot-videos'
import { colors } from '@/constants/colors.tw'
import { useStore } from '@/store'
import { useMarkVideoWatched } from '@/store/actions'
import type { NavigationProps } from '@/types'
import { handleShareVideo, parseNumber, parseUrl } from '@/utils'

import Loading from './Loading'
import VideoItem from './VideoItem'

type Footer = React.ReactElement | null | undefined

function VideoList(props: {
  videos: VideoItemType[]
  type: 'Hot' | 'Rank' | 'Search'
  footer?: Footer | ((l: any[]) => Footer)
  onReachEnd?: () => void
  onRefresh?: (fab?: boolean) => void
  isRefreshing?: boolean
}) {
  const {
    $blackUps,
    $blackTags,
    set$blackTags,
    set$blackUps,
    setOverlayButtons,
    currentVideosCate,
  } = useStore()
  const videoList = React.useMemo(() => {
    const result: VideoItemType[] = []
    const uniqVideosMap: Record<string, boolean> = {}
    for (const item of props.videos) {
      let needShow = !(item.bvid in uniqVideosMap)
      if (
        needShow &&
        props.type === 'Hot' &&
        (`_${item.mid}` in $blackUps || item.tag in $blackTags)
      ) {
        needShow = false
      }
      if (needShow && props.type === 'Rank' && `_${item.mid}` in $blackUps) {
        needShow = false
      }
      if (needShow) {
        uniqVideosMap[item.bvid] = true
        result.push(item)
      }
    }
    return result
  }, [props.videos, props.type, $blackTags, $blackUps])

  const navigation = useNavigation<NavigationProps['navigation']>()
  const listRef = React.useRef<any>(null)
  const currentVideoRef = React.useRef<VideoItemType | null>(null)
  const markVideoWatched = useMarkVideoWatched()
  React.useEffect(() => {
    setTimeout(() => {
      listRef.current?.scrollToOffset(0)
    })
  }, [currentVideosCate])
  const addBlackUp = () => {
    if (!currentVideoRef.current) {
      return
    }
    Alert.alert(`不再看 ${currentVideoRef.current.name} 的视频？`, '', [
      {
        text: '取消',
        style: 'cancel',
      },
      {
        text: '确定',
        onPress: () => {
          const { mid, name } = currentVideoRef.current!
          set$blackUps({
            ...$blackUps,
            [`_${mid}`]: name,
          })
        },
      },
    ])
  }
  const addBlackTagName = () => {
    if (!currentVideoRef.current) {
      return
    }
    Alert.alert(`不再看 ${currentVideoRef.current.tag} 类型的视频？`, '', [
      {
        text: '取消',
        style: 'cancel',
      },
      {
        text: '确定',
        onPress: () => {
          const { tag } = currentVideoRef.current!
          set$blackTags({
            ...$blackTags,
            [tag]: tag,
          })
        },
      },
    ])
  }
  const gotoPlay = (data: VideoItemType) => {
    navigation.navigate('Play', {
      aid: data.aid,
      bvid: data.bvid,
      title: data.title,
      desc: data.desc,
      mid: data.mid,
      face: data.face,
      name: data.name,
      cover: data.cover,
      date: data.date,
      tag: data.tag,
      // video: data,
    })
  }
  const renderItem = ({ item }: { item: VideoItemType }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        className="mx-[5px] mb-6 flex-1 flex-row justify-around"
        key={item.bvid}
        onPress={() => gotoPlay(item)}
        onLongPress={() => {
          currentVideoRef.current = item
          setOverlayButtons(buttons())
        }}>
        <VideoItem video={item} />
      </TouchableOpacity>
    )
  }
  const markWatched = () => {
    const videoInfo = currentVideoRef.current
    if (!videoInfo) {
      return
    }
    markVideoWatched(videoInfo, 100)
  }
  const buttons = () =>
    [
      {
        text: `不再看「${currentVideoRef.current?.name}」的视频`,
        onPress: addBlackUp,
      },
      props.type === 'Hot' && {
        text: `不再看「${currentVideoRef.current?.tag}」类型的视频`,
        onPress: addBlackTagName,
      },
      {
        text: `分享(${parseNumber(currentVideoRef.current?.shareNum)})`,
        onPress: () => {
          if (currentVideoRef.current) {
            const { name, title, bvid } = currentVideoRef.current
            handleShareVideo(name, title, bvid)
          }
        },
      },
      {
        text: '标记观看完成',
        onPress: markWatched,
      },
      {
        text: '查看封面',
        onPress: () => {
          if (!currentVideoRef.current) {
            return
          }
          Linking.openURL(parseUrl(currentVideoRef.current.cover))
        },
      },
    ].filter((v) => v && typeof v === 'object')
  const refreshProps = props.onRefresh
    ? {
        onRefresh: props.onRefresh,
        refreshing: props.isRefreshing,
      }
    : null
  const reachEndProps = props.onReachEnd
    ? {
        onEndReached: props.onReachEnd,
        onEndReachedThreshold: 0.5,
      }
    : null
  return (
    <>
      <FlashList
        ref={(v) => {
          listRef.current = v
        }}
        numColumns={2}
        data={videoList}
        renderItem={renderItem}
        persistentScrollbar
        estimatedItemSize={Dimensions.get('window').width / 2}
        ListEmptyComponent={<Loading />}
        ListFooterComponent={
          typeof props.footer === 'function'
            ? props.footer(videoList)
            : props.footer
        }
        contentContainerStyle={tw('px-[4px] pt-6')}
        estimatedFirstItemOffset={100}
        {...refreshProps}
        {...reachEndProps}
      />
      {props.type === 'Hot' && (
        <FAB
          visible
          color={tw(colors.secondary.text).color}
          placement="right"
          icon={{ name: 'refresh', color: 'white' }}
          className="bottom-3 opacity-90"
          size="small"
          onPress={() => {
            listRef.current?.scrollToOffset(0)
            props.onRefresh?.(true)
          }}
        />
      )}
    </>
  )
}

export default VideoList
