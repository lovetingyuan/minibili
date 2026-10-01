export type LiveStreamSource = {
  uri: string;
  expiresAt: number | null;
};

export type LivePlayInfo = {
  roomId: string;
  isLive: boolean;
  sources: LiveStreamSource[];
};
