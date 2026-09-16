export type PartPlayProgressSnapshot = {
  positionMs: number;
  durationMs: number;
  updatedAt: number;
};

export type PartPlayProgressMap = Record<string, PartPlayProgressSnapshot>;
