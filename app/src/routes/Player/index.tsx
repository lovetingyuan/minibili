import { useBackHandler } from '@react-native-community/hooks'
import { useIsFocused } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Text } from '@/components/Text'
import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { Alert, View } from 'react-native'

import { getApiErrorCode } from '@/api/fetcher'
import { isLoginRequiredError } from '@/features/bilibili-session/login-required'
import useUpdateNavigationOptions from '@/hooks/useUpdateNavigationOptions'
import { useWatchProgressRefresh } from '@/hooks/useWatchProgressRefresh'
import { showToast } from '@/utils'

import { useVideoInfo } from '../../api/video-info'
import CommentList from '@/components/Comment'
import type { RootStackParamList } from '../../types'
import { PlayHeaderRight, PlayHeaderTitle } from './Header'
import NativePlayer from './native/NativePlayer'
import Player from './Player'
import {
  DEFAULT_PLAYBACK_MODE,
  resolveNextPageOnEnded,
  toggleAutoNextMode,
  toggleLoopMode,
  type PlayEndedEvent,
} from './playback-mode'
import { PLAYER_MODE } from './player-mode'
import type { VideoPreviewReason } from './video-access.types'
import VideoInfo from './VideoInfo'

// https://www.bilibili.com/blackboard/webplayer/mbplayer.html?aid=1501398719&bvid=BV1HS421w7wG&cid=1458260037&p=1
// https://www.bilibili.com/blackboard/html5mobileplayer.html?&bvid=BV1aX4y1B7n7&cid=1103612055&wmode=transparent&as_wide=1&crossDomain=1&lite=0&danmaku=0
// https://www.bilibili.com/blackboard/newplayer.html?crossDomain=true&bvid=BV1cB4y1n7v8&as_wide=1&page=1&autoplay=0&poster=1
// https://player.bilibili.com/player.html?aid=899458592&bvid=BV1BN4y1G7tx&cid=802365081&page=1

type Props = NativeStackScreenProps<RootStackParamList, 'Play'>

function Play({ route }: Props) {
  const { bvid } = route.params

  const { data, error } = useVideoInfo(bvid)
  // 离开播放页时把刚看完的进度同步到封面进度条
  useWatchProgressRefresh()
  const videoInfo = {
    ...route.params,
    ...data,
  }
  const [currentPage, setCurrentPage] = React.useState(1)
  const currentPageRef = React.useRef(currentPage)
  // 播放结束等异步回调需要读取分P，改在提交后同步，避免渲染阶段写 ref
  React.useEffect(() => {
    currentPageRef.current = currentPage
  }, [currentPage])
  const [playbackMode, setPlaybackMode] = React.useState(DEFAULT_PLAYBACK_MODE)
  // 试看类型由播放器判定后上报，交给播放器下方的视频信息区展示说明
  const [previewReason, setPreviewReason] = React.useState<VideoPreviewReason | null>(null)
  const pageInfo = videoInfo.pages?.[currentPage - 1]
  // 下载用当前分P 的 cid，没有分P 信息时退回视频自身的 cid
  const downloadCid = pageInfo?.cid ?? videoInfo.cid ?? 0

  const hasVideoInfo = Boolean(data)
  const errorShowedRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (!error || hasVideoInfo) {
      errorShowedRef.current = null
      return
    }
    if (isLoginRequiredError(error)) {
      return
    }

    const code = getApiErrorCode(error)
    const unavailable = code === -403 || code === -404
    const notificationKey = `${bvid}:${unavailable ? 'unavailable' : 'request'}`
    // 自动重试不重复提示；网络失败后若确认视频不可用，仍需展示对应说明。
    if (errorShowedRef.current === notificationKey) {
      return
    }
    errorShowedRef.current = notificationKey

    if (unavailable) {
      Alert.alert('视频不可用', '视频不存在、已被删除或没有访问权限')
    } else {
      showToast('视频信息加载失败，请检查网络后重试')
    }
  }, [bvid, error, hasVideoInfo])

  const [fullscreen, setFullscreen] = React.useState(false)

  const isFocused = useIsFocused()
  // 全屏时返回键先退出全屏，而不是直接退出播放页
  useBackHandler(() => {
    if (fullscreen && isFocused) {
      setFullscreen(false)
      return true
    }
    return false
  })

  useUpdateNavigationOptions({
    headerTitle: () => <PlayHeaderTitle />,
    headerShown: !fullscreen,
    headerRight: () => (
      <PlayHeaderRight cid={downloadCid} page={currentPage} pageTitle={pageInfo?.title} />
    ),
  })

  const handlePlayEnd = (ended: PlayEndedEvent) => {
    const activePage = currentPageRef.current
    const activePageInfo = videoInfo.pages?.[activePage - 1]
    const nextPage = resolveNextPageOnEnded({
      currentCid: activePageInfo?.cid ?? videoInfo.cid ?? 0,
      currentPage: activePage,
      ended,
      mode: playbackMode,
      pageCount: videoInfo.pages?.length ?? 1,
    })
    if (nextPage !== null) {
      const nextPageTitle = videoInfo.pages?.[nextPage - 1]?.title?.trim()
      showToast(nextPageTitle ? `正在播放 P${nextPage}：${nextPageTitle}` : `正在播放 P${nextPage}`)
      currentPageRef.current = nextPage
      setCurrentPage(nextPage)
    }
  }

  const handleSelectPage = (page: number) => {
    // 先同步失效旧播放源，避免状态提交前收到旧播放器的结束事件后跳到下一P。
    currentPageRef.current = page
    setCurrentPage(page)
  }

  return (
    <View className="flex-1">
      <StatusBar hidden={fullscreen} style="auto" />
      {PLAYER_MODE === 'web' ? (
        <Player currentPage={currentPage} onPlayEnded={handlePlayEnd} />
      ) : (
        <NativePlayer
          currentPage={currentPage}
          onPlayEnded={handlePlayEnd}
          onPreviewReasonChange={setPreviewReason}
          playbackMode={playbackMode}
          showAutoNext={(videoInfo.pages?.length ?? 0) > 1}
          onToggleAutoNext={() => {
            const next = toggleAutoNextMode(playbackMode)
            setPlaybackMode(next)
            showToast(next.autoNext ? '自动分 P 已开启：播完后继续下一 P' : '自动分 P 已关闭')
          }}
          onToggleLoop={() => {
            const next = toggleLoopMode(playbackMode)
            setPlaybackMode(next)
            showToast(next.loop ? '循环播放已开启：当前分 P 将重复播放' : '循环播放已关闭')
          }}
          fullscreen={fullscreen}
          onFullscreenChange={setFullscreen}
        />
      )}
      <CommentList
        commentId={videoInfo?.aid || ''}
        commentCount={videoInfo.replyNum}
        commentType={1}
        sourceUrl={`https://www.bilibili.com/video/${bvid}/`}
        dividerRight={
          <View className="flex-row items-center">
            <Text className="text-xs text-gray-500 dark:text-gray-400">{videoInfo?.tag}</Text>
          </View>
        }
      >
        {({ openComposer }) => (
          <VideoInfo
            currentPage={currentPage}
            previewReason={previewReason}
            setCurrentPage={handleSelectPage}
            onCommentPress={openComposer}
          />
        )}
      </CommentList>
    </View>
  )
}

export default Play
