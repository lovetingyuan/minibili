import { z } from "zod";

import { DynamicListResponseSchema } from "./dynamic-items.schema";

const CountSchema = z
  .union([z.string(), z.number()])
  .transform((value) => Number(value))
  .pipe(z.number().int().nonnegative());

export const SpaceDynamicSearchPageSchema = DynamicListResponseSchema.extend({
  total: CountSchema.default(0),
}).passthrough();
