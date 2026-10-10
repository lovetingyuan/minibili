export type UserActivity = {
  uid: string;
  nickname: string;
  appVersion: string | null;
  firstLoginAt: number;
  lastOpenedAt: number;
};

export type RecordUserOpenInput = {
  uid: string;
  nickname: string;
  appVersion: string | null;
  openedAt: number;
};
