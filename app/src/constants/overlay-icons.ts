import {
  AlarmClockMinus,
  Ban,
  CircleUserRound,
  ClockPlus,
  Copy,
  EyeOff,
  FolderCog,
  Image as ImageIcon,
  Mail,
  Pencil,
  Reply,
  Share2,
  StarOff,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  UserMinus,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

/**
 * 长按菜单（ButtonsOverlay）按钮的语义图标。
 *
 * 同一语义在多个入口复用同一枚图标，调用点只声明语义、不各写各的，
 * 例如「从稍后再看移除」在视频列表、动态卡片、稍后再看页都用 ClockMinus。
 */
export const overlayIcons = {
  /** 添加到稍后再看 */
  addWatchLater: ClockPlus,
  /**
   * 从稍后再看移除
   *
   * lucide 只有 ClockPlus，没有对应的 ClockMinus，
   * 这里用同族的 AlarmClockMinus 保持「时钟 + 移除」的语义。
   */
  removeWatchLater: AlarmClockMinus,
  /** 拉黑 UP 主 */
  blockUp: Ban,
  /** 不再看某类型的视频 */
  hideTagType: EyeOff,
  /** 分享 */
  share: Share2,
  /** 查看封面 */
  viewCover: ImageIcon,
  /** 复制评论 */
  copyComment: Copy,
  /** 点赞 */
  like: ThumbsUp,
  /** 点踩 */
  dislike: ThumbsDown,
  /** 回复评论 */
  reply: Reply,
  /** 设置关注分组 */
  setGroup: FolderCog,
  /** 取消关注 */
  unfollow: UserMinus,
  /** 标记动态未读 */
  markUnread: Mail,
  /** 查看头像 */
  viewAvatar: CircleUserRound,
  /** 修改分组名称 */
  rename: Pencil,
  /** 删除分组、删除收藏夹 */
  remove: Trash2,
  /** 取消收藏 */
  unfavorite: StarOff,
} as const satisfies Record<string, LucideIcon>;
