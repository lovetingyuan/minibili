import { z } from 'zod'

const MemberSchema = z.object({
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

const ContentSchema = z.object({
  message: z.string(),
  emote: z
    .record(
      z.object({
        text: z.string(),
        url: z.string(),
        id: z.number(),
      }),
    )
    .nullish(),
  members: z
    .object({
      uname: z.string(),
      mid: z.string(),
    })
    .array()
    .nullish(),
  at_name_to_mid: z.record(z.number()).nullish(),
  jump_url: z
    .record(
      z.object({
        title: z.string(),
      }),
    )
    .nullish(),
  picture_scale: z.number().nullish(),
  pictures: z
    .object({
      img_src: z.string(),
      img_width: z.number(),
      img_height: z.number(),
      img_size: z.number(),
      // play_gif_thumbnail: true,
    })
    .array()
    .nullish(),
  vote: z
    .object({
      id: z.number(),
      title: z.string(),
      cnt: z.number(),
      desc: z.string(),
      deleted: z.boolean(),
      url: z.string(),
    })
    .nullish(),
})

const BaseReplySchema = z.object({
  content: ContentSchema,
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
  reply_control: z.object({
    time_desc: z.string().nullish(),
    location: z.string().nullish(),
    sub_reply_entry_text: z.string().nullish(),
    sub_reply_title_text: z.string().nullish(),
  }),
  root: z.number(),
  // root_str: z.string(),
  rpid: z.number(),
  rpid_str: z.string(),
  // show_follow: z.boolean(),
  state: z.number(),
  type: z.number(),
  up_action: z.object({ like: z.boolean(), reply: z.boolean() }),
})

export type ReplayItem = z.infer<typeof BaseReplySchema> & {
  replies: ReplayItem[] | null
}

const RepliesSchema: z.ZodType<ReplayItem> = BaseReplySchema.extend({
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
