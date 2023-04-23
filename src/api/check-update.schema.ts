import { z } from 'zod'

export const BuildListSchema = z
  .object({
    id: z.string(),
    status: z.enum(['PENDING', 'FINISHED']),
    platform: z.enum(['ANDROID', 'IOS', 'ALL']),
    artifacts: z.object({
      buildUrl: z.string(),
      applicationArchiveUrl: z.string(),
    }),
    initiatingActor: z.object({
      id: z.string(),
      displayName: z.string(),
    }),
    project: z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      ownerAccount: z.object({
        id: z.string(),
        name: z.string(),
      }),
    }),
    releaseChannel: z.string(),
    distribution: z.enum(['STORE']),
    buildProfile: z.string(),
    sdkVersion: z.string(),
    appVersion: z.string(),
    appBuildVersion: z.string(),
    gitCommitHash: z.string(),
    gitCommitMessage: z.string(),
    // priority: 'NORMAL'
    createdAt: z.string(),
    updatedAt: z.string(),
    completedAt: z.string(),
    // resourceClass: 'ANDROID_MEDIUM'
  })
  .array()
