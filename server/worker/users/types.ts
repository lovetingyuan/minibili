export type UserActivity = {
  uid: string;
  nickname: string;
  firstLoginAt: number;
  lastUsedAt: number;
};

export type RecordUserActivityInput = {
  uid: string;
  nickname: string;
  usedAt: number;
};
