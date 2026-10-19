import type { ReplyItemType } from "./comments.types";

export type RepliesPage = {
  page: { num: number; size: number; count: number };
  // 翻页依据保留服务端快照，不能被本地新增、删除后的列表长度影响。
  pagination: { count: number; receivedCount: number };
  replies: ReplyItemType[];
  root: ReplyItemType | null;
};
