import { afterEach, beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  states: [] as unknown[],
  refs: [] as { current: unknown }[],
  stateIndex: 0,
  refIndex: 0,
  effects: [] as (() => void | (() => void))[],
}));

// 与仓库已有 hook 测试一致，模拟 react；跨 render 保留 state/ref 以验证交互流程。
vi.mock("react", () => {
  const react = {
    useState<T>(initial: T) {
      const index = mocks.stateIndex++;
      if (!(index in mocks.states)) {
        mocks.states[index] = initial;
      }
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
    useRef<T>(initial: T) {
      const index = mocks.refIndex++;
      mocks.refs[index] ??= { current: initial };
      return mocks.refs[index];
    },
    useEffect(effect: () => void | (() => void)) {
      mocks.effects.push(effect);
    },
  };

  // hook 使用 `React.useState` 形式的命名空间导入
  return { ...react, default: react };
});

import { PLAYER_CONTROLS_AUTO_HIDE_MS } from "./player-helpers";
import { usePlayerControlsVisibility } from "./usePlayerControlsVisibility";

/**
 * 模拟一次 render，返回本次 render 的 hook 返回值
 */
function render(isPlaying: boolean) {
  mocks.stateIndex = 0;
  mocks.refIndex = 0;
  return usePlayerControlsVisibility(isPlaying);
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
  mocks.refs = [];
  mocks.effects = [];
});

afterEach(() => {
  vi.useRealTimers();
});

test("auto hides controls after the timeout while playing", () => {
  expect(render(true).controlsVisible).toBe(true);
  runLastEffect();

  vi.advanceTimersByTime(PLAYER_CONTROLS_AUTO_HIDE_MS - 1);
  expect(render(true).controlsVisible).toBe(true);

  vi.advanceTimersByTime(1);
  expect(render(true).controlsVisible).toBe(false);
});

test("restarts the auto hide timer when controls are used", () => {
  render(true);
  const cleanup = runLastEffect();

  vi.advanceTimersByTime(PLAYER_CONTROLS_AUTO_HIDE_MS - 500);
  // 依赖变化时 React 会先清理上一个计时器
  cleanup?.();
  render(true).keepControlsVisible();
  runLastEffect();

  vi.advanceTimersByTime(PLAYER_CONTROLS_AUTO_HIDE_MS - 1);
  expect(render(true).controlsVisible).toBe(true);

  vi.advanceTimersByTime(1);
  expect(render(true).controlsVisible).toBe(false);
});

test("shows controls again when playback is paused", () => {
  render(true);
  runLastEffect();
  vi.advanceTimersByTime(PLAYER_CONTROLS_AUTO_HIDE_MS);
  expect(render(true).controlsVisible).toBe(false);

  render(false);
  runLastEffect();
  expect(render(false).controlsVisible).toBe(true);
});

test("keeps controls hidden after resuming until playback starts", () => {
  const controls = render(false);
  expect(controls.controlsVisible).toBe(true);
  runLastEffect();

  controls.hideControls();
  expect(render(false).controlsVisible).toBe(false);
  // 暂停态重跑 effect 不会把控件强制显示回来
  runLastEffect();
  expect(render(false).controlsVisible).toBe(false);

  // 真正开始播放后仍然保持隐藏，并进入自动隐藏流程
  expect(render(true).controlsVisible).toBe(false);
  runLastEffect();
  vi.advanceTimersByTime(PLAYER_CONTROLS_AUTO_HIDE_MS);
  expect(render(true).controlsVisible).toBe(false);

  // 用户点击视频仍能唤出控件
  render(true).toggleControls();
  expect(render(true).controlsVisible).toBe(true);
});
