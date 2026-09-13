import type { ReplyItemType } from "./comments.types";

export type RepliesPage = {
  page: { num: number; size: number; count: number };
  replies: ReplyItemType[];
  root: ReplyItemType | null;
};
