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

/**
 * 当前分 P 之后要自动播放的分 P：循环播放（重复当前分 P）或不自动连播时为 null
 */
function resolveAutoNextPage(input: {
  mode: PlaybackMode;
  currentPage: number;
  pageCount: number;
}) {
  const { mode, currentPage, pageCount } = input;
  if (mode.loop || !mode.autoNext || currentPage >= pageCount) {
    return null;
  }
  return currentPage + 1;
}

export function resolveNextPageOnEnded(input: {
  currentCid: number;
  currentPage: number;
  ended: PlayEndedEvent;
  mode: PlaybackMode;
  pageCount: number;
}) {
  if (input.ended.page !== input.currentPage || input.ended.cid !== input.currentCid) {
    return null;
  }
  return resolveAutoNextPage(input);
}

/**
 * 播放结束后是否还会继续播放：循环当前分 P，或者自动连播切到下一个分 P。
 * 两者都不成立时播放器停在结尾，需要重新展示封面。
 */
export function willContinueAfterEnded(input: {
  mode: PlaybackMode;
  currentPage: number;
  pageCount: number;
}) {
  return input.mode.loop || resolveAutoNextPage(input) !== null;
}
