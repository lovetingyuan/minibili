import type { z } from "zod";
import type { FollowingDynamicsAccount } from "@/api/following-dynamics.types";
import type {
  BackgroundContextSchema,
  LiveNotificationDataSchema,
  PollSnapshotSchema,
} from "./background-updates.schema";

export type BackgroundContext = z.infer<typeof BackgroundContextSchema>;
export type PollSnapshot = z.infer<typeof PollSnapshotSchema>;
export type LiveNotificationData = z.infer<typeof LiveNotificationDataSchema>;
export type PollOwner = {
  mid: string;
  followedMids: readonly string[];
  isCurrent: () => boolean | Promise<boolean>;
};
export type ForegroundPollAccount = FollowingDynamicsAccount;
export type PendingLiveNotification = { identifier: string; data: LiveNotificationData };
export type AppliedPollTime = { at: number; baseline?: string };
