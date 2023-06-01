export enum HandledDynamicTypeEnum {
  DYNAMIC_TYPE_AV = 'DYNAMIC_TYPE_AV',
  DYNAMIC_TYPE_DRAW = 'DYNAMIC_TYPE_DRAW',
  DYNAMIC_TYPE_WORD = 'DYNAMIC_TYPE_WORD',
  DYNAMIC_TYPE_ARTICLE = 'DYNAMIC_TYPE_ARTICLE',
  DYNAMIC_TYPE_FORWARD = 'DYNAMIC_TYPE_FORWARD',
  DYNAMIC_TYPE_MUSIC = 'DYNAMIC_TYPE_MUSIC',
  DYNAMIC_TYPE_PGC = 'DYNAMIC_TYPE_PGC',
  DYNAMIC_TYPE_LIVE_RCMD = 'DYNAMIC_TYPE_LIVE_RCMD',
  DYNAMIC_TYPE_COMMON_SQUARE = 'DYNAMIC_TYPE_COMMON_SQUARE',
}

export enum OtherDynamicTypeEnum {
  DYNAMIC_TYPE_OTHER = 'DYNAMIC_TYPE_OTHER',
  DYNAMIC_TYPE_NONE = 'DYNAMIC_TYPE_NONE',
  DYNAMIC_TYPE_COURSES = 'DYNAMIC_TYPE_COURSES',
  DYNAMIC_TYPE_COMMON_VERTICAL = 'DYNAMIC_TYPE_COMMON_VERTICAL',
  DYNAMIC_TYPE_LIVE = 'DYNAMIC_TYPE_LIVE',
  DYNAMIC_TYPE_MEDIALIST = 'DYNAMIC_TYPE_MEDIALIST',
  DYNAMIC_TYPE_COURSES_SEASON = 'DYNAMIC_TYPE_COURSES_SEASON',
  DYNAMIC_TYPE_COURSES_BATCH = 'DYNAMIC_TYPE_COURSES_BATCH',
  DYNAMIC_TYPE_AD = 'DYNAMIC_TYPE_AD',
  DYNAMIC_TYPE_APPLET = 'DYNAMIC_TYPE_APPLET',
  DYNAMIC_TYPE_SUBSCRIPTION = 'DYNAMIC_TYPE_SUBSCRIPTION',
  DYNAMIC_TYPE_BANNER = 'DYNAMIC_TYPE_BANNER',
  DYNAMIC_TYPE_UGC_SEASON = 'DYNAMIC_TYPE_UGC_SEASON',
  DYNAMIC_TYPE_SUBSCRIPTION_NEW = 'DYNAMIC_TYPE_SUBSCRIPTION_NEW',
}

export const DynamicTypes = {
  ...HandledDynamicTypeEnum,
  ...OtherDynamicTypeEnum,
} as const

// export type DynamicTypeEnum = typeof DynamicTypes

export enum HandledAdditionalTypeEnum {
  ADDITIONAL_TYPE_RESERVE = 'ADDITIONAL_TYPE_RESERVE',
  ADDITIONAL_TYPE_UGC = 'ADDITIONAL_TYPE_UGC',
  ADDITIONAL_TYPE_COMMON = 'ADDITIONAL_TYPE_COMMON',
  ADDITIONAL_TYPE_GOODS = 'ADDITIONAL_TYPE_GOODS',
  ADDITIONAL_TYPE_VOTE = 'ADDITIONAL_TYPE_VOTE',
  ADDITIONAL_TYPE_MATCH = 'ADDITIONAL_TYPE_MATCH',
  ADDITIONAL_TYPE_UPOWER_LOTTERY = 'ADDITIONAL_TYPE_UPOWER_LOTTERY',
}

export enum OtherAdditionalTypeEnum {
  ADDITIONAL_TYPE_NONE = 'ADDITIONAL_TYPE_NONE',
  ADDITIONAL_TYPE_UP_RCMD = 'ADDITIONAL_TYPE_UP_RCMD',
  ADDITIONAL_TYPE_PGC = 'ADDITIONAL_TYPE_PGC',
}

export const AdditionalTypeEnum = {
  ...HandledAdditionalTypeEnum,
  ...OtherAdditionalTypeEnum,
}

export enum MajorTypeEnum {
  MAJOR_TYPE_ARCHIVE = 'MAJOR_TYPE_ARCHIVE',
  MAJOR_TYPE_DRAW = 'MAJOR_TYPE_DRAW',
  MAJOR_TYPE_ARTICLE = 'MAJOR_TYPE_ARTICLE',
  MAJOR_TYPE_LIVE = 'MAJOR_TYPE_LIVE',
  MAJOR_TYPE_WORD = 'MAJOR_TYPE_WORD',
  MAJOR_TYPE_NONE = 'MAJOR_TYPE_NONE',
  MAJOR_TYPE_MUSIC = 'MAJOR_TYPE_MUSIC',
  // -----------------------------------------
  MAJOR_TYPE_PGC = 'MAJOR_TYPE_PGC',
  MAJOR_TYPE_COURSES = 'MAJOR_TYPE_COURSES',
  MAJOR_TYPE_COMMON = 'MAJOR_TYPE_COMMON',
  MAJOR_TYPE_MEDIALIST = 'MAJOR_TYPE_MEDIALIST',
  MAJOR_TYPE_APPLET = 'MAJOR_TYPE_APPLET',
  MAJOR_TYPE_SUBSCRIPTION = 'MAJOR_TYPE_SUBSCRIPTION',
  MAJOR_TYPE_LIVE_RCMD = 'MAJOR_TYPE_LIVE_RCMD',
  MAJOR_TYPE_SUBSCRIPTION_NEW = 'MAJOR_TYPE_SUBSCRIPTION_NEW',
  MAJOR_TYPE_OPUS = 'MAJOR_TYPE_OPUS',
  MAJOR_TYPE_UGC_SEASON = 'MAJOR_TYPE_UGC_SEASON',
  MAJOR_TYPE_BLOCKED = 'MAJOR_TYPE_BLOCKED',
  MAJOR_TYPE_COUR_BATCH = 'MAJOR_TYPE_COUR_BATCH',
}

export enum HandledForwardTypeEnum {
  DYNAMIC_TYPE_AV = 'DYNAMIC_TYPE_AV',
  DYNAMIC_TYPE_DRAW = 'DYNAMIC_TYPE_DRAW',
  DYNAMIC_TYPE_WORD = 'DYNAMIC_TYPE_WORD',
  DYNAMIC_TYPE_ARTICLE = 'DYNAMIC_TYPE_ARTICLE',
  DYNAMIC_TYPE_LIVE = 'DYNAMIC_TYPE_LIVE',
  DYNAMIC_TYPE_NONE = 'DYNAMIC_TYPE_NONE',
  DYNAMIC_TYPE_MUSIC = 'DYNAMIC_TYPE_MUSIC',
  DYNAMIC_TYPE_PGC = 'DYNAMIC_TYPE_PGC',
  DYNAMIC_TYPE_COMMON_SQUARE = 'DYNAMIC_TYPE_COMMON_SQUARE',
  DYNAMIC_TYPE_MEDIALIST = 'DYNAMIC_TYPE_MEDIALIST',
  DYNAMIC_TYPE_COURSES_SEASON = 'DYNAMIC_TYPE_COURSES_SEASON',
  DYNAMIC_TYPE_LIVE_RCMD = 'DYNAMIC_TYPE_LIVE_RCMD',
}

export enum OtherForwardTypeEnum {
  DYNAMIC_TYPE_OTHER = 'DYNAMIC_TYPE_OTHER',
  DYNAMIC_TYPE_COURSES = 'DYNAMIC_TYPE_COURSES',
  DYNAMIC_TYPE_COMMON_VERTICAL = 'DYNAMIC_TYPE_COMMON_VERTICAL',
  DYNAMIC_TYPE_COURSES_BATCH = 'DYNAMIC_TYPE_COURSES_BATCH',
  DYNAMIC_TYPE_AD = 'DYNAMIC_TYPE_AD',
  DYNAMIC_TYPE_APPLET = 'DYNAMIC_TYPE_APPLET',
  DYNAMIC_TYPE_SUBSCRIPTION = 'DYNAMIC_TYPE_SUBSCRIPTION',
  DYNAMIC_TYPE_BANNER = 'DYNAMIC_TYPE_BANNER',
  DYNAMIC_TYPE_UGC_SEASON = 'DYNAMIC_TYPE_UGC_SEASON',
  DYNAMIC_TYPE_SUBSCRIPTION_NEW = 'DYNAMIC_TYPE_SUBSCRIPTION_NEW',
}

export enum HandledRichTextType {
  RICH_TEXT_NODE_TYPE_TEXT = 'RICH_TEXT_NODE_TYPE_TEXT',
  RICH_TEXT_NODE_TYPE_AT = 'RICH_TEXT_NODE_TYPE_AT',
  RICH_TEXT_NODE_TYPE_WEB = 'RICH_TEXT_NODE_TYPE_WEB',
  RICH_TEXT_NODE_TYPE_EMOJI = 'RICH_TEXT_NODE_TYPE_EMOJI',
  RICH_TEXT_NODE_TYPE_TOPIC = 'RICH_TEXT_NODE_TYPE_TOPIC',
  RICH_TEXT_NODE_TYPE_BV = 'RICH_TEXT_NODE_TYPE_BV',
  RICH_TEXT_NODE_TYPE_GOODS = 'RICH_TEXT_NODE_TYPE_GOODS',
  RICH_TEXT_NODE_TYPE_MAIL = 'RICH_TEXT_NODE_TYPE_MAIL',
  RICH_TEXT_NODE_TYPE_VOTE = 'RICH_TEXT_NODE_TYPE_VOTE',
  RICH_TEXT_NODE_TYPE_LOTTERY = 'RICH_TEXT_NODE_TYPE_LOTTERY',
  RICH_TEXT_NODE_TYPE_OGV_SEASON = 'RICH_TEXT_NODE_TYPE_OGV_SEASON',
  RICH_TEXT_NODE_TYPE_AV = 'RICH_TEXT_NODE_TYPE_AV',
  RICH_TEXT_NODE_TYPE_OGV_EP = 'RICH_TEXT_NODE_TYPE_OGV_EP',
  RICH_TEXT_NODE_TYPE_CV = 'RICH_TEXT_NODE_TYPE_CV',
}

export enum OtherRichTextType {
  RICH_TEXT_NODE_TYPE_NONE = 'RICH_TEXT_NODE_TYPE_NONE',
  RICH_TEXT_NODE_TYPE_USER = 'RICH_TEXT_NODE_TYPE_USER',
  RICH_TEXT_NODE_TYPE_VC = 'RICH_TEXT_NODE_TYPE_VC',
  RICH_TEXT_NODE_TYPE_TAOBAO = 'RICH_TEXT_NODE_TYPE_TAOBAO',
  RICH_TEXT_NODE_TYPE_SEARCH_WORD = 'RICH_TEXT_NODE_TYPE_SEARCH_WORD',
}
