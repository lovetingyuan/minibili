import { afterEach, beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  states: [] as unknown[],
  stateIndex: 0,
  effects: [] as (() => void | (() => void))[],
}));

// 与仓库已有 hook 测试一致，模拟 react；跨 render 保留 state 以验证交互流程。
vi.mock("react", () => {
  const react = {
    useState<T>(initial: T) {
      const index = mocks.stateIndex++;
      if (!(index in mocks.states)) mocks.states[index] = initial;
      return [
        mocks.states[index] as T,
        (value: T | ((previous: T) => T)) => {
          mocks.states[index] =
            typeof value === "function"
              ? (value as (previous: T) => T)(mocks.states[index] as T)
              : value;
        },
      ];
    },
    useEffect(effect: () => void | (() => void)) {
      mocks.effects.push(effect);
    },
  };

  // hook 使用 `React.useState` 形式的命名空间导入
  return { ...react, default: react };
});

import { PLAYER_PAUSED_UI_DELAY_MS } from "./player-helpers";
import { usePlayerPausedUi } from "./usePlayerPausedUi";

/**
 * 模拟一次 render，返回本次 render 的 hook 返回值
 */
function render(isPlaying: boolean, loading: boolean) {
  mocks.stateIndex = 0;
  return usePlayerPausedUi(isPlaying, loading);
}

/**
 * 执行最近一次 render 的 effect（模拟 commit 后的 effect 阶段），返回清理函数
 */
function runLastEffect() {
  return mocks.effects[mocks.effects.length - 1]();
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  mocks.states = [];
  mocks.effects = [];
});

afterEach(() => {
  vi.useRealTimers();
});

test("keeps the playing ui while the video is only buffering", () => {
  expect(render(false, true)).toBe(false);
  runLastEffect();
  vi.advanceTimersByTime(PLAYER_PAUSED_UI_DELAY_MS);

  // 缓冲（loading）不算暂停，控制条不会切回播放图标
  expect(render(false, true)).toBe(false);
});

test("starts a fresh pause delay after buffering finishes", () => {
  expect(render(false, true)).toBe(false);
  runLastEffect();
  vi.advanceTimersByTime(PLAYER_PAUSED_UI_DELAY_MS * 2);

  expect(render(false, false)).toBe(false);
  runLastEffect();
  vi.advanceTimersByTime(PLAYER_PAUSED_UI_DELAY_MS - 1);
  expect(render(false, false)).toBe(false);

  vi.advanceTimersByTime(1);
  expect(render(false, false)).toBe(true);
});

test("does not flash paused ui when playingChange follows ready shortly afterwards", () => {
  render(false, true);
  const clearLoadingEffect = runLastEffect();
  clearLoadingEffect?.();

  expect(render(false, false)).toBe(false);
  const clearPauseTimer = runLastEffect();
  vi.advanceTimersByTime(PLAYER_PAUSED_UI_DELAY_MS - 1);
  expect(render(false, false)).toBe(false);

  clearPauseTimer?.();
  expect(render(true, false)).toBe(false);
  runLastEffect();
});

test("shows the paused ui only after the pause lasts long enough", () => {
  expect(render(false, false)).toBe(false);
  runLastEffect();

  vi.advanceTimersByTime(PLAYER_PAUSED_UI_DELAY_MS - 1);
  expect(render(false, false)).toBe(false);

  vi.advanceTimersByTime(1);
  expect(render(false, false)).toBe(true);
});

test("hides the paused ui right after the playback resumes", () => {
  render(false, false);
  runLastEffect();
  vi.advanceTimersByTime(PLAYER_PAUSED_UI_DELAY_MS);
  expect(render(false, false)).toBe(true);

  expect(render(true, false)).toBe(false);
  runLastEffect();
});

test("ignores the playback flicker while the video starts", () => {
  // 起播瞬间 playing 抖动：短暂 false 后又开始播放，不应展示暂停态
  render(false, true);
  const cleanup = runLastEffect();
  vi.advanceTimersByTime(PLAYER_PAUSED_UI_DELAY_MS - 50);
  cleanup?.();

  expect(render(true, false)).toBe(false);
  runLastEffect();
  expect(render(true, false)).toBe(false);
});
