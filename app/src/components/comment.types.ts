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
};

export type CommentImageEntryProps = { images: CommentImage[] };
export type CommentTextProps = CommentImageEntryProps & {
  nodes: CommentMessageContent;
  idStr: string;
  likeText?: string;
  likeActive?: boolean;
  likePending?: boolean;
  bold?: boolean;
};
