import { useSyncExternalStore } from "react";
import { useSWRConfig } from "swr";
import useSWRMutation from "swr/mutation";

import { favoriteMutationKey } from "../features/bilibili-favorites/mutations";
import { videoRelationMutations as mutations } from "../features/bilibili-favorites/video-relation-mutations";
import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import { bilibiliSession } from "../features/bilibili-session/session";
import type { FavoriteAccount } from "./favorites.types";
import fetcher from "./fetcher";
import { getBilibiliLoginCookie } from "./get-cookie";
import { useVideoRelation } from "./useVideoFavorites";
import {
  FavoriteLoginRequiredError,
  fetchVideoRelation,
  getVideoRelationKey,
} from "./video-favorites";
import type { FavoriteVideo, VideoRelation, VideoRelationKey } from "./video-favorites.types";
import {
  modifyVideoLike,
  VideoLikeLoginRequiredError,
  VideoLikeResultUnknownError,
} from "./video-like";
import type { VideoInfoResponse, VideoLikeChange } from "./video-like.types";

export function useVideoLike(account: FavoriteAccount | null, video: FavoriteVideo | null) {
  const relation = useVideoRelation(account, video);
  const { mutate } = useSWRConfig();
  const pending = useSyncExternalStore(mutations.subscribe, mutations.getSnapshot);
  const key = account && video ? getVideoRelationKey(account, video) : null;
  const { trigger } = useSWRMutation<
    VideoLikeChange,
    Error,
    VideoRelationKey | null,
    VideoLikeChange,
    VideoRelation | undefined
  >(
    key,
    (_key, { arg }) => {
      if (!account) throw new VideoLikeLoginRequiredError("请先登录 B站");
      return modifyVideoLike(account, arg, {
        readCookie: getBilibiliLoginCookie,
        isCurrentAccount: bilibiliSession.isCurrentAccount,
      });
    },
    {
      revalidate: false,
      populateCache: (change, current) => {
        const previous = current ?? relation.data;
        return previous ? { ...previous, like: change.liked } : undefined;
      },
    },
  );

  async function toggle(): Promise<boolean | null> {
    if (!account || !video || !key) throw new VideoLikeLoginRequiredError("请先登录 B站");
    const currentAccount = account;
    const currentVideo = video;
    const relationKey = key;
    const viewKey = `/x/web-interface/view?bvid=${video.bvid}`;
    function refreshRelation() {
      // 显式查询才能传播 GET 错误，不能把 SWR 的旧数据当成最新状态。
      return mutate<VideoRelation>(
        relationKey,
        () =>
          fetchVideoRelation(currentVideo, fetcher, () =>
            bilibiliSession.isCurrentAccount(currentAccount),
          ),
        {
          revalidate: false,
          throwOnError: true,
          rollbackOnError: false,
        },
      );
    }
    return mutations.run(account, video.aid, async () => {
      if (typeof relation.data?.like !== "boolean" || relation.error) {
        const latest = await refreshRelation();
        if (typeof latest?.like !== "boolean") throw new Error("无法获取点赞状态，请稍后重试");
        return null;
      }
      const liked = !relation.data.like;
      try {
        await trigger({ video: currentVideo, liked });
      } catch (error) {
        if (
          error instanceof VideoLikeResultUnknownError &&
          bilibiliSession.isCurrentAccount(currentAccount)
        ) {
          await mutate<VideoRelation>(
            relationKey,
            (current) => (current ? { ...current, like: undefined } : current),
            { revalidate: false },
          );
          try {
            await refreshRelation();
          } catch (refreshError) {
            if (
              refreshError instanceof FavoriteLoginRequiredError ||
              refreshError instanceof BilibiliSessionChangedError
            )
              throw refreshError;
          }
        }
        throw error;
      }
      // POST 已成功；数量和后台校验失败不应提示为点赞失败。
      await Promise.allSettled([
        mutate<VideoInfoResponse>(
          viewKey,
          (current) =>
            current
              ? {
                  ...current,
                  stat: {
                    ...current.stat,
                    like: Math.max(0, current.stat.like + (liked ? 1 : -1)),
                  },
                }
              : current,
          { revalidate: false },
        ),
      ]);
      if (bilibiliSession.isCurrentAccount(currentAccount)) {
        void Promise.allSettled([mutate(relationKey), mutate(viewKey)]);
      }
      return liked;
    });
  }

  return {
    toggle,
    liked: relation.data?.like === true,
    isLoading: relation.isLoading,
    isMutating: Boolean(account && video && pending.has(favoriteMutationKey(account, video.aid))),
  };
}
