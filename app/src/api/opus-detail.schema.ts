import { z } from "zod";

const StringOrNumberSchema = z.union([z.string(), z.number()]);

const TextStyleSchema = z
  .looseObject({
    bold: z.boolean().optional(),
    italic: z.boolean().optional(),
    strikethrough: z.boolean().optional(),
    underline: z.boolean().optional(),
  })
  .nullish();

const WordSchema = z
  .looseObject({
    words: z.string().default(""),
    style: TextStyleSchema,
  })
  .nullish();

const RichSchema = z
  .looseObject({
    type: z.string().optional(),
    text: z.string().default(""),
    orig_text: z.string().optional(),
    jump_url: z.string().optional(),
    rid: StringOrNumberSchema.optional(),
    emoji: z
      .looseObject({
        icon_url: z.string().optional(),
        text: z.string().optional(),
      })
      .nullish(),
  })
  .nullish();

const FormulaSchema = z.looseObject({ latex_content: z.string().optional() }).nullish();

const UserSchema = z
  .looseObject({
    mid: StringOrNumberSchema.optional(),
    name: z.string().optional(),
    face: z.string().optional(),
  })
  .nullish();

const TextNodeSchema = z.looseObject({
  type: z.string().optional(),
  word: WordSchema,
  rich: RichSchema,
  formula: FormulaSchema,
  user: UserSchema,
});

const ImageSchema = z.looseObject({
  url: z.string().optional(),
  src: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

const TextBlockSchema = z.looseObject({
  nodes: z.array(TextNodeSchema).default([]),
});

/** 引用、列表的嵌套段落只取文本节点，用于兜底渲染。 */
const NestedTextParagraphSchema = z.looseObject({
  text: TextBlockSchema.nullish(),
});

/**
 * 段落按 para_type 区分：1 文本、2 图片、3 分割线、4 引用、5 列表、6 链接卡片、7 代码、8 标题。
 * 只用得到的字段做校验，其余一律 passthrough，接口新增类型时不会解析失败。
 */
const ParagraphSchema = z.looseObject({
  para_type: z.number(),
  text: TextBlockSchema.nullish(),
  pic: z
    .looseObject({
      pics: z.array(ImageSchema).default([]),
      style: z.number().optional(),
    })
    .nullish(),
  heading: z
    .looseObject({
      level: z.number().optional(),
      nodes: z.array(TextNodeSchema).default([]),
    })
    .nullish(),
  blockquote: z
    .looseObject({
      children: z.array(NestedTextParagraphSchema).optional(),
    })
    .nullish(),
  list: z
    .looseObject({
      items: z.array(z.looseObject({ nodes: z.array(TextNodeSchema).default([]) })).optional(),
      children: z
        .array(
          z.looseObject({
            children: z.array(NestedTextParagraphSchema).optional(),
          }),
        )
        .optional(),
    })
    .nullish(),
  code: z
    .looseObject({
      text: z.string().optional(),
      content: z.string().optional(),
    })
    .nullish(),
});

const ModuleSchema = z.looseObject({
  module_type: z.string(),
  module_title: z.looseObject({ text: z.string().optional() }).nullish(),
  module_content: z
    .looseObject({
      paragraphs: z.array(ParagraphSchema).default([]),
    })
    .nullish(),
});

const OpusItemSchema = z.looseObject({
  id_str: StringOrNumberSchema,
  modules: z.array(ModuleSchema).default([]),
});

export const OpusDetailResponseSchema = z.looseObject({
  item: OpusItemSchema.nullish(),
});

export type OpusDetailResponse = z.infer<typeof OpusDetailResponseSchema>;
export type OpusParagraph = z.infer<typeof ParagraphSchema>;
export type OpusTextNode = z.infer<typeof TextNodeSchema>;
