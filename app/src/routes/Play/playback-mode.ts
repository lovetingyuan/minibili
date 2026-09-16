export type PlaybackMode = {
  autoNext: boolean;
  loop: boolean;
};

export type PlayEndedEvent = {
  cid: number;
  page: number;
};

export const DEFAULT_PLAYBACK_MODE: PlaybackMode = {
  autoNext: true,
  loop: false,
};

export function toggleLoopMode(mode: PlaybackMode): PlaybackMode {
  const loop = !mode.loop;
  return { loop, autoNext: loop ? false : mode.autoNext };
}

export function toggleAutoNextMode(mode: PlaybackMode): PlaybackMode {
  const autoNext = !mode.autoNext;
  return { autoNext, loop: autoNext ? false : mode.loop };
}

export function resolveNextPageOnEnded(input: {
  currentCid: number;
  currentPage: number;
  ended: PlayEndedEvent;
  mode: PlaybackMode;
  pageCount: number;
}) {
  if (
    !input.mode.autoNext ||
    input.mode.loop ||
    input.ended.page !== input.currentPage ||
    input.ended.cid !== input.currentCid ||
    input.currentPage >= input.pageCount
  ) {
    return null;
  }
  return input.currentPage + 1;
}
