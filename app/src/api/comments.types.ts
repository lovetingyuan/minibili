import type { CommentAttitude } from "./comment-actions.types";
import type { CommentCursor } from "./comments.schema";

type CommentMessageNode =
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

/**
 * 评论分页的 SWR key：`[url, page]`。
 * 服务端翻页时经常连续返回同一个 next_offset（要再请求一次才向后推进），
 * 只拿 url 当 key 会把新的一页当成上一页的缓存，页码用于区分每一页。
 */
export type CommentsKey = readonly [url: string, page: number];

export type CommentsKeyLoader = (
  index: number,
  previous: CommentsPage | null,
) => CommentsKey | null;
