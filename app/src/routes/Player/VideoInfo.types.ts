import type { WatchingCountResponseType } from '@/api/watching-count.schema'
import type { VideoPreviewReason } from './video-access.types'

export type VideoInfoProps = {
  currentPage: number
  setCurrentPage: (p: number) => void
  onCommentPress: () => void
  watchingCount?: WatchingCountResponseType
  /** 试看类型，由播放器判定后上报；播放器里不再提示试看，说明放在这里 */
  previewReason?: VideoPreviewReason | null
}
