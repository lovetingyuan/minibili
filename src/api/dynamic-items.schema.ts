import { z } from 'zod'
import {
  AdditionalTypeEnum,
  HandledDynamicTypeEnum,
  HandledForwardTypeEnum,
  MajorTypeEnum,
  OtherAdditionalTypeEnum,
  OtherDynamicTypeEnum,
  OtherForwardTypeEnum,
} from './dynamic-items.type'

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

const MajorLivingSchema = z.object({
  type: z.enum([MajorTypeEnum.MAJOR_TYPE_LIVE_RCMD]),
  live_rcmd: z.object({
    content: z.string(),
    reserve_type: z.number(),
  }),
})

export type MajorLiving = z.infer<typeof MajorLivingSchema>

const MajorMusicSchema = z.object({
  type: z.enum([MajorTypeEnum.MAJOR_TYPE_MUSIC]),
  music: z.object({
    cover: z.string(),
    id: z.number(),
    jump_url: z.string(),
    label: z.string(),
    title: z.string(),
  }),
})

export type MajorMusic = z.infer<typeof MajorMusicSchema>

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
  type: z.nativeEnum(OtherAdditionalTypeEnum),
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
  // type: z.nativeEnum(DynamicTypeEnum),
  basic: z.object({
    comment_id_str: z.string(),
    comment_type: z.number(),
  }),
  modules: DynamicModulesBaseSchema.merge(
    z.object({
      module_dynamic: ModuleDynamicBaseSchema,
    }),
  ),
})

export type DynamicItemBaseType = z.infer<typeof DynamicItemBaseSchema>

const DynamicVideoItemSchema = DynamicItemBaseSchema.merge(
  z.object({
    type: z.enum([HandledDynamicTypeEnum.DYNAMIC_TYPE_AV]),
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
    type: z.enum([HandledDynamicTypeEnum.DYNAMIC_TYPE_WORD]),
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
    type: z.enum([HandledDynamicTypeEnum.DYNAMIC_TYPE_DRAW]),
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
    type: z.enum([HandledDynamicTypeEnum.DYNAMIC_TYPE_ARTICLE]),
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

const DynamicMusicItemSchema = DynamicItemBaseSchema.merge(
  z.object({
    type: z.enum([HandledDynamicTypeEnum.DYNAMIC_TYPE_MUSIC]),
    modules: DynamicModulesBaseSchema.merge(
      z.object({
        module_dynamic: ModuleDynamicBaseSchema.merge(
          z.object({
            major: MajorMusicSchema,
          }),
        ),
      }),
    ),
  }),
)

const DynamicLivingItemSchema = DynamicItemBaseSchema.merge(
  z.object({
    type: z.enum([HandledDynamicTypeEnum.DYNAMIC_TYPE_LIVE_RCMD]),
    modules: DynamicModulesBaseSchema.merge(
      z.object({
        module_dynamic: ModuleDynamicBaseSchema.merge(
          z.object({
            major: MajorLivingSchema,
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

const DynamicForwardItemSchema = DynamicItemBaseSchema.merge(
  z.object({
    type: z.enum([HandledDynamicTypeEnum.DYNAMIC_TYPE_FORWARD]),
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
          type: z.enum([HandledForwardTypeEnum.DYNAMIC_TYPE_WORD]),
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
          type: z.enum([HandledForwardTypeEnum.DYNAMIC_TYPE_AV]),
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
          type: z.enum([HandledForwardTypeEnum.DYNAMIC_TYPE_DRAW]),
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
          type: z.enum([HandledForwardTypeEnum.DYNAMIC_TYPE_ARTICLE]),
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
          type: z.enum([HandledForwardTypeEnum.DYNAMIC_TYPE_LIVE]),
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
          type: z.enum([HandledForwardTypeEnum.DYNAMIC_TYPE_NONE]),
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
          type: z.enum([HandledForwardTypeEnum.DYNAMIC_TYPE_MUSIC]),
          modules: z.object({
            module_author: AuthorSchema,
            module_dynamic: z.object({
              desc: z.object({ text: z.string() }).nullable(),
              major: MajorMusicSchema,
            }),
          }),
        }),
      ),
      BaseOrigSchema.merge(
        z.object({
          type: z.nativeEnum(OtherForwardTypeEnum),
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

const DynamicUnknownItemSchema = DynamicItemBaseSchema.merge(
  z.object({
    type: z.nativeEnum(OtherDynamicTypeEnum),
  }),
)

export type DynamicUnknownItem = z.infer<typeof DynamicUnknownItemSchema>

const DynamicItemResponseSchema = z.discriminatedUnion('type', [
  DynamicVideoItemSchema,
  DynamicWordItemSchema,
  DynamicDrawItemSchema,
  DynamicArticleItemSchema,
  DynamicForwardItemSchema,
  DynamicLivingItemSchema,
  DynamicMusicItemSchema,
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
