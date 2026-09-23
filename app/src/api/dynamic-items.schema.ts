import { z } from "zod";

const StringOrNumberSchema = z.union([z.string(), z.number()]);
const NullableStringSchema = z.string().nullish();

const DynamicImageSchema = z
  .object({
    url: z.string().optional(),
    src: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  })
  .passthrough();

const RichTextSchema = z
  .object({
    type: z.string(),
    text: z.string().default(""),
    orig_text: z.string().optional(),
    jump_url: z.string().optional(),
    rid: StringOrNumberSchema.optional(),
    emoji: z
      .object({
        icon_url: z.string().optional(),
        text: z.string().optional(),
      })
      .passthrough()
      .nullish(),
    pics: z.array(DynamicImageSchema).optional(),
  })
  .passthrough();

const SummarySchema = z
  .object({
    text: z.string().default(""),
    rich_text_nodes: z.array(RichTextSchema).default([]),
    has_more: z.boolean().optional(),
  })
  .passthrough();

const AdditionalSchema = z
  .object({
    type: z.string(),
    reserve: z
      .object({
        title: z.string().optional(),
        desc1: z.object({ text: z.string().optional() }).passthrough().nullish(),
        desc2: z.object({ text: z.string().optional() }).passthrough().nullish(),
        button: z
          .object({ jump_url: z.string().optional(), text: z.string().optional() })
          .passthrough()
          .nullish(),
        jump_url: z.string().optional(),
      })
      .passthrough()
      .nullish(),
    ugc: z
      .object({
        title: z.string().optional(),
        desc_second: z.string().optional(),
        cover: z.string().optional(),
        jump_url: z.string().optional(),
      })
      .passthrough()
      .nullish(),
    common: z
      .object({
        head_text: z.string().optional(),
        title: z.string().optional(),
        desc1: z.string().optional(),
        desc2: z.string().optional(),
        cover: z.string().optional(),
        jump_url: z.string().optional(),
        button: z
          .object({ jump_url: z.string().optional(), text: z.string().optional() })
          .passthrough()
          .nullish(),
      })
      .passthrough()
      .nullish(),
    goods: z
      .object({
        head_text: z.string().optional(),
        jump_url: z.string().optional(),
        items: z
          .array(
            z
              .object({
                name: z.string().optional(),
                brief: z.string().optional(),
                cover: z.string().optional(),
                jump_url: z.string().optional(),
                price: z.string().optional(),
              })
              .passthrough(),
          )
          .optional(),
      })
      .passthrough()
      .nullish(),
    vote: z
      .object({
        desc: z.string().optional(),
        join_num: StringOrNumberSchema.optional(),
      })
      .passthrough()
      .nullish(),
    upower_lottery: z
      .object({
        title: z.string().optional(),
        desc: z
          .union([
            z.string(),
            z
              .object({
                text: z.string().optional(),
                jump_url: z.string().optional(),
                style: z.number().optional(),
              })
              .passthrough(),
          ])
          .nullish(),
        hint: z
          .object({
            text: z.string().optional(),
            style: z.number().optional(),
          })
          .passthrough()
          .nullish(),
        jump_url: z.string().optional(),
      })
      .passthrough()
      .nullish(),
  })
  .passthrough();

const MajorSchema = z
  .object({
    type: z.string(),
    archive: z
      .object({
        aid: StringOrNumberSchema.optional(),
        bvid: z.string().optional(),
        cover: z.string().optional(),
        title: z.string().optional(),
        desc: z.string().optional(),
        duration_text: z.string().optional(),
        jump_url: z.string().optional(),
        stat: z
          .object({
            play: StringOrNumberSchema.optional(),
            danmaku: StringOrNumberSchema.optional(),
          })
          .passthrough()
          .optional(),
      })
      .passthrough()
      .nullish(),
    opus: z
      .object({
        title: NullableStringSchema,
        jump_url: z.string().optional(),
        summary: SummarySchema,
        pics: z.array(DynamicImageSchema).default([]),
      })
      .passthrough()
      .nullish(),
    draw: z
      .object({ items: z.array(DynamicImageSchema).default([]) })
      .passthrough()
      .nullish(),
    article: z
      .object({
        title: z.string().optional(),
        desc: z.string().optional(),
        covers: z.array(z.string()).optional(),
        jump_url: z.string().optional(),
      })
      .passthrough()
      .nullish(),
    common: z
      .object({
        title: z.string().optional(),
        desc: z.string().optional(),
        cover: z.string().optional(),
        jump_url: z.string().optional(),
        label: z.string().optional(),
        badge: z.object({ text: z.string().optional() }).passthrough().optional(),
      })
      .passthrough()
      .nullish(),
    pgc: z
      .object({
        title: z.string().optional(),
        cover: z.string().optional(),
        jump_url: z.string().optional(),
        badge: z.object({ text: z.string().optional() }).passthrough().optional(),
        stat: z.object({ play: StringOrNumberSchema.optional() }).passthrough().optional(),
      })
      .passthrough()
      .nullish(),
    music: z
      .object({
        title: z.string().optional(),
        label: z.string().optional(),
        cover: z.string().optional(),
        jump_url: z.string().optional(),
      })
      .passthrough()
      .nullish(),
    live: z
      .object({
        title: z.string().optional(),
        cover: z.string().optional(),
        jump_url: z.string().optional(),
        desc_first: z.string().optional(),
        desc_second: z.string().optional(),
        badge: z.object({ text: z.string().optional() }).passthrough().optional(),
      })
      .passthrough()
      .nullish(),
    live_rcmd: z.object({ content: z.string().optional() }).passthrough().nullish(),
    none: z.object({ tips: z.string().optional() }).passthrough().nullish(),
  })
  .passthrough();

const AuthorSchema = z
  .object({
    face: z.string().default(""),
    following: z.union([z.boolean(), z.number()]).nullish(),
    mid: StringOrNumberSchema,
    name: z.string().default(""),
    pub_action: z.string().default(""),
    pub_time: z.string().default(""),
    pub_ts: StringOrNumberSchema,
  })
  .passthrough();

const ModuleDynamicSchema = z
  .object({
    desc: SummarySchema.nullish(),
    topic: z
      .object({ name: z.string(), jump_url: z.string().default("") })
      .passthrough()
      .nullish(),
    major: MajorSchema.nullish(),
    additional: AdditionalSchema.nullish(),
  })
  .passthrough();

const ModulesSchema = z
  .object({
    module_author: AuthorSchema,
    module_dynamic: ModuleDynamicSchema,
    module_tag: z.object({ text: z.string().optional() }).passthrough().nullish(),
    module_stat: z
      .object({
        comment: z.object({ count: StringOrNumberSchema.default(0) }).passthrough(),
        forward: z.object({ count: StringOrNumberSchema.default(0) }).passthrough(),
        like: z
          .object({
            count: StringOrNumberSchema.default(0),
            status: z.boolean().optional(),
          })
          .passthrough(),
      })
      .passthrough()
      .nullish(),
  })
  .passthrough();

const BasicSchema = z
  .object({
    comment_id_str: StringOrNumberSchema.default(""),
    comment_type: z.number().default(0),
    jump_url: z.string().optional(),
    rid_str: StringOrNumberSchema.optional(),
  })
  .passthrough();

const DynamicItemBaseSchema = z
  .object({
    id_str: StringOrNumberSchema,
    type: z.string(),
    basic: BasicSchema,
    modules: ModulesSchema,
    visible: z.boolean().optional(),
  })
  .passthrough();

/**
 * 被转发的原动态失效时，接口会返回一个占位对象：`id_str: null`、`type: DYNAMIC_TYPE_NONE`、
 * 作者信息全为空、`major.type` 为 `MAJOR_TYPE_NONE`（tips 一般是「源动态不可见」）。
 * 所以这里的 id 必须允许为空，否则整条转发动态都会解析失败。
 */
export const OriginalDynamicItemSchema = DynamicItemBaseSchema.extend({
  id_str: StringOrNumberSchema.nullable(),
}).passthrough();

export const DynamicItemResponseSchema = DynamicItemBaseSchema.extend({
  orig: OriginalDynamicItemSchema.nullish(),
}).passthrough();

export const DynamicListResponseSchema = z
  .object({
    has_more: z.boolean().default(false),
    items: z.array(DynamicItemResponseSchema).default([]),
    offset: NullableStringSchema,
    update_baseline: NullableStringSchema,
    update_num: StringOrNumberSchema.optional(),
  })
  .passthrough();

export const DynamicDetailResponseSchema = z
  .object({ item: DynamicItemResponseSchema })
  .passthrough();

export type RichTextNode = z.infer<typeof RichTextSchema>;
export type DynamicItemResponse = z.infer<typeof DynamicItemResponseSchema>;
export type OriginalDynamicItemResponse = z.infer<typeof OriginalDynamicItemSchema>;
export type DynamicListResponse = z.infer<typeof DynamicListResponseSchema>;
