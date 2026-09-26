import React from "react";

import {
  clearPartPlayProgress,
  getPartPlayProgressKey,
  recordPartPlayProgress,
} from "@/store/part-play-progress";

const PART_PLAY_PROGRESS_INTERVAL_MS = 15000;

export type PartPlayProgressInput = {
  bvid: string;
  cid: number;
  currentTimeMs: number;
  durationMs: number;
  isPlaying: boolean;
};

type PartPlayProgressEntry = PartPlayProgressInput & {
  key: string;
  ended: boolean;
};

type PartPlayProgressWriter = {
  record: typeof recordPartPlayProgress;
  clear: typeof clearPartPlayProgress;
};

export function createPartPlayProgressRecorder(
  writer: PartPlayProgressWriter = {
    record: recordPartPlayProgress,
    clear: clearPartPlayProgress,
  },
) {
  const entries = new Map<string, PartPlayProgressEntry>();

  function update(input: PartPlayProgressInput) {
    const key = getPartPlayProgressKey(input.bvid, input.cid);
    if (!key) {
      return null;
    }
    const previous = entries.get(key);
    // 循环或手动重播回到开头后，这一轮重新开始记录。
    const restarted = Boolean(
      previous?.ended && input.isPlaying && input.currentTimeMs < previous.currentTimeMs,
    );
    entries.set(key, {
      ...input,
      key,
      ended: restarted ? false : (previous?.ended ?? false),
    });
    return key;
  }

  function flush(key: string | null) {
    if (!key) {
      return;
    }
    const entry = entries.get(key);
    if (!entry || entry.ended) {
      return;
    }
    writer.record(entry.bvid, entry.cid, entry.currentTimeMs, entry.durationMs);
  }

  function finish(bvid: string, cid: number) {
    const key = getPartPlayProgressKey(bvid, cid);
    if (!key) {
      return;
    }
    const entry = entries.get(key);
    if (entry) {
      entry.ended = true;
    }
    writer.clear(bvid, cid);
  }

  return { finish, flush, update };
}

/**
 * 本地分P 进度记录与 B站账号无关：播放中定时记录，暂停、切P、离页时立即落盘。
 */
export function usePartPlayProgressRecorder(input: PartPlayProgressInput) {
  const recorderRef = React.useRef<ReturnType<typeof createPartPlayProgressRecorder> | null>(null);
  recorderRef.current ??= createPartPlayProgressRecorder();
  const recorder = recorderRef.current;
  const key = recorder.update(input);
  const playingRef = React.useRef({ key, value: input.isPlaying });

  React.useEffect(() => {
    return () => {
      recorder.flush(key);
    };
  }, [key, recorder]);

  React.useEffect(() => {
    const previous = playingRef.current;
    if (previous.key === key && previous.value && !input.isPlaying) {
      recorder.flush(key);
    }
    playingRef.current = { key, value: input.isPlaying };
  }, [input.isPlaying, key, recorder]);

  React.useEffect(() => {
    if (!key || !input.isPlaying) {
      return;
    }
    const timer = setInterval(() => {
      recorder.flush(key);
    }, PART_PLAY_PROGRESS_INTERVAL_MS);
    return () => {
      clearInterval(timer);
    };
  }, [input.isPlaying, key, recorder]);

  return {
    reportEnded: recorder.finish,
  };
}
