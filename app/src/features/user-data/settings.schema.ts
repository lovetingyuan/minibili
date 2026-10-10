import { z } from "zod";
import { RanksConfig } from "../../constants";

function normalizeVideoCategories(items: { rid: number }[]) {
  const seen = new Set([RanksConfig[0].rid]);
  const result = [{ ...RanksConfig[0] }];
  for (const item of [...items, ...RanksConfig]) {
    const category = RanksConfig.find((entry) => entry.rid === item.rid);
    if (category && !seen.has(category.rid)) {
      seen.add(category.rid);
      result.push({ ...category });
    }
  }
  return result;
}

// 本地设置负责默认值和分区补齐；同步字段还需在共享协议和 D1 表中注册。
export const UserSettingsSchema = z.object({
  $blackTags: z
    .record(z.string(), z.string())
    .catch({})
    .transform((tags) =>
      Object.fromEntries(
        Object.values(tags)
          .filter(Boolean)
          .map((tag) => [tag, tag]),
      ),
    ),
  $videoCatesList: z
    .array(z.object({ rid: z.number().int() }))
    .catch([])
    .transform(normalizeVideoCategories),
});

export const LocalUserDataSchema = z.object({
  values: UserSettingsSchema,
  pendingKeys: z.array(z.string()).default([]),
});
