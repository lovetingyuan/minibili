import { z } from 'zod'
import {
  HandledAdditionalTypeEnum,
  HandledDynamicTypeEnum,
  HandledForwardTypeEnum,
  HandledRichTextType,
  MajorTypeEnum,
  OtherAdditionalTypeEnum,
  OtherDynamicTypeEnum,
  OtherForwardTypeEnum,
  OtherRichTextType,
} from './dynamic-items.type'

const AuthorSchema = z.object({
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

const RichTextSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.enum([HandledRichTextType.RICH_TEXT_NODE_TYPE_TEXT]),
    // orig_text: z.string(),
    text: z.string(),
  }),
  z.object({
    type: z.enum([HandledRichTextType.RICH_TEXT_NODE_TYPE_WEB]),
    jump_url: z.string(),
    // orig_text: z.string(),
    text: z.string(),
  }),
  z.object({
    type: z.enum([HandledRichTextType.RICH_TEXT_NODE_TYPE_EMOJI]),
    // orig_text: z.string(),
    text: z.string(),
    emoji: z.object({
      icon_url: z.string(),
      text: z.string(),
    }),
  }),
  z.object({
    type: z.enum([HandledRichTextType.RICH_TEXT_NODE_TYPE_AT]),
    rid: z.string(),
    text: z.string(),
  }),
  z.object({
    type: z.enum([HandledRichTextType.RICH_TEXT_NODE_TYPE_TOPIC]),
    jump_url: z.string(),
    text: z.string(),
  }),
  z.object({
    type: z.enum([HandledRichTextType.RICH_TEXT_NODE_TYPE_BV]),
    jump_url: z.string(),
    orig_text: z.string(),
    rid: z.string(),
    text: z.string(),
  }),
  z.object({
    type: z.enum([HandledRichTextType.RICH_TEXT_NODE_TYPE_GOODS]),
    jump_url: z.string(),
    rid: z.string(),
    text: z.string(),
  }),
  z.object({
    type: z.enum([HandledRichTextType.RICH_TEXT_NODE_TYPE_MAIL]),
    text: z.string(),
  }),
  z.object({
    type: z.enum([HandledRichTextType.RICH_TEXT_NODE_TYPE_VOTE]),
    rid: z.string(),
    text: z.string(),
  }),
  z.object({
    type: z.enum([HandledRichTextType.RICH_TEXT_NODE_TYPE_LOTTERY]),
    rid: z.string(),
    text: z.string(),
  }),
  z.object({
    type: z.enum([HandledRichTextType.RICH_TEXT_NODE_TYPE_OGV_SEASON]),
    rid: z.string(),
    jump_url: z.string(),
    text: z.string(),
  }),
  z.object({
    type: z.enum([HandledRichTextType.RICH_TEXT_NODE_TYPE_AV]),
    rid: z.string(),
    jump_url: z.string(),
    text: z.string(),
  }),
  z.object({
    type: z.enum([HandledRichTextType.RICH_TEXT_NODE_TYPE_OGV_EP]),
    rid: z.string(),
    jump_url: z.string(),
    text: z.string(),
  }),
  z.object({
    type: z.enum([HandledRichTextType.RICH_TEXT_NODE_TYPE_CV]),
    rid: z.string(),
    jump_url: z.string(),
    text: z.string(),
  }),
  z.object({
    type: z.nativeEnum(OtherRichTextType),
    text: z.string(),
  }),
])

const MajorSchemaMap = {
  AV: z.object({
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
  }),
  Draw: z.object({
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
  }),
  Article: z.object({
    type: z.enum([MajorTypeEnum.MAJOR_TYPE_ARTICLE]),
    article: z.object({
      covers: z.array(z.string()),
      desc: z.string(),
      label: z.string(),
      title: z.string(),
      jump_url: z.string(),
    }),
  }),
  Live: z.object({
    type: z.enum([MajorTypeEnum.MAJOR_TYPE_LIVE]),
    live: z.object({
      badge: z.object({ text: z.string() }),
      cover: z.string(),
      title: z.string(),
      desc_first: z.string(),
      desc_second: z.string(),
      jump_url: z.string(),
      live_state: z.number(),
    }),
  }),
  Word: z.object({
    type: z.enum([MajorTypeEnum.MAJOR_TYPE_WORD]),
    desc: z.object({
      text: z.string(),
    }),
  }),
  PGC: z.object({
    type: z.enum([MajorTypeEnum.MAJOR_TYPE_PGC]),
    pgc: z.object({
      badge: z.object({
        bg_color: z.string(),
        color: z.string(),
        text: z.string(),
      }),
      cover: z.string(),
      epid: z.number(),
      jump_url: z.string(),
      season_id: z.number(),
      stat: z.object({
        danmaku: z.string(),
        play: z.string(),
      }),
      sub_type: z.number(),
      title: z.string(),
      type: z.number(),
    }),
  }),
  Living: z.object({
    type: z.enum([MajorTypeEnum.MAJOR_TYPE_LIVE_RCMD]),
    live_rcmd: z.object({
      content: z.string(),
      reserve_type: z.number(),
    }),
  }),
  Music: z.object({
    type: z.enum([MajorTypeEnum.MAJOR_TYPE_MUSIC]),
    music: z.object({
      cover: z.string(),
      id: z.number(),
      jump_url: z.string(),
      label: z.string(),
      title: z.string(),
    }),
  }),
  None: z.object({
    type: z.enum([MajorTypeEnum.MAJOR_TYPE_NONE]),
    none: z.object({
      tips: z.string(),
    }),
  }),
  Common: z.object({
    type: z.enum([MajorTypeEnum.MAJOR_TYPE_COMMON]),
    common: z.object({
      badge: z.object({
        // bg_color: '#FB7299',
        color: z.string(),
        text: z.string(),
      }),
      biz_type: z.number(),
      cover: z.string(),
      desc: z.string(),
      id: z.string(),
      jump_url: z.string(),
      label: z.string(),
      // sketch_id: z.string(),
      // style: 1,
      title: z.string(),
    }),
  }),
  MediaList: z.object({
    type: z.enum([MajorTypeEnum.MAJOR_TYPE_MEDIALIST]),
    medialist: z.object({
      badge: z.object({
        // bg_color: '#FB7299',
        color: z.string(),
        text: z.string(),
      }),
      cover: z.string(),
      id: z.string(),
      jump_url: z.string(),
      sub_title: z.string(),
      title: z.string(),
    }),
  }),
  CoursesSeason: z.object({
    type: z.enum([MajorTypeEnum.MAJOR_TYPE_COURSES]),
    courses: z.object({
      badge: z.object({
        // bg_color: '#FB7299',
        color: z.string(),
        text: z.string(),
      }),
      cover: z.string(),
      id: z.number(),
      desc: z.string(),
      jump_url: z.string(),
      sub_title: z.string(),
      title: z.string(),
    }),
  }),
  Opus: z.object({
    type: z.enum([MajorTypeEnum.MAJOR_TYPE_OPUS]),
    opus: z.object({
      jump_url: z.string(),
      pics: z
        .object({
          height: z.number(),
          url: z.string(),
          width: z.number(),
        })
        .array(),
      summary: z.object({
        rich_text_nodes: RichTextSchema.array(),
        text: z.string(),
      }),
      title: z.string(),
    }),
  }),
}

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

const AdditionalSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.enum([HandledAdditionalTypeEnum.ADDITIONAL_TYPE_UGC]),
    ugc: z.object({
      cover: z.string(),
      head_text: z.string(),
      desc_second: z.string(),
      duration: z.string(),
      title: z.string(),
      jump_url: z.string(),
    }),
  }),
  z.object({
    type: z.enum([HandledAdditionalTypeEnum.ADDITIONAL_TYPE_RESERVE]),
    reserve: z.object({
      title: z.string(),
      jump_url: z.string(),
      desc1: z.object({ text: z.string() }).optional(),
      desc2: z.object({ text: z.string() }).optional(),
    }),
  }),
  z.object({
    type: z.enum([HandledAdditionalTypeEnum.ADDITIONAL_TYPE_COMMON]),
    common: z.object({
      cover: z.string(),
      desc1: z.string(),
      desc2: z.string(),
      head_text: z.string(),
      jump_url: z.string(),
      title: z.string(),
    }),
  }),
  z.object({
    type: z.enum([HandledAdditionalTypeEnum.ADDITIONAL_TYPE_GOODS]),
    goods: z.object({
      head_text: z.string(),
      items: z
        .object({
          brief: z.string(),
          cover: z.string(),
          jump_desc: z.string(),
          jump_url: z.string(),
          name: z.string(),
          price: z.string(),
        })
        .array(),
      jump_url: z.string(),
    }),
  }),
  z.object({
    type: z.enum([HandledAdditionalTypeEnum.ADDITIONAL_TYPE_VOTE]),
    vote: z.object({
      desc: z.string(),
      end_time: z.number(),
      join_num: z.number().nullable(),
      uid: z.number(),
      vote_id: z.number(),
    }),
  }),
  z.object({
    type: z.enum([HandledAdditionalTypeEnum.ADDITIONAL_TYPE_MATCH]),
    match: z.object({
      head_text: z.string(),
      id_str: z.string(),
      jump_url: z.string(),
      match_info: z.object({
        center_bottom: z.string(),
        center_top: z.string().array(),
        left_team: z.object({
          id: z.number(),
          name: z.string(),
          pic: z.string(),
        }),
        right_team: z.object({
          id: z.number(),
          name: z.string(),
          pic: z.string(),
        }),
        status: z.number(),
        sub_title: z.string().nullable(),
        title: z.string(),
      }),
    }),
  }),
  z.object({
    type: z.enum([HandledAdditionalTypeEnum.ADDITIONAL_TYPE_UPOWER_LOTTERY]),
    upower_lottery: z.object({
      button: z.object({
        jump_style: z
          .object({
            icon_url: z.string(),
            text: z.string(),
          })
          .nullish(),
        jump_url: z.string().nullish(),
        type: z.number(),
      }),
      desc: z.object({
        jump_url: z.string(),
        style: z.number(),
        text: z.string(),
      }),
      // is_upower_active: false,
      jump_url: z.string(),
      rid: z.number(),
      state: z.number(),
      title: z.string(),
      up_mid: z.number(),
    }),
  }),
  z.object({
    type: z.nativeEnum(OtherAdditionalTypeEnum),
  }),
])

const ModuleDynamicBaseSchema = z.object({
  desc: z
    .object({ text: z.string(), rich_text_nodes: RichTextSchema.array() })
    .nullable(),
  topic: z.object({ name: z.string(), jump_url: z.string() }).nullable(),
  additional: AdditionalSchema.nullish(),
})

export type RichTextNode = z.infer<typeof RichTextSchema>

export type AdditionalType = z.infer<typeof AdditionalSchema>

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

const DynamicItemResponseSchema = z.discriminatedUnion('type', [
  DynamicItemBaseSchema.merge(
    z.object({
      type: z.enum([HandledDynamicTypeEnum.DYNAMIC_TYPE_AV]),
      modules: DynamicModulesBaseSchema.merge(
        z.object({
          module_dynamic: ModuleDynamicBaseSchema.merge(
            z.object({
              major: MajorSchemaMap.AV,
            }),
          ),
        }),
      ),
    }),
  ),
  DynamicItemBaseSchema.merge(
    z.object({
      type: z.enum([HandledDynamicTypeEnum.DYNAMIC_TYPE_WORD]),
      modules: DynamicModulesBaseSchema.merge(
        z.object({
          module_dynamic: ModuleDynamicBaseSchema.merge(
            z.object({
              major: MajorSchemaMap.Word.nullable(),
            }),
          ),
        }),
      ),
    }),
  ),
  DynamicItemBaseSchema.merge(
    z.object({
      type: z.enum([HandledDynamicTypeEnum.DYNAMIC_TYPE_DRAW]),
      modules: DynamicModulesBaseSchema.merge(
        z.object({
          module_dynamic: ModuleDynamicBaseSchema.merge(
            z.object({
              major: MajorSchemaMap.Draw,
            }),
          ),
        }),
      ),
    }),
  ),
  DynamicItemBaseSchema.merge(
    z.object({
      type: z.enum([HandledDynamicTypeEnum.DYNAMIC_TYPE_ARTICLE]),
      modules: DynamicModulesBaseSchema.merge(
        z.object({
          module_dynamic: ModuleDynamicBaseSchema.merge(
            z.object({
              major: z.discriminatedUnion('type', [
                MajorSchemaMap.Article,
                MajorSchemaMap.Opus,
              ]),
            }),
          ),
        }),
      ),
    }),
  ),
  DynamicItemBaseSchema.merge(
    z.object({
      type: z.enum([HandledDynamicTypeEnum.DYNAMIC_TYPE_MUSIC]),
      modules: DynamicModulesBaseSchema.merge(
        z.object({
          module_dynamic: ModuleDynamicBaseSchema.merge(
            z.object({
              major: MajorSchemaMap.Music,
            }),
          ),
        }),
      ),
    }),
  ),
  DynamicItemBaseSchema.merge(
    z.object({
      type: z.enum([HandledDynamicTypeEnum.DYNAMIC_TYPE_PGC]),
      modules: DynamicModulesBaseSchema.merge(
        z.object({
          module_dynamic: ModuleDynamicBaseSchema.merge(
            z.object({
              major: MajorSchemaMap.PGC,
            }),
          ),
        }),
      ),
    }),
  ),
  DynamicItemBaseSchema.merge(
    z.object({
      type: z.enum([HandledDynamicTypeEnum.DYNAMIC_TYPE_COMMON_SQUARE]),
      modules: DynamicModulesBaseSchema.merge(
        z.object({
          module_dynamic: ModuleDynamicBaseSchema.merge(
            z.object({
              major: MajorSchemaMap.Common,
            }),
          ),
        }),
      ),
    }),
  ),
  // DYNAMIC_TYPE_LIVE_RCMD 不做渲染
  DynamicItemBaseSchema.merge(
    z.object({
      type: z.enum([HandledDynamicTypeEnum.DYNAMIC_TYPE_LIVE_RCMD]),
      modules: DynamicModulesBaseSchema.merge(
        z.object({
          module_dynamic: ModuleDynamicBaseSchema.merge(
            z.object({
              major: MajorSchemaMap.Living,
            }),
          ),
        }),
      ),
    }),
  ),
  DynamicItemBaseSchema.merge(
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
              module_dynamic: ModuleDynamicBaseSchema.merge(
                z.object({
                  major: z.null(),
                }),
              ),
            }),
          }),
        ),
        BaseOrigSchema.merge(
          z.object({
            type: z.enum([HandledForwardTypeEnum.DYNAMIC_TYPE_AV]),
            modules: z.object({
              module_author: AuthorSchema,
              module_dynamic: ModuleDynamicBaseSchema.merge(
                z.object({
                  major: MajorSchemaMap.AV,
                }),
              ),
            }),
          }),
        ),
        BaseOrigSchema.merge(
          z.object({
            type: z.enum([HandledForwardTypeEnum.DYNAMIC_TYPE_DRAW]),
            modules: z.object({
              module_author: AuthorSchema,
              module_dynamic: ModuleDynamicBaseSchema.merge(
                z.object({
                  major: MajorSchemaMap.Draw,
                }),
              ),
            }),
          }),
        ),
        BaseOrigSchema.merge(
          z.object({
            type: z.enum([HandledForwardTypeEnum.DYNAMIC_TYPE_ARTICLE]),
            modules: z.object({
              module_author: AuthorSchema,
              module_dynamic: ModuleDynamicBaseSchema.merge(
                z.object({
                  major: z.discriminatedUnion('type', [
                    MajorSchemaMap.Article,
                    MajorSchemaMap.Opus,
                  ]),
                }),
              ),
            }),
          }),
        ),
        BaseOrigSchema.merge(
          z.object({
            type: z.enum([HandledForwardTypeEnum.DYNAMIC_TYPE_LIVE]),
            modules: z.object({
              module_author: AuthorSchema,
              module_dynamic: ModuleDynamicBaseSchema.merge(
                z.object({
                  major: MajorSchemaMap.Live,
                }),
              ),
            }),
          }),
        ),
        BaseOrigSchema.merge(
          z.object({
            type: z.enum([HandledForwardTypeEnum.DYNAMIC_TYPE_NONE]),
            modules: z.object({
              module_author: AuthorSchema,
              module_dynamic: ModuleDynamicBaseSchema.merge(
                z.object({
                  major: MajorSchemaMap.None,
                }),
              ),
            }),
          }),
        ),
        BaseOrigSchema.merge(
          z.object({
            type: z.enum([HandledForwardTypeEnum.DYNAMIC_TYPE_MUSIC]),
            modules: z.object({
              module_author: AuthorSchema,
              module_dynamic: ModuleDynamicBaseSchema.merge(
                z.object({
                  major: MajorSchemaMap.Music,
                }),
              ),
            }),
          }),
        ),
        BaseOrigSchema.merge(
          z.object({
            type: z.enum([HandledForwardTypeEnum.DYNAMIC_TYPE_PGC]),
            modules: z.object({
              module_author: AuthorSchema,
              module_dynamic: ModuleDynamicBaseSchema.merge(
                z.object({
                  major: MajorSchemaMap.PGC,
                }),
              ),
            }),
          }),
        ),
        BaseOrigSchema.merge(
          z.object({
            type: z.enum([HandledForwardTypeEnum.DYNAMIC_TYPE_PGC_UNION]),
            modules: z.object({
              module_author: AuthorSchema,
              module_dynamic: ModuleDynamicBaseSchema.merge(
                z.object({
                  major: MajorSchemaMap.PGC,
                }),
              ),
            }),
          }),
        ),
        BaseOrigSchema.merge(
          z.object({
            type: z.enum([HandledForwardTypeEnum.DYNAMIC_TYPE_COMMON_SQUARE]),
            modules: z.object({
              module_author: AuthorSchema,
              module_dynamic: ModuleDynamicBaseSchema.merge(
                z.object({
                  major: MajorSchemaMap.Common,
                }),
              ),
            }),
          }),
        ),
        BaseOrigSchema.merge(
          z.object({
            type: z.enum([HandledForwardTypeEnum.DYNAMIC_TYPE_MEDIALIST]),
            modules: z.object({
              module_author: AuthorSchema,
              module_dynamic: ModuleDynamicBaseSchema.merge(
                z.object({
                  major: MajorSchemaMap.MediaList,
                }),
              ),
            }),
          }),
        ),
        BaseOrigSchema.merge(
          z.object({
            type: z.enum([HandledForwardTypeEnum.DYNAMIC_TYPE_COURSES_SEASON]),
            modules: z.object({
              module_author: AuthorSchema,
              module_dynamic: ModuleDynamicBaseSchema.merge(
                z.object({
                  major: MajorSchemaMap.CoursesSeason,
                }),
              ),
            }),
          }),
        ),
        BaseOrigSchema.merge(
          z.object({
            type: z.enum([HandledForwardTypeEnum.DYNAMIC_TYPE_LIVE_RCMD]),
            modules: z.object({
              module_author: AuthorSchema,
              module_dynamic: ModuleDynamicBaseSchema.merge(
                z.object({
                  major: MajorSchemaMap.Living,
                }),
              ),
            }),
          }),
        ),
        BaseOrigSchema.merge(
          z.object({
            type: z.nativeEnum(OtherForwardTypeEnum),
            modules: z.object({
              module_author: AuthorSchema,
              module_dynamic: ModuleDynamicBaseSchema.merge(
                z.object({
                  major: z.unknown().nullable(),
                }),
              ),
            }),
          }),
        ),
      ]),
    }),
  ),
  DynamicItemBaseSchema.merge(
    z.object({
      type: z.nativeEnum(OtherDynamicTypeEnum),
    }),
  ),
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
