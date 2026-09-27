import type { z } from "zod";

import type { appReleaseSchema } from "./check-update.schema";

export type AppRelease = z.infer<typeof appReleaseSchema>;

export type AvailableAppUpdate = {
  release: AppRelease;
  currentVersion: string;
  latestVersion: string;
  downloadLink: string;
};
