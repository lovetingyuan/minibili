import { z } from 'zod'

export const AuthorSchema = z.object({
  face: z.string(),
  following: z.boolean().nullable(),
  jump_url: z.string(),
  label: z.string(),
  mid: z.number(),
  name: z.string(),
  pub_location_text: z.string().nullish(),
  pub_time: z.string(),
  pub_ts: z.number(),
})

export type Author = z.infer<typeof AuthorSchema>

export enum DynamicHandledTypeEnum {
  DYNAMIC_TYPE_AV = 'DYNAMIC_TYPE_AV',
  DYNAMIC_TYPE_DRAW = 'DYNAMIC_TYPE_DRAW',
  DYNAMIC_TYPE_WORD = 'DYNAMIC_TYPE_WORD',
  DYNAMIC_TYPE_ARTICLE = 'DYNAMIC_TYPE_ARTICLE',
}

export const DynamicNoneType = 'DYNAMIC_TYPE_NONE' as const

export enum DynamicOtherTypeEnum {
  DYNAMIC_TYPE_OTHER = 'DYNAMIC_TYPE_OTHER',
  DYNAMIC_TYPE_NONE = 'DYNAMIC_TYPE_NONE',
  DYNAMIC_TYPE_PGC = 'DYNAMIC_TYPE_PGC',
  DYNAMIC_TYPE_COURSES = 'DYNAMIC_TYPE_COURSES',
  DYNAMIC_TYPE_MUSIC = 'DYNAMIC_TYPE_MUSIC',
  DYNAMIC_TYPE_COMMON_SQUARE = 'DYNAMIC_TYPE_COMMON_SQUARE',
  DYNAMIC_TYPE_COMMON_VERTICAL = 'DYNAMIC_TYPE_COMMON_VERTICAL',
  DYNAMIC_TYPE_LIVE = 'DYNAMIC_TYPE_LIVE',
  DYNAMIC_TYPE_MEDIALIST = 'DYNAMIC_TYPE_MEDIALIST',
  DYNAMIC_TYPE_COURSES_SEASON = 'DYNAMIC_TYPE_COURSES_SEASON',
  DYNAMIC_TYPE_COURSES_BATCH = 'DYNAMIC_TYPE_COURSES_BATCH',
  DYNAMIC_TYPE_AD = 'DYNAMIC_TYPE_AD',
  DYNAMIC_TYPE_APPLET = 'DYNAMIC_TYPE_APPLET',
  DYNAMIC_TYPE_SUBSCRIPTION = 'DYNAMIC_TYPE_SUBSCRIPTION',
  DYNAMIC_TYPE_LIVE_RCMD = 'DYNAMIC_TYPE_LIVE_RCMD',
  DYNAMIC_TYPE_BANNER = 'DYNAMIC_TYPE_BANNER',
  DYNAMIC_TYPE_UGC_SEASON = 'DYNAMIC_TYPE_UGC_SEASON',
  DYNAMIC_TYPE_SUBSCRIPTION_NEW = 'DYNAMIC_TYPE_SUBSCRIPTION_NEW',
}

export const DynamicForwardItemType = 'DYNAMIC_TYPE_FORWARD' as const

export enum MajorHandledTypeEnum {
  MAJOR_TYPE_ARCHIVE = 'MAJOR_TYPE_ARCHIVE',
  MAJOR_TYPE_DRAW = 'MAJOR_TYPE_DRAW',
  MAJOR_TYPE_ARTICLE = 'MAJOR_TYPE_ARTICLE',
  MAJOR_TYPE_LIVE = 'MAJOR_TYPE_LIVE',
  MAJOR_TYPE_WORD = 'MAJOR_TYPE_WORD',
  MAJOR_TYPE_NONE = 'MAJOR_TYPE_NONE',
}

export enum MajorOtherTypeEnum {
  MAJOR_TYPE_PGC = 'MAJOR_TYPE_PGC',
  MAJOR_TYPE_COURSES = 'MAJOR_TYPE_COURSES',
  MAJOR_TYPE_COMMON = 'MAJOR_TYPE_COMMON',
  MAJOR_TYPE_MEDIALIST = 'MAJOR_TYPE_MEDIALIST',
  MAJOR_TYPE_APPLET = 'MAJOR_TYPE_APPLET',
  MAJOR_TYPE_SUBSCRIPTION = 'MAJOR_TYPE_SUBSCRIPTION',
  MAJOR_TYPE_LIVE_RCMD = 'MAJOR_TYPE_LIVE_RCMD',
  MAJOR_TYPE_SUBSCRIPTION_NEW = 'MAJOR_TYPE_SUBSCRIPTION_NEW',
}

export enum AdditionalHandledTypeEnum {
  ADDITIONAL_TYPE_RESERVE = 'ADDITIONAL_TYPE_RESERVE',
  ADDITIONAL_TYPE_UGC = 'ADDITIONAL_TYPE_UGC',
}

export enum AdditionalOtherTypeEnum {
  ADDITIONAL_TYPE_NONE = 'ADDITIONAL_TYPE_NONE',
  ADDITIONAL_TYPE_GOODS = 'ADDITIONAL_TYPE_GOODS',
  ADDITIONAL_TYPE_VOTE = 'ADDITIONAL_TYPE_VOTE',
  ADDITIONAL_TYPE_COMMON = 'ADDITIONAL_TYPE_COMMON',
  ADDITIONAL_TYPE_MATCH = 'ADDITIONAL_TYPE_MATCH',
  ADDITIONAL_TYPE_UP_RCMD = 'ADDITIONAL_TYPE_UP_RCMD',
  ADDITIONAL_TYPE_PGC = 'ADDITIONAL_TYPE_PGC',
}

const MajorAVSchema = z.object({
  type: z.enum([MajorHandledTypeEnum.MAJOR_TYPE_ARCHIVE]),
  archive: z.object({
    aid: z.string(),
    bvid: z.string(),
    cover: z.string(),
    desc: z.string(),
    duration_text: z.string(),
    jump_url: z.string(),
    stat: z.object({ danmaku: z.string(), play: z.string() }),
    title: z.string(),
    type: z.number(),
  }),
})

const MajorDrawSchema = z.object({
  type: z.enum([MajorHandledTypeEnum.MAJOR_TYPE_DRAW]),
  draw: z.object({
    id: z.number(),
    items: z.array(
      z.object({
        src: z.string(),
        width: z.number(),
        height: z.number(),
        size: z.number(),
      }),
    ),
  }),
})

const MajorArticleSchema = z.object({
  type: z.enum([MajorHandledTypeEnum.MAJOR_TYPE_ARTICLE]),
  article: z.object({
    covers: z.array(z.string()),
    desc: z.string(),
    label: z.string(),
    title: z.string(),
    jump_url: z.string(),
  }),
})

const MajorLiveSchema = z.object({
  type: z.enum([MajorHandledTypeEnum.MAJOR_TYPE_LIVE]),
  live: z.object({
    cover: z.string(),
    title: z.string(),
  }),
})

const MajorWordSchema = z.object({
  type: z.enum([MajorHandledTypeEnum.MAJOR_TYPE_WORD]),
  desc: z.object({
    text: z.string(),
  }),
})

const MajorNoneSchema = z.object({
  type: z.enum([MajorHandledTypeEnum.MAJOR_TYPE_NONE]),
  none: z.object({
    tips: z.string(),
  }),
})

const MajorOtherSchema = z.object({
  type: z.nativeEnum(MajorOtherTypeEnum),
})

const AdditionalUgcSchema = z.object({
  type: z.enum([AdditionalHandledTypeEnum.ADDITIONAL_TYPE_UGC]),
  ugc: z.object({
    cover: z.string(),
    title: z.string(),
  }),
})

const AdditionalReserveSchema = z.object({
  type: z.enum([AdditionalHandledTypeEnum.ADDITIONAL_TYPE_RESERVE]),
  reserve: z.object({
    title: z.string(),
    desc1: z.object({ text: z.string() }).optional(),
    desc2: z.object({ text: z.string() }).optional(),
  }),
})

const AdditionalOtherSchema = z.object({
  type: z.nativeEnum(AdditionalOtherTypeEnum),
})

const DynamicItemResponseSchema = z.object({
  type: z.nativeEnum(DynamicHandledTypeEnum),
  id_str: z.string(),
  visible: z.boolean(),
  basic: z.object({
    comment_id_str: z.string(),
    comment_type: z.number(),
  }),
  modules: z.object({
    module_author: AuthorSchema,
    module_tag: z.object({ text: z.string() }).optional(),
    module_stat: z.object({
      comment: z.object({
        count: z.number(),
        forbidden: z.boolean(),
      }),
      forward: z.object({
        count: z.number(),
        forbidden: z.boolean(),
      }),
      like: z.object({
        count: z.number(),
        forbidden: z.boolean(),
        status: z.boolean(),
      }),
    }),
    module_dynamic: z.object({
      desc: z.object({ text: z.string() }).nullable(),
      topic: z.object({ name: z.string(), jump_url: z.string() }).nullish(),
      major: z
        .discriminatedUnion('type', [
          MajorAVSchema,
          MajorDrawSchema,
          MajorArticleSchema,
          MajorLiveSchema,
          MajorNoneSchema,
          // MajorWordSchema,
          MajorOtherSchema,
        ])
        .nullable(),
      additional: z
        .discriminatedUnion('type', [
          AdditionalReserveSchema,
          AdditionalUgcSchema,
          AdditionalOtherSchema,
        ])
        .nullish(),
    }),
  }),
})

const DynamicForwardItemResponseSchema = DynamicItemResponseSchema.extend({
  type: z.enum([DynamicForwardItemType]),
  orig: z.object({
    id_str: z.string().nullable(), // MajorNoneSchema
    basic: z.object({
      comment_id_str: z.string(),
      comment_type: z.number(),
    }),
    type: z.union([
      z.nativeEnum(DynamicHandledTypeEnum),
      z.enum([DynamicNoneType]),
    ]),
    modules: z.object({
      module_author: AuthorSchema,
      module_dynamic: z.object({
        desc: z.object({ text: z.string() }).nullable(),
        major: z
          .discriminatedUnion('type', [
            MajorAVSchema,
            MajorDrawSchema,
            MajorArticleSchema,
            MajorLiveSchema,
            MajorNoneSchema,
            MajorWordSchema,
            MajorOtherSchema,
          ])
          .nullable(),
        additional: z
          .discriminatedUnion('type', [
            AdditionalReserveSchema,
            AdditionalUgcSchema,
            AdditionalOtherSchema,
          ])
          .nullish(),
      }),
    }),
  }),
})

const DynamicOtherItemResponseSchema = z.object({
  type: z.nativeEnum(DynamicOtherTypeEnum),
  id_str: z.string(),
  visible: z.boolean(),
  basic: z.object({
    comment_id_str: z.string(),
    comment_type: z.number(),
  }),
  modules: z.object({
    module_author: AuthorSchema,
    module_dynamic: z.object({
      desc: z.object({ text: z.string() }).nullable(),
    }),
  }),
})

export const DynamicListResponseSchema = z.object({
  has_more: z.boolean(),
  offset: z.string(),
  update_baseline: z.string(),
  update_num: z.number(),
  items: z.array(
    z.discriminatedUnion('type', [
      DynamicItemResponseSchema,
      DynamicOtherItemResponseSchema,
      DynamicForwardItemResponseSchema,
    ]),
  ),
})

export type bar = z.infer<typeof DynamicItemResponseSchema>
// type a = bar['modules']['module_dynamic']['major']
export type foo = z.infer<typeof DynamicListResponseSchema>
export type biz = z.infer<typeof DynamicForwardItemResponseSchema>
