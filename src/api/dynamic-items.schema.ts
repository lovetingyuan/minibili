import { z } from 'zod'

export const AuthorSchema = z.object({
  face: z.string(),
  following: z.boolean(),
  jump_url: z.string(),
  label: z.string(),
  mid: z.number(),
  name: z.string(),
  pub_location_text: z.string(),
  pub_time: z.string(),
  pub_ts: z.number(),
})

export type Author = z.infer<typeof AuthorSchema>

export enum DynamicTypes {
  DYNAMIC_TYPE_AV = 'DYNAMIC_TYPE_AV',
  DYNAMIC_TYPE_FORWARD = 'DYNAMIC_TYPE_FORWARD',
  DYNAMIC_TYPE_DRAW = 'DYNAMIC_TYPE_DRAW',
  DYNAMIC_TYPE_WORD = 'DYNAMIC_TYPE_WORD',
  DYNAMIC_TYPE_OTHER = 'DYNAMIC_TYPE_OTHER',
  DYNAMIC_TYPE_NONE = 'DYNAMIC_TYPE_NONE',
  DYNAMIC_TYPE_PGC = 'DYNAMIC_TYPE_PGC',
  DYNAMIC_TYPE_COURSES = 'DYNAMIC_TYPE_COURSES',
  DYNAMIC_TYPE_ARTICLE = 'DYNAMIC_TYPE_ARTICLE',
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
  // --------------
  DYNAMIC_TYPE_UNKNOWN = 'DYNAMIC_TYPE_UNKNOWN',
}

const DynamicTypeEnum = z.nativeEnum(DynamicTypes)
// type DynamicTypeEnum = z.infer<typeof DynamicTypeEnum>

export type DynamicType = keyof typeof DynamicTypeEnum

export const enum DynamicMajorTypeEnum {
  MAJOR_TYPE_ARCHIVE = 'MAJOR_TYPE_ARCHIVE',
  MAJOR_TYPE_PGC = 'MAJOR_TYPE_PGC',
  MAJOR_TYPE_COURSES = 'MAJOR_TYPE_COURSES',
  MAJOR_TYPE_DRAW = 'MAJOR_TYPE_DRAW',
  MAJOR_TYPE_ARTICLE = 'MAJOR_TYPE_ARTICLE',
  MAJOR_TYPE_COMMON = 'MAJOR_TYPE_COMMON',
  MAJOR_TYPE_LIVE = 'MAJOR_TYPE_LIVE',
  MAJOR_TYPE_MEDIALIST = 'MAJOR_TYPE_MEDIALIST',
  MAJOR_TYPE_APPLET = 'MAJOR_TYPE_APPLET',
  MAJOR_TYPE_SUBSCRIPTION = 'MAJOR_TYPE_SUBSCRIPTION',
  MAJOR_TYPE_LIVE_RCMD = 'MAJOR_TYPE_LIVE_RCMD',
  MAJOR_TYPE_SUBSCRIPTION_NEW = 'MAJOR_TYPE_SUBSCRIPTION_NEW',
  MAJOR_TYPE_WORD = 'MAJOR_TYPE_WORD',
  MAJOR_TYPE_NONE = 'MAJOR_TYPE_NONE',
}

export const enum DynamicAdditionalTypeEnum {
  ADDITIONAL_TYPE_NONE = 'ADDITIONAL_TYPE_NONE',
  ADDITIONAL_TYPE_PGC = 'ADDITIONAL_TYPE_PGC',
  ADDITIONAL_TYPE_GOODS = 'ADDITIONAL_TYPE_GOODS',
  ADDITIONAL_TYPE_VOTE = 'ADDITIONAL_TYPE_VOTE',
  ADDITIONAL_TYPE_COMMON = 'ADDITIONAL_TYPE_COMMON',
  ADDITIONAL_TYPE_MATCH = 'ADDITIONAL_TYPE_MATCH',
  ADDITIONAL_TYPE_UP_RCMD = 'ADDITIONAL_TYPE_UP_RCMD',
  ADDITIONAL_TYPE_UGC = 'ADDITIONAL_TYPE_UGC',
  ADDITIONAL_TYPE_RESERVE = 'ADDITIONAL_TYPE_RESERVE',
}

interface MajorAV {
  type: DynamicMajorTypeEnum.MAJOR_TYPE_ARCHIVE
  archive: {
    aid: string
    bvid: string
    cover: string
    desc: string
    duration_text: string
    jump_url: string
    stat: { danmaku: string; play: string }
    title: string
    type: number
  }
}

interface MajorDraw {
  type: DynamicMajorTypeEnum.MAJOR_TYPE_DRAW
  draw: {
    id: number
    items: {
      src: string
      width: number
      height: number
      size: number
    }[]
  }
}

interface MajorArticle {
  type: DynamicMajorTypeEnum.MAJOR_TYPE_ARTICLE
  article: {
    covers: string[]
    desc: string
    label: string
    title: string
    jump_url: string
  }
}

interface MajorLive {
  type: DynamicMajorTypeEnum.MAJOR_TYPE_LIVE
  live: {
    cover: string
    title: string
  }
}

interface MajorWord {
  type: DynamicMajorTypeEnum.MAJOR_TYPE_WORD
  desc: {
    text: string
  }
}

interface MajorNone {
  type: DynamicMajorTypeEnum.MAJOR_TYPE_NONE
  none: {
    tips: string
  }
}

export interface DynamicItemResponse<T extends DynamicTypes> {
  type: T
  id_str: string
  visible: boolean
  basic: {
    comment_id_str: string
    comment_type: number
  }
  modules: {
    module_author: Author
    module_dynamic: {
      desc: { text: string } | null
      topic: { name: string; jump_url: string } | null
      major: T extends
        | DynamicTypes.DYNAMIC_TYPE_FORWARD
        | DynamicTypes.DYNAMIC_TYPE_WORD
        ? null
        : T extends DynamicTypes.DYNAMIC_TYPE_AV
        ? MajorAV
        : T extends DynamicTypes.DYNAMIC_TYPE_DRAW
        ? MajorDraw
        : T extends DynamicTypes.DYNAMIC_TYPE_ARTICLE
        ? MajorArticle
        : unknown
      additional?: T extends
        | DynamicTypes.DYNAMIC_TYPE_WORD
        | DynamicTypes.DYNAMIC_TYPE_DRAW
        ?
            | {
                type: DynamicAdditionalTypeEnum.ADDITIONAL_TYPE_RESERVE
                reserve: {
                  title: string
                  desc1?: { text: string }
                  desc2?: { text: string }
                }
              }
            | {
                type: DynamicAdditionalTypeEnum.ADDITIONAL_TYPE_UGC
                ugc: {
                  cover: string
                  title: string
                }
              }
        : never
    }
    module_tag?: { text: string }
    module_stat: {
      comment: {
        count: number
        forbidden: boolean
      }
      forward: {
        count: number
        forbidden: boolean
      }
      like: {
        count: number
        forbidden: boolean
        status: boolean
      }
    }
  }
}

export interface DynamicForwardItemResponse<F extends DynamicTypes>
  extends DynamicItemResponse<DynamicTypes.DYNAMIC_TYPE_FORWARD> {
  orig: {
    id_str: string
    basic: {
      comment_id_str: string
      comment_type: number
    }
    type: F
    modules: {
      module_author: Author
      module_dynamic: {
        desc: { text: string } | null
        major: F extends DynamicTypes.DYNAMIC_TYPE_AV
          ? MajorAV
          : F extends DynamicTypes.DYNAMIC_TYPE_DRAW
          ? MajorDraw
          : F extends DynamicTypes.DYNAMIC_TYPE_LIVE
          ? MajorLive
          : F extends DynamicTypes.DYNAMIC_TYPE_WORD
          ? MajorWord
          : F extends DynamicTypes.DYNAMIC_TYPE_ARTICLE
          ? MajorArticle
          : F extends DynamicTypes.DYNAMIC_TYPE_NONE
          ? MajorNone
          : unknown
        additional?: {
          reserve?: {
            title?: string
            desc1?: { text: string }
          }
        }
      }
    }
  }
}

export interface DynamicListResponse {
  has_more: boolean
  offset: string
  update_baseline: string
  update_num: number
  items: (
    | DynamicItemResponse<DynamicTypes.DYNAMIC_TYPE_AV>
    | DynamicItemResponse<DynamicTypes.DYNAMIC_TYPE_DRAW>
    | DynamicItemResponse<DynamicTypes.DYNAMIC_TYPE_WORD>
    | DynamicItemResponse<DynamicTypes.DYNAMIC_TYPE_ARTICLE>
    | DynamicItemResponse<DynamicTypes.DYNAMIC_TYPE_UNKNOWN>
    | DynamicForwardItemResponse<DynamicTypes.DYNAMIC_TYPE_AV>
    | DynamicForwardItemResponse<DynamicTypes.DYNAMIC_TYPE_WORD>
    | DynamicForwardItemResponse<DynamicTypes.DYNAMIC_TYPE_DRAW>
    | DynamicForwardItemResponse<DynamicTypes.DYNAMIC_TYPE_ARTICLE>
    | DynamicForwardItemResponse<DynamicTypes.DYNAMIC_TYPE_LIVE>
    | DynamicForwardItemResponse<DynamicTypes.DYNAMIC_TYPE_NONE>
    | DynamicForwardItemResponse<DynamicTypes.DYNAMIC_TYPE_UNKNOWN>
  )[]
}
