import { z } from "zod";

const uid = z.string().regex(/^[1-9]\d*$/);

export const UserSettingsSchema = z.strictObject({
  blackTags: z.record(z.string(), z.string()),
  videoCatesList: z.array(z.strictObject({ rid: z.number().int().nonnegative() })),
});

export const UserDataRequestSchema = z.strictObject({
  settings: UserSettingsSchema.partial().optional(),
});

export const UserDataResponseSchema = z.strictObject({
  success: z.literal(true),
  uid,
  settings: UserSettingsSchema,
});

export const UserOpenRequestSchema = z.strictObject({});
export const UserOpenResponseSchema = z.strictObject({
  success: z.literal(true),
  uid,
});
