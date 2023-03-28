import { z } from 'zod'

export const MemberSchema = z.object({
  avatar: z.string(),
  is_senior_member: z.union([z.literal(0), z.literal(1)]),
  level_info: z.object({
    current_level: z.number(),
    current_min: z.number(),
    current_exp: z.number(),
    next_exp: z.number(),
  }),
  mid: z.string(),
  rank: z.string(),
  sex: z.string(),
  sign: z.string(),
  uname: z.string(),
})

export const baseReplySchema = z.object({
  content: z.object({
    message: z.string(),
  }),
  count: z.number(),
  ctime: z.number(),
  invisible: z.boolean(),
  like: z.number(),
  member: MemberSchema,
  mid: z.number(),
  oid: z.number(),
  parent: z.number(),
  rcount: z.number(),
  // replies: z.lazy(() => ReplySchema.array()).nullable(),
  // reply_control: { time_desc: z.string(),; location: z.string(), }
  root: z.number(),
  // root_str: z.string(),
  rpid: z.number(),
  rpid_str: z.string(),
  // show_follow: z.boolean(),
  state: z.number(),
  type: z.number(),
  up_action: z.object({ like: z.boolean(), reply: z.boolean() }),
})

type ReplaySchema = z.infer<typeof baseReplySchema> & {
  replies: ReplaySchema[] | null
}

const RepliesSchema: z.ZodType<ReplaySchema> = baseReplySchema.extend({
  replies: z.lazy(() => RepliesSchema.array()).nullable(),
})

export const ReplyResponseSchema = z.object({
  assist: z.number(),
  blacklist: z.number(),
  note: z.number(),
  cursor: z.object({
    is_begin: z.boolean(),
    prev: z.number(),
    next: z.number(),
    is_end: z.boolean(),
    all_count: z.number(),
    mode: z.number(),
    name: z.string(),
  }),
  replies: RepliesSchema.array(),
  top: z.object({
    // admin: null
    upper: RepliesSchema.nullable(),
    // vote: null
  }),
  top_replies: RepliesSchema.array().nullable(),
  // up_selection: {pending_count: 0, ignore_count: 0}
  upper: z.object({ mid: z.number() }),
  // vote: 0
})
