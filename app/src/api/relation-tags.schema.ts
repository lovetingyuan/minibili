import { z } from "zod";

export const RelationTagSchema = z.object({
  tagid: z.number().int(),
  name: z.string(),
  count: z.number().int().nonnegative(),
  tip: z
    .string()
    .nullish()
    .transform((tip) => tip ?? ""),
});

export const RelationTagsSchema = z.array(RelationTagSchema);

const RelationTagMemberSchema = z.object({
  mid: z.number(),
  uname: z.string(),
  face: z
    .string()
    .nullish()
    .transform((face) => face ?? ""),
  sign: z
    .string()
    .nullish()
    .transform((sign) => sign ?? ""),
});

export const RelationTagMembersSchema = z.array(RelationTagMemberSchema);

export const RelationUpTagsSchema = z.object({
  tag: z
    .array(z.number().int())
    .nullish()
    .transform((tags) => tags ?? []),
});

export const RelationTagMutationResponseSchema = z.object({
  code: z.number().int(),
  message: z.string().optional(),
  data: z.unknown().optional(),
});

export const RelationTagCreateDataSchema = z.object({
  tagid: z.number().int(),
});

export type RelationTagMemberData = z.infer<typeof RelationTagMemberSchema>;
