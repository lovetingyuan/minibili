import { useNavigation } from '@react-navigation/native'
import { FAB } from '@rneui/themed'
import { FlashList } from '@shopify/flash-list'
import React from 'react'
import { Alert, Dimensions, Linking, TouchableOpacity } from 'react-native'

import type { VideoItem as VideoItemType } from '@/api/hot-videos'
import { colors } from '@/constants/colors.tw'
import { useStore } from '@/store'
import { NavigationProps } from '@/types'
import { handleShareVideo, parseNumber, parseUrl } from '@/utils'
import { Action, reportUserAction } from '@/utils/report'

import Loading from './Loading'
import VideoItem from './VideoItem'

type Footer = React.ReactElement | null | undefined

function VideoList(props: {
  videos: VideoItemType[]
  type: 'Hot' | 'Rank' | 'Search'
  footer?: Footer | ((l: any[]) => Footer)
  onReachEnd?: () => void
  onRefresh?: () => void
  isRefreshing?: boolean
}) {
  const {
    $blackUps,
    $blackTags,
    set$blackTags,
    set$blackUps,
    setOverlayButtons,
  } = useStore()
  const videoList = React.useMemo(() => {
    const result: VideoItemType[] = []
    const uniqVideosMap: Record<string, boolean> = {}
    for (const item of props.videos) {
      let needShow = !(item.bvid in uniqVideosMap)
      if (
        needShow &&
        props.type === 'Hot' &&
        ('_' + item.mid in $blackUps || item.tag in $blackTags)
      ) {
        needShow = false
      }
      if (needShow && props.type === 'Rank' && '_' + item.mid in $blackUps) {
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

  const addBlackUp = () => {
    if (!currentVideoRef.current) {
      return
    }
    const { mid, name } = currentVideoRef.current
    set$blackUps({
      ...$blackUps,
      ['_' + mid]: name,
    })
    reportUserAction(Action.add_black_user, { mid, name })
  }
  const addBlackTagName = () => {
    if (!currentVideoRef.current) {
      return
    }
    const { tag } = currentVideoRef.current
    set$blackTags({
      ...$blackTags,
      [tag]: tag,
    })
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
        className="flex-1 flex-row justify-around mx-1 mb-6"
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
  const buttons = () =>
    [
      {
        text: `不再看「${currentVideoRef.current?.name}」的视频`,
        onPress: () => {
          Alert.alert(`不再看 ${currentVideoRef.current?.name} 的视频？`, '', [
            {
              text: '取消',
              style: 'cancel',
            },
            { text: '确定', onPress: addBlackUp },
          ])
        },
      },
      props.type === 'Hot' && {
        text: `不再看「${currentVideoRef.current?.tag}」类型的视频`,
        onPress: () => {
          Alert.alert(
            `不再看 ${currentVideoRef.current?.tag} 类型的视频？`,
            '',
            [
              {
                text: '取消',
                style: 'cancel',
              },
              { text: '确定', onPress: addBlackTagName },
            ],
          )
        },
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
        text: '查看封面',
        onPress: () => {
          if (!currentVideoRef.current) {
            return
          }
          Linking.openURL(parseUrl(currentVideoRef.current.cover))
        },
      },
    ].filter(Boolean)
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
        ref={v => {
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
        contentContainerStyle={tw('px-1 pt-4')}
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
            props.onRefresh?.()
          }}
        />
      )}
    </>
  )
}

export default VideoList
