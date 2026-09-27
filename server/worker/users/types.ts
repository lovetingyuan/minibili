export type UserActivity = {
  uid: string;
  nickname: string;
  appVersion: string | null;
  firstLoginAt: number;
  lastUsedAt: number;
};

export type RecordUserActivityInput = {
  uid: string;
  nickname: string;
  appVersion: string | null;
  usedAt: number;
};

export type ConsumeFeedbackQuotaInput = {
  ipHash: string;
  usedAt: number;
};

export type FeedbackQuotaResult =
  | { allowed: true }
  | { allowed: false; scope: "global" | "ip" };
