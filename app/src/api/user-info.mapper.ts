import type { z } from "zod";

import type { UserCardInfoResponseSchema } from "./user-info.schema";
import type { UserInfo } from "./user-info.types";

type UserCardInfoResponse = z.infer<typeof UserCardInfoResponseSchema>;

export function mapUserCardInfo(userInfo: UserCardInfoResponse): UserInfo {
  return {
    face: userInfo.card.face,
    name: userInfo.card.name,
    sign: userInfo.card.sign,
    mid: userInfo.card.mid.toString(),
    level: userInfo.card.level_info.current_level,
    sex: userInfo.card.sex,
    officialDescription: userInfo.card.official_verify?.desc ?? "",
  };
}
