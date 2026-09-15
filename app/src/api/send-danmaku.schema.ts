import { z } from "zod";

export const DanmakuSendResponseSchema = z.object({
  code: z.number().int(),
  message: z.string().optional(),
  data: z
    .object({
      /**
       * 弹幕 id 是 64 位整数，接口以字符串返回（兼容个别返回数字的情况）
       */
      dmid_str: z.union([z.string(), z.number()]).optional(),
    })
    .nullish(),
});
