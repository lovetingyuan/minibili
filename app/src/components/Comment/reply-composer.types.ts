import type { ReplyItemType } from "@/api/comments";

export type ReplyComposerProps = {
  target: ReplyItemType;
  pending: boolean;
  focusRequested: boolean;
  onSubmit: (message: string) => Promise<boolean>;
};
