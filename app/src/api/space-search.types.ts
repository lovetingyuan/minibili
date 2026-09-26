import type { DynamicListResponse } from "./dynamic-items.schema";

export type SpaceSearchTabKey = "video" | "dynamic";

export type SpaceDynamicSearchPage = DynamicListResponse & {
  total: number;
};
