import type { CollectVideoInfo, UpInfo } from "@/types";

import { useStore } from ".";
import { useActiveFollowedUps } from "./followings";
import type { MusicSong, UpdateUpInfo } from "./types";

export const useFollowedUpsMap = () => {
  const $followedUps = useActiveFollowedUps();
  const ups: Record<string, UpInfo> = {};
  for (const up of $followedUps) {
    ups[up.mid] = up;
  }
  return ups;
};

export const useUpUpdateCount = () => {
  const { $upUpdateMap } = useStore();
  const ups = useActiveFollowedUps();
  const aa = ups
    .map((up) => $upUpdateMap[up.mid])
    .filter((info): info is UpdateUpInfo => Boolean(info));
  return aa.filter((item) => {
    return item.latestId !== item.currentLatestId;
  }).length;
};

export const useCollectedVideosMap = () => {
  const { $collectedVideos } = useStore();
  const map: Record<string, CollectVideoInfo> = {};
  $collectedVideos.forEach((vi) => {
    map[vi.bvid] = vi;
  });
  return map;
};

export const useMusicSongsMap = () => {
  const { $musicList } = useStore();
  const map: Record<string, MusicSong> = {};
  $musicList.forEach((music) => {
    music.songs.forEach((song) => {
      map[`${song.bvid}_${song.cid}`] = song;
    });
  });
  return map;
};
