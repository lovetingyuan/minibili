import { useEffect, useState } from "react";
import useSWRMutation from "swr/mutation";

import { bilibiliSession } from "../features/bilibili-session/session";
import { DynamicLikeLoginRequiredError, modifyDynamicLike } from "./dynamic-like";
import type { DynamicLikeChange } from "./dynamic-like.types";
import type { FavoriteAccount } from "./favorites.types";
import { getBilibiliLoginCookie } from "./get-cookie";

export type DynamicLikeKey = readonly [string, string, number, string] | null;

function getDynamicLikeKey(account: FavoriteAccount | null, dynamicId: string): DynamicLikeKey {
  if (!account || !dynamicId) {
    return null;
  }
  return ["bilibili-dynamic-like", account.mid, account.generation, dynamicId];
}

export function useDynamicLike(
  account: FavoriteAccount | null,
  dynamicId: string,
  initialLiked = false,
) {
  const [liked, setLiked] = useState(initialLiked);
  const key = getDynamicLikeKey(account, dynamicId);
  const { trigger, isMutating } = useSWRMutation<
    DynamicLikeChange,
    Error,
    DynamicLikeKey,
    DynamicLikeChange
  >(
    key,
    (_key, { arg }) => {
      if (!account) {
        throw new DynamicLikeLoginRequiredError("请先登录 B站");
      }
      return modifyDynamicLike(account, arg, {
        readCookie: getBilibiliLoginCookie,
        isCurrentAccount: bilibiliSession.isCurrentAccount,
      });
    },
    { revalidate: false },
  );

  useEffect(() => {
    setLiked(initialLiked);
  }, [initialLiked]);

  async function toggle() {
    if (!account || !dynamicId) {
      throw new DynamicLikeLoginRequiredError("请先登录 B站");
    }
    const nextLiked = !liked;
    await trigger({ dynamicId, liked: nextLiked });
    setLiked(nextLiked);
    return nextLiked;
  }

  return { liked, isMutating, toggle };
}
