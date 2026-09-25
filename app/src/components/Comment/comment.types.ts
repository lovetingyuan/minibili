import type { CommentAttitudeKind } from "@/api/comment-actions.types";
import type { CommentAttitude } from "@/api/comment-actions.types";
import type { CommentImage, CommentItemType, ReplyItemType } from "@/api/comments";
import type { CommentMessageContent } from "@/api/comments";

export type CommentInteractionProps = {
  onAttitude: (
    comment: ReplyItemType,
    kind: CommentAttitudeKind,
  ) => Promise<CommentAttitude | null>;
  onReply: (comment: ReplyItemType) => void;
  /** 本人评论的删除入口，未提供时评论行内不展示删除 */
  onDelete?: (comment: ReplyItemType) => Promise<boolean>;
  /** 当前登录用户的 mid，用于判断评论是否本人发表 */
  viewerMid?: string;
  isDeletePending?: (id: string) => boolean;
  isAttitudePending: (id: string) => boolean;
};

export type CommentItemProps = CommentInteractionProps & {
  comment: ReplyItemType;
  ownerMid?: string;
  compact?: boolean;
};

export type CommentProps = Omit<CommentInteractionProps, "onReply"> & {
  comment: CommentItemType;
  ownerMid?: string;
  sourceUrl: string;
  /** 首条评论紧贴评论栏，顶部不保留圆角 */
  first?: boolean;
};

export type CommentImageEntryProps = { images: CommentImage[] };

/** 正文末尾的内联点赞入口 */
export type CommentLikeEntryProps = {
  /** 评论 ID，用于区分列表复用后的不同评论 */
  idStr: string;
  /** 点赞数 */
  count: number;
  /** 当前账号是否已点赞 */
  active: boolean;
  /** 点赞请求进行中 */
  pending: boolean;
  /** UP 主也点了赞，数字后追加 +UP */
  creatorLiked: boolean;
  onPress: () => void;
};

export type CommentTextProps = CommentImageEntryProps & {
  nodes: CommentMessageContent;
  idStr: string;
  /** 内联点赞入口；没有点赞数且未点赞时调用方不传，正文末尾就不出现入口 */
  like?: CommentLikeEntryProps;
  /** 当前评论被点踩：正文末尾追加不可点击的 👎 */
  disliked?: boolean;
  bold?: boolean;
  /** UP 主觉得很赞：正文使用主题粉色高亮 */
  creatorLiked?: boolean;
};
