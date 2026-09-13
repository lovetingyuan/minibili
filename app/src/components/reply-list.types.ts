import type { CommentAttitude, CommentAttitudeKind } from "@/api/comment-actions.types";
import type { ReplyItemType } from "@/api/comments";

export type ReplyListProps = {
  onAttitude: (
    comment: ReplyItemType,
    kind: CommentAttitudeKind,
  ) => Promise<CommentAttitude | null>;
  onSubmitReply: (target: ReplyItemType, message: string) => Promise<ReplyItemType | null>;
  isAttitudePending: (id: string) => boolean;
  isReplyPending: (id: string) => boolean;
};
