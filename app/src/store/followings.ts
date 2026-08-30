import { useSyncExternalStore } from "react";

import { bilibiliSession } from "../features/bilibili-session/session";
import type { UpInfo } from "../types";
import { getStoreMethods, useStore } from ".";

const EMPTY_UPS: UpInfo[] = [];

export function getActiveFollowedUps() {
  const control = bilibiliSession.getSnapshot();
  const methods = getStoreMethods();
  return control.phase === "ready" && methods.getFollowingsGeneration() === control.generation
    ? methods.get$followedUps()
    : EMPTY_UPS;
}

export function useActiveFollowedUps() {
  const control = useSyncExternalStore(bilibiliSession.subscribe, bilibiliSession.getSnapshot);
  const { $followedUps, followingsGeneration } = useStore();
  return control.phase === "ready" && followingsGeneration === control.generation
    ? $followedUps
    : EMPTY_UPS;
}
