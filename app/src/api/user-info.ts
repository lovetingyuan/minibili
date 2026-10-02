import useSWRImmutable from "swr/immutable";

import { useStore } from "../store";
import fetcher from "./fetcher";
import { mapUserCardInfo } from "./user-info.mapper";
import { UserCardInfoResponseSchema } from "./user-info.schema";
import type { UserInfo } from "./user-info.types";

export function useUserInfo(mid?: number | string) {
  const { get$followedUps, set$followedUps } = useStore();
  const { data } = useSWRImmutable<UserInfo | undefined>(
    mid ? `/x/web-interface/card?mid=${mid}` : null,
    async (url) => {
      const response = await fetcher<unknown>(url);
      return mapUserCardInfo(UserCardInfoResponseSchema.parse(response));
    },
    {
      onSuccess(_data) {
        if (!_data) {
          return;
        }
        const followedUps = get$followedUps();
        const index = followedUps.findIndex((u) => u.mid.toString() === _data.mid.toString());
        if (index === -1) {
          return;
        }
        // 用户信息可能会变化
        const followedUp = followedUps[index];
        if (
          followedUp.name !== _data.name ||
          followedUp.sign !== _data.sign ||
          followedUp.face !== _data.face
        ) {
          followedUps[index] = {
            ...followedUp,
            name: _data.name,
            sign: _data.sign,
            face: _data.face,
          };
          set$followedUps(followedUps.slice());
        }
      },
    },
  );

  return {
    data,
  };
}
