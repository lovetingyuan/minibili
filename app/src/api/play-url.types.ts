import type { z } from "zod";

import type { DashManifestSchema } from "./play-url.schema";

export type VideoQuality = 16 | 32 | 64 | 80;
export type VideoStreamFormat = "mp4" | "dash";
export type DashManifest = z.infer<typeof DashManifestSchema>;
export type DashStream = DashManifest["video"][number];

export type VideoDownloadSource = {
  urls: string[];
  quality: number;
  size: number;
};
