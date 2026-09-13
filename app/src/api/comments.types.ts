import type { CommentAttitude } from "./comment-actions.types";
import type { CommentCursor } from "./comments.schema";

export type CommentMessageNode =
  | { type: "text"; text: string }
  | { type: "url"; url: string }
  | { type: "emoji"; url: string }
  | { type: "at"; text: string; mid: number }
  | { type: "vote"; text?: string; url?: string }
  | { type: "av"; text: string; url: string };

export type CommentMessageContent = CommentMessageNode[];

export type CommentImage = {
  src: string;
  width: number;
  height: number;
  ratio: number;
};

export type ReplyItemType = {
  message: CommentMessageContent;
  images: CommentImage[];
  name: string;
  mid: string;
  face: string;
  sign: string;
  id: string;
  oid: string | number;
  root: string | number;
  root_str: string;
  rcount: number;
  attitude: CommentAttitude;
  creatorLiked: boolean;
  moreText?: string | null;
  location?: string | null;
  time?: string | null;
  top: boolean;
  like: number;
  sex: string;
  type: number;
  replies: ReplyItemType[];
};

export type CommentItemType = ReplyItemType & { replies: ReplyItemType[] };

export type CommentsPage = {
  cursor: CommentCursor;
  replies: CommentItemType[];
  ownerMid: string;
};
