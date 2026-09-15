import type { BilibiliAccount } from "../features/bilibili-session/types";
import type { z } from "zod";

import type {
  AddCommentReplyResponseSchema,
  CommentActionResponseSchema,
} from "./comment-actions.schema";

export type CommentAttitude = "none" | "like" | "dislike";
export type CommentAttitudeKind = Exclude<CommentAttitude, "none">;

export type CommentTarget = {
  id: string;
  mid: string;
  name: string;
  oid: string | number;
  root: string | number;
  type: number;
};

export type CommentAttitudeChange = {
  target: CommentTarget;
  kind: CommentAttitudeKind;
  active: boolean;
  sourceUrl: string;
};

export type CommentDeleteChange = {
  target: CommentTarget;
  sourceUrl: string;
};

export type AddCommentReplyInput = {
  target: CommentTarget;
  message: string;
  sourceUrl: string;
};

export type AddCommentInput = {
  oid: string | number;
  type: number;
  message: string;
  sourceUrl: string;
};

export type CommentRequestDependencies = {
  readCookie: () => Promise<string | null>;
  isCurrentAccount: (account: BilibiliAccount) => boolean;
};

export type CommentPostRequestOptions<T> = {
  account: BilibiliAccount;
  dependencies: CommentRequestDependencies;
  url: string;
  sourceUrl: string;
  body: URLSearchParams;
  parse: (payload: unknown) => T;
  actionName: string;
};

export type CommentActionResponse = z.infer<typeof CommentActionResponseSchema>;
export type AddCommentReplyResponse = z.infer<typeof AddCommentReplyResponseSchema>;
