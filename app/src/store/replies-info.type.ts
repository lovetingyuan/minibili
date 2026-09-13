import type { CommentItemType, ReplyItemType } from "@/api/comments";

export type RepliesInfo = {
  oid: string | number;
  root: string | number;
  type: number;
  allCount: number;
  rootComment: CommentItemType;
  previewReplies: ReplyItemType[];
  addedReplies: ReplyItemType[];
  ownerMid?: string;
  sourceUrl: string;
  replyTarget: ReplyItemType;
  focusComposer: boolean;
};
