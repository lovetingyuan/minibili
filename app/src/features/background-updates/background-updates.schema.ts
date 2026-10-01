import { z } from "zod";

import { LiveUpsDataSchema } from "@/api/live-ups.schema";
import { FollowingDynamicsUpdateCountSchema } from "@/api/following-dynamics-update.schema";

export const BackgroundContextSchema = z.object({
  mid: z.string().regex(/^\d+$/),
  sessionId: z.string(),
  credentialHash: z.string(),
  expired: z.boolean().optional(),
  followedMids: z.array(z.string()),
  baseline: z.string(),
});

export const PollSnapshotSchema = z.object({
  live: z.object({ at: z.number(), data: LiveUpsDataSchema }).optional(),
  updates: z
    .object({
      at: z.number(),
      baseline: z.string(),
      data: FollowingDynamicsUpdateCountSchema,
    })
    .optional(),
  nav: z
    .object({
      at: z.number(),
      data: z.object({
        latestByMid: z.record(z.string(), z.string()),
        complete: z.boolean(),
        observedAtByMid: z.record(z.string(), z.number()).optional(),
      }),
    })
    .optional(),
  detectedLiveMids: z.array(z.string()).optional(),
});

export const LiveNotificationDataSchema = z.object({
  kind: z.literal("live-up"),
  accountMid: z.string().regex(/^\d+$/),
  mid: z.string().regex(/^\d+$/),
  name: z.string(),
  url: z.string().regex(/^https:\/\/live\.bilibili\.com\/\d+(?:[/?#].*)?$/),
});
