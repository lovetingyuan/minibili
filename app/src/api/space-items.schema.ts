import { z } from "zod";

const StringOrNumberSchema = z.union([z.string(), z.number()]);
const CountSchema = StringOrNumberSchema.transform((value) => Number(value)).pipe(
  z.number().int().nonnegative(),
);

export const SpaceContentCountsSchema = z
  .object({
    video: CountSchema,
    opus: CountSchema,
  })
  .passthrough();

export const SpaceVideoItemSchema = z
  .object({
    aid: StringOrNumberSchema,
    author: z.string().default(""),
    bvid: z.string(),
    comment: StringOrNumberSchema.default(0),
    created: StringOrNumberSchema.default(0),
    description: z.string().default(""),
    /** 充电专属角标文案，普通投稿为空字符串 */
    elec_arc_badge: z.string().default(""),
    /** 充电专属标记。B站 历史上给过布尔、数字与字符串三种形态，这里全部兼容 */
    is_charging_arc: z.union([z.boolean(), StringOrNumberSchema]).default(false),
    length: z.string().default(""),
    mid: StringOrNumberSchema,
    pic: z.string().default(""),
    play: StringOrNumberSchema.default(0),
    title: z.string().default(""),
    video_review: StringOrNumberSchema.default(0),
  })
  .passthrough();

export const SpaceVideoPageSchema = z
  .object({
    list: z
      .object({
        vlist: z.array(SpaceVideoItemSchema).default([]),
      })
      .passthrough(),
  })
  .passthrough();

const SpaceOpusCoverSchema = z
  .object({
    url: z.string(),
    width: z.number().default(1),
    height: z.number().default(1),
  })
  .passthrough();

export const SpaceOpusItemSchema = z
  .object({
    jump_url: z.string().default(""),
    opus_id: StringOrNumberSchema,
    content: z.string().default(""),
    cover: SpaceOpusCoverSchema.nullish(),
    stat: z
      .object({
        like: StringOrNumberSchema.default(0),
        view: StringOrNumberSchema.default(0),
      })
      .passthrough(),
    pub_time: z.string().default(""),
  })
  .passthrough();

export const SpaceOpusPageSchema = z
  .object({
    items: z.array(SpaceOpusItemSchema).default([]),
    offset: z.string().default(""),
    has_more: z.boolean().default(false),
  })
  .passthrough();

export type SpaceVideoItemResponse = z.infer<typeof SpaceVideoItemSchema>;
export type SpaceVideoPage = z.infer<typeof SpaceVideoPageSchema>;
export type SpaceOpusItemResponse = z.infer<typeof SpaceOpusItemSchema>;
export type SpaceOpusPage = z.infer<typeof SpaceOpusPageSchema>;
