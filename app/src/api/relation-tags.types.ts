import type { z } from "zod";

import type { BilibiliAccount } from "../features/bilibili-session/types";
import type { UpInfo } from "../types";
import type { RelationTagSchema } from "./relation-tags.schema";

export type RelationTagAccount = Pick<BilibiliAccount, "mid" | "generation">;
export type RelationTag = z.infer<typeof RelationTagSchema>;
export type RelationTagRequest = (url: string) => Promise<unknown>;
export type RelationTagRequestDependencies = {
  readCookie: () => Promise<string | null>;
  isCurrentAccount: (account: RelationTagAccount) => boolean;
};
export type RelationTagMembersKey = readonly [
  "bilibili-relation-tag-members",
  string,
  number,
  number,
  number,
];
export type RelationTagsKey = readonly ["bilibili-relation-tags", string, number];
export type SpecialFollowUpsKey = readonly ["bilibili-special-follow-ups", string, number];
export type RelationTagMembersKeyLoader = (
  index: number,
  previousPage: UpInfo[] | null,
) => RelationTagMembersKey | null;
export type RelationUpTagsKey = readonly ["bilibili-up-relation-tags", string, number, string];
export type CreateRelationTagInput = {
  account: RelationTagAccount;
  name: string;
};
export type CreateRelationTagResult = {
  tagid: number;
};
export type RenameRelationTagInput = {
  account: RelationTagAccount;
  tagid: number;
  name: string;
};
export type DeleteRelationTagInput = {
  account: RelationTagAccount;
  tagid: number;
};
export type SetUpRelationTagsInput = {
  account: RelationTagAccount;
  mid: string | number;
  tagids: number[];
};
