import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { Avatar } from '@/components/Avatar'
import { Text } from '@/components/styled/rneui'
import { ThemedIcon } from '@/components/ThemedIcon'
import UpName from '@/components/UpName'
import {
  CalendarDays,
  ChevronRight,
  CirclePlay,
  ListVideo,
  MessageCircle,
  Share2,
} from 'lucide-react-native'
import React from 'react'
import { Linking, Pressable, View } from 'react-native'

import { useWatchingCount } from '@/api/watching-count'
import { VideoBadge } from '@/components/VideoBadge'
import { theme } from '@/constants/theme'
import type { NavigationProps, RootStackParamList } from '@/types'
import { getImagePixelSize, handleShareVideo, parseDate, parseImgUrl, parseNumber } from '@/utils'

import { useVideoInfo } from '../../api/video-info'
import { getVideoDescription } from './description'
import { resolvePreviewNote, resolveVideoBadges } from './video-access'
import type { VideoPreviewReason } from './video-access.types'
import FavoriteButton from './FavoriteButton'
import LikeButton from './LikeButton'
import VideoDescription from './VideoDescription'
import VideoPagesSheet from './VideoPagesSheet'
import { formatVideoPageTitle } from './video-pages-sheet.helpers'

export default VideoInfo

function VideoInfo(props: {
  currentPage: number
  setCurrentPage: (p: number) => void
  /** 试看类型，由播放器判定后上报；播放器里不再提示试看，说明放在这里 */
  previewReason?: VideoPreviewReason | null
}) {
  const route = useRoute<RouteProp<RootStackParamList, 'Play'>>()
  const { data, isLoading } = useVideoInfo(route.params.bvid)
  const videoInfo = {
    ...route.params,
    ...data,
  }
  const { name, face, mid, date, title, desc, pages } = videoInfo
  const videoDesc = getVideoDescription(desc, title)
  // 只用 view 接口就能确定的标识：番剧/影视的 pay=1 也可能是限时免费，不作为角标
  const accessBadges = resolveVideoBadges({
    redirectUrl: videoInfo.redirectUrl ?? '',
    isUpowerExclusive: videoInfo.isUpowerExclusive ?? false,
    isSteinGate: videoInfo.interactive ?? false,
    payRights: videoInfo.payRights ?? { arcPay: 0, pay: 0, ugcPay: 0 },
  })
  const previewNote = props.previewReason ? resolvePreviewNote(props.previewReason) : null
  const [showPagesModal, setShowPagesModal] = React.useState(false)

  const navigation = useNavigation<NavigationProps['navigation']>()
  const watchingCount = useWatchingCount(videoInfo.bvid, videoInfo.cid)

  function openUpSpace() {
    if (mid === undefined || !name) {
      return
    }
    navigation.push('Dynamic', {
      user: {
        mid,
        face: face ?? '',
        name,
        sign: '-',
      },
    })
  }

  return (
    <View>
      <View className="mb-3 w-full flex-row justify-between">
        <View className="mr-1 min-w-0 flex-1 flex-row items-center">
          <Avatar
            accessibilityLabel={`查看 ${name || 'UP主'} 的主页`}
            containerClassName={`shrink-0 ${theme.background.fillDisabled.bg}`}
            onPress={openUpSpace}
            rounded
            size={36}
            source={face ? { uri: parseImgUrl(face, getImagePixelSize(36)) } : undefined}
            title={name?.slice(0, 1)}
          />
          <UpName
            accessibilityLabel={`查看 ${name || 'UP主'} 的主页`}
            accessibilityRole="button"
            numberOfLines={1}
            ellipsizeMode="tail"
            mid={mid}
            onPress={openUpSpace}
            className="ml-3 mr-1 min-w-0 flex-1 text-base font-bold"
          >
            {name || ''}
          </UpName>
        </View>
        <View className="ml-1 flex-none flex-row items-center gap-1 px-2">
          <ThemedIcon icon={CalendarDays} size={16} colorClassName={theme.icon.muted} />
          <Text className={`text-sm ${theme.text.muted}`}>{parseDate(date, true)}</Text>
          <Text className={`ml-1 text-sm ${theme.text.muted}`}>
            {watchingCount
              ? `${watchingCount.total === '1' ? '壹' : watchingCount.total}人在看`
              : ' '}
          </Text>
        </View>
      </View>

      {videoInfo?.argument ? (
        <View className="mb-2 self-start rounded-lg bg-orange-50 px-2 py-1 dark:bg-orange-950/30">
          <Text
            className={`text-xs leading-4 ${theme.warning.text}`}
            onPress={() => {
              if (videoInfo.argumentLink) {
                Linking.openURL(videoInfo.argumentLink)
              }
            }}
          >
            ⚠️ {videoInfo.argument}
          </Text>
        </View>
      ) : null}

      {accessBadges.length ? (
        <View className="mb-1.5 flex-row flex-wrap gap-1.5">
          {accessBadges.map((badge) => (
            <VideoBadge key={badge.label} label={badge.label} tone={badge.tone} />
          ))}
        </View>
      ) : null}

      {previewNote ? (
        <Text className={`mb-1.5 text-xs italic ${theme.warning.text}`}>{`【${previewNote}】`}</Text>
      ) : null}

      <Text selectable className={`text-lg font-bold leading-6 ${theme.text.heading}`}>
        {title}
      </Text>

      {pages && pages.length > 1 ? (
        <View className="mt-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="打开分P列表"
            android_ripple={{ color: 'transparent' }}
            className="flex-row items-center gap-2.5 rounded-2xl bg-slate-100 px-3 py-2 dark:bg-slate-900"
            style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}
            onPress={() => {
              setShowPagesModal(true)
            }}
          >
            <View
              className={`h-9 w-9 items-center justify-center rounded-full ${theme.primary.tint}`}
            >
              <ThemedIcon icon={ListVideo} size={21} colorClassName={theme.primary.accent} />
            </View>
            <Text className="min-w-0 flex-1 text-base" numberOfLines={1} ellipsizeMode="tail">
              {formatVideoPageTitle(
                pages[props.currentPage - 1].title,
                pages[props.currentPage - 1].page,
              )}
            </Text>
            <Text className={`shrink-0 text-sm tabular-nums ${theme.text.muted}`}>
              {`P${props.currentPage}/${pages.length}`}
            </Text>
            <ThemedIcon icon={ChevronRight} size={22} colorClassName={theme.icon.muted} />
          </Pressable>
          <VideoPagesSheet
            currentPage={props.currentPage}
            pages={pages}
            visible={showPagesModal}
            onClose={() => {
              setShowPagesModal(false)
            }}
            onSelectPage={props.setCurrentPage}
          />
        </View>
      ) : null}

      <VideoDescription text={videoDesc} nodes={videoInfo.descriptionNodes} />

      <View className="mt-3 flex-row items-center rounded-xl bg-slate-50 px-1 py-2 dark:bg-slate-900">
        <View className="min-w-0 flex-1 flex-row items-center justify-center gap-1 px-0.5 py-1">
          <ThemedIcon icon={CirclePlay} size={16} colorClassName={theme.icon.primary} />
          <Text selectable className={`text-xs tabular-nums ${theme.text.primary}`}>
            {parseNumber(videoInfo?.playNum)}
          </Text>
        </View>
        <View className="min-w-0 flex-1 flex-row items-center justify-center gap-1 px-0.5 py-1">
          <ThemedIcon icon={MessageCircle} size={16} colorClassName={theme.icon.primary} />
          <Text selectable className={`text-xs tabular-nums ${theme.text.primary}`}>
            {parseNumber(videoInfo?.danmuNum)}
          </Text>
        </View>
        <LikeButton aid={videoInfo.aid} bvid={videoInfo.bvid} count={videoInfo.likeNum} />
        <FavoriteButton aid={videoInfo.aid} bvid={videoInfo.bvid} count={videoInfo.collectNum} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`分享视频，分享数 ${videoInfo.shareNum ?? '加载中'}`}
          className="min-w-0 flex-1 flex-row items-center justify-center gap-1 px-0.5 py-1"
          hitSlop={6}
          onPress={() => {
            if (name && title && route.params.bvid) {
              handleShareVideo(name, title, route.params.bvid, props.currentPage)
            }
          }}
        >
          <ThemedIcon icon={Share2} size={16} colorClassName={theme.icon.primary} />
          <Text selectable className={`text-xs tabular-nums ${theme.text.primary}`}>
            {parseNumber(videoInfo?.shareNum)}
          </Text>
        </Pressable>
      </View>

      {!isLoading && videoInfo?.interactive ? (
        <Text className={`mt-3 italic ${theme.warning.text}`}>【该视频为交互视频，暂不支持】</Text>
      ) : null}
    </View>
  )
}
