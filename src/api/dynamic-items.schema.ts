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

export enum DynamicTypeEnum {
  DYNAMIC_TYPE_AV = 'DYNAMIC_TYPE_AV',
  DYNAMIC_TYPE_DRAW = 'DYNAMIC_TYPE_DRAW',
  DYNAMIC_TYPE_WORD = 'DYNAMIC_TYPE_WORD',
  DYNAMIC_TYPE_ARTICLE = 'DYNAMIC_TYPE_ARTICLE',
  DYNAMIC_TYPE_FORWARD = 'DYNAMIC_TYPE_FORWARD',
  // ------------------------------------------
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

export enum MajorTypeEnum {
  MAJOR_TYPE_ARCHIVE = 'MAJOR_TYPE_ARCHIVE',
  MAJOR_TYPE_DRAW = 'MAJOR_TYPE_DRAW',
  MAJOR_TYPE_ARTICLE = 'MAJOR_TYPE_ARTICLE',
  MAJOR_TYPE_LIVE = 'MAJOR_TYPE_LIVE',
  MAJOR_TYPE_WORD = 'MAJOR_TYPE_WORD',
  MAJOR_TYPE_NONE = 'MAJOR_TYPE_NONE',
  // -----------------------------------------
  MAJOR_TYPE_PGC = 'MAJOR_TYPE_PGC',
  MAJOR_TYPE_COURSES = 'MAJOR_TYPE_COURSES',
  MAJOR_TYPE_COMMON = 'MAJOR_TYPE_COMMON',
  MAJOR_TYPE_MEDIALIST = 'MAJOR_TYPE_MEDIALIST',
  MAJOR_TYPE_APPLET = 'MAJOR_TYPE_APPLET',
  MAJOR_TYPE_SUBSCRIPTION = 'MAJOR_TYPE_SUBSCRIPTION',
  MAJOR_TYPE_LIVE_RCMD = 'MAJOR_TYPE_LIVE_RCMD',
  MAJOR_TYPE_SUBSCRIPTION_NEW = 'MAJOR_TYPE_SUBSCRIPTION_NEW',
}

export enum AdditionalTypeEnum {
  ADDITIONAL_TYPE_RESERVE = 'ADDITIONAL_TYPE_RESERVE',
  ADDITIONAL_TYPE_UGC = 'ADDITIONAL_TYPE_UGC',
  // -------------------------------------------------
  ADDITIONAL_TYPE_NONE = 'ADDITIONAL_TYPE_NONE',
  ADDITIONAL_TYPE_GOODS = 'ADDITIONAL_TYPE_GOODS',
  ADDITIONAL_TYPE_VOTE = 'ADDITIONAL_TYPE_VOTE',
  ADDITIONAL_TYPE_COMMON = 'ADDITIONAL_TYPE_COMMON',
  ADDITIONAL_TYPE_MATCH = 'ADDITIONAL_TYPE_MATCH',
  ADDITIONAL_TYPE_UP_RCMD = 'ADDITIONAL_TYPE_UP_RCMD',
  ADDITIONAL_TYPE_PGC = 'ADDITIONAL_TYPE_PGC',
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
  type: z.enum([MajorTypeEnum.MAJOR_TYPE_ARCHIVE]),
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

export type MajorAV = z.infer<typeof MajorAVSchema>

const MajorDrawSchema = z.object({
  type: z.enum([MajorTypeEnum.MAJOR_TYPE_DRAW]),
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

export type MajorDraw = z.infer<typeof MajorDrawSchema>

const MajorArticleSchema = z.object({
  type: z.enum([MajorTypeEnum.MAJOR_TYPE_ARTICLE]),
  article: z.object({
    covers: z.array(z.string()),
    desc: z.string(),
    label: z.string(),
    title: z.string(),
    jump_url: z.string(),
  }),
})

export type MajorArticle = z.infer<typeof MajorArticleSchema>

const MajorLiveSchema = z.object({
  type: z.enum([MajorTypeEnum.MAJOR_TYPE_LIVE]),
  live: z.object({
    badge: z.object({ text: z.string() }),
    cover: z.string(),
    title: z.string(),
  }),
})

export type MajorLive = z.infer<typeof MajorLiveSchema>

const MajorWordSchema = z.object({
  type: z.enum([MajorTypeEnum.MAJOR_TYPE_WORD]),
  desc: z.object({
    text: z.string(),
  }),
})

export type MajorWord = z.infer<typeof MajorWordSchema>

const MajorNoneSchema = z.object({
  type: z.enum([MajorTypeEnum.MAJOR_TYPE_NONE]),
  none: z.object({
    tips: z.string(),
  }),
})

export type MajorNone = z.infer<typeof MajorNoneSchema>

const AdditionalUGCSchema = z.object({
  type: z.enum([AdditionalTypeEnum.ADDITIONAL_TYPE_UGC]),
  ugc: z.object({
    cover: z.string(),
    title: z.string(),
  }),
})

const AdditionalReserveSchema = z.object({
  type: z.enum([AdditionalTypeEnum.ADDITIONAL_TYPE_RESERVE]),
  reserve: z.object({
    title: z.string(),
    desc1: z.object({ text: z.string() }).optional(),
    desc2: z.object({ text: z.string() }).optional(),
  }),
})

const AdditionalOtherSchema = z.object({
  type: z.nativeEnum(AdditionalOtherTypeEnum),
})

const DynamicModulesBaseSchema = z.object({
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
})

const ModuleDynamicBaseSchema = z.object({
  desc: z.object({ text: z.string() }).nullable(),
  topic: z.object({ name: z.string(), jump_url: z.string() }).nullish(),
})

const DynamicItemBaseSchema = z.object({
  id_str: z.string(),
  visible: z.boolean(),
  basic: z.object({
    comment_id_str: z.string(),
    comment_type: z.number(),
  }),
  modules: DynamicModulesBaseSchema.merge(
    z.object({
      module_dynamic: z.object({
        desc: z.object({ text: z.string() }).nullable(),
        topic: z.object({ name: z.string(), jump_url: z.string() }).nullish(),
        // major: z.any(),
        // additional: z.any(),
      }),
    }),
  ),
})

export type DynamicItemBaseType = z.infer<typeof DynamicItemBaseSchema>

const DynamicVideoItemSchema = DynamicItemBaseSchema.merge(
  z.object({
    type: z.enum([DynamicTypeEnum.DYNAMIC_TYPE_AV]),
    modules: DynamicModulesBaseSchema.merge(
      z.object({
        module_dynamic: ModuleDynamicBaseSchema.merge(
          z.object({
            major: MajorAVSchema,
          }),
        ),
      }),
    ),
  }),
)

const DynamicWordItemSchema = DynamicItemBaseSchema.merge(
  z.object({
    type: z.enum([DynamicTypeEnum.DYNAMIC_TYPE_WORD]),
    modules: DynamicModulesBaseSchema.merge(
      z.object({
        module_dynamic: ModuleDynamicBaseSchema.merge(
          z.object({
            major: MajorWordSchema.nullable(),
            additional: z
              .discriminatedUnion('type', [
                AdditionalReserveSchema,
                AdditionalUGCSchema,
                AdditionalOtherSchema,
              ])
              .nullish(),
          }),
        ),
      }),
    ),
  }),
)

const DynamicDrawItemSchema = DynamicItemBaseSchema.merge(
  z.object({
    type: z.enum([DynamicTypeEnum.DYNAMIC_TYPE_DRAW]),
    modules: DynamicModulesBaseSchema.merge(
      z.object({
        module_dynamic: ModuleDynamicBaseSchema.merge(
          z.object({
            major: MajorDrawSchema,
            additional: z
              .discriminatedUnion('type', [
                AdditionalReserveSchema,
                AdditionalUGCSchema,
                AdditionalOtherSchema,
              ])
              .nullish(),
          }),
        ),
      }),
    ),
  }),
)

const DynamicArticleItemSchema = DynamicItemBaseSchema.merge(
  z.object({
    type: z.enum([DynamicTypeEnum.DYNAMIC_TYPE_ARTICLE]),
    modules: DynamicModulesBaseSchema.merge(
      z.object({
        module_dynamic: ModuleDynamicBaseSchema.merge(
          z.object({
            major: MajorArticleSchema,
          }),
        ),
      }),
    ),
  }),
)

const BaseOrigSchema = z.object({
  id_str: z.string().nullable(), // MajorNoneSchema
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

export enum ForwardOtherTypeEnum {
  DYNAMIC_TYPE_OTHER = 'DYNAMIC_TYPE_OTHER',
  DYNAMIC_TYPE_PGC = 'DYNAMIC_TYPE_PGC',
  DYNAMIC_TYPE_COURSES = 'DYNAMIC_TYPE_COURSES',
  DYNAMIC_TYPE_MUSIC = 'DYNAMIC_TYPE_MUSIC',
  DYNAMIC_TYPE_COMMON_SQUARE = 'DYNAMIC_TYPE_COMMON_SQUARE',
  DYNAMIC_TYPE_COMMON_VERTICAL = 'DYNAMIC_TYPE_COMMON_VERTICAL',
  // DYNAMIC_TYPE_LIVE = 'DYNAMIC_TYPE_LIVE',
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

const DynamicForwardItemSchema = DynamicItemBaseSchema.merge(
  z.object({
    type: z.enum([DynamicTypeEnum.DYNAMIC_TYPE_FORWARD]),
    modules: DynamicModulesBaseSchema.merge(
      z.object({
        module_dynamic: ModuleDynamicBaseSchema.merge(
          z.object({
            major: z.null(),
          }),
        ),
      }),
    ),
    orig: z.discriminatedUnion('type', [
      BaseOrigSchema.merge(
        z.object({
          type: z.enum([DynamicTypeEnum.DYNAMIC_TYPE_WORD]),
          modules: z.object({
            module_author: AuthorSchema,
            module_dynamic: z.object({
              additional: AdditionalReserveSchema.nullable(),
              desc: z.object({ text: z.string() }).nullable(),
              major: z.null(),
            }),
          }),
        }),
      ),
      BaseOrigSchema.merge(
        z.object({
          type: z.enum([DynamicTypeEnum.DYNAMIC_TYPE_AV]),
          modules: z.object({
            module_author: AuthorSchema,
            module_dynamic: z.object({
              desc: z.object({ text: z.string() }).nullable(),
              major: MajorAVSchema,
            }),
          }),
        }),
      ),
      BaseOrigSchema.merge(
        z.object({
          type: z.enum([DynamicTypeEnum.DYNAMIC_TYPE_DRAW]),
          modules: z.object({
            module_author: AuthorSchema,
            module_dynamic: z.object({
              desc: z.object({ text: z.string() }).nullable(),
              major: MajorDrawSchema,
            }),
          }),
        }),
      ),
      BaseOrigSchema.merge(
        z.object({
          type: z.enum([DynamicTypeEnum.DYNAMIC_TYPE_ARTICLE]),
          modules: z.object({
            module_author: AuthorSchema,
            module_dynamic: z.object({
              desc: z.object({ text: z.string() }).nullable(),
              major: MajorArticleSchema,
            }),
          }),
        }),
      ),
      BaseOrigSchema.merge(
        z.object({
          type: z.enum([DynamicTypeEnum.DYNAMIC_TYPE_LIVE]),
          modules: z.object({
            module_author: AuthorSchema,
            module_dynamic: z.object({
              desc: z.object({ text: z.string() }).nullable(),
              major: MajorLiveSchema,
            }),
          }),
        }),
      ),
      BaseOrigSchema.merge(
        z.object({
          type: z.enum([DynamicTypeEnum.DYNAMIC_TYPE_NONE]),
          modules: z.object({
            module_author: AuthorSchema,
            module_dynamic: z.object({
              desc: z.object({ text: z.string() }).nullable(),
              major: MajorNoneSchema,
            }),
          }),
        }),
      ),
      BaseOrigSchema.merge(
        z.object({
          type: z.nativeEnum(ForwardOtherTypeEnum),
          modules: z.object({
            module_author: AuthorSchema,
            module_dynamic: z.object({
              desc: z.object({ text: z.string() }).nullable(),
              major: z.unknown().nullable(),
            }),
          }),
        }),
      ),
    ]),
  }),
)

export type DynamicForwardItem = z.infer<typeof DynamicForwardItemSchema>

export enum OtherTypeEnum {
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

const DynamicUnknownItemSchema = DynamicItemBaseSchema.merge(
  z.object({
    type: z.nativeEnum(OtherTypeEnum),
  }),
)

export type DynamicUnknownItem = z.infer<typeof DynamicUnknownItemSchema>

const DynamicItemResponseSchema = z.discriminatedUnion('type', [
  DynamicVideoItemSchema,
  DynamicWordItemSchema,
  DynamicDrawItemSchema,
  DynamicArticleItemSchema,
  DynamicForwardItemSchema,
  DynamicUnknownItemSchema,
])

export type DynamicItemResponse = z.infer<typeof DynamicItemResponseSchema>

export const DynamicListResponseSchema = z.object({
  has_more: z.boolean(),
  offset: z.string(),
  update_baseline: z.string(),
  update_num: z.number(),
  items: z.array(DynamicItemResponseSchema),
})

export type DynamicListResponse = z.infer<typeof DynamicListResponseSchema>
