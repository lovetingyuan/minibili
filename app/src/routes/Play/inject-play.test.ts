import { runInNewContext } from "node:vm";
import { expect, test, vi } from "vitest";
import { INJECTED_JAVASCRIPT } from "./inject-play";

test("player bridge retains state events and ended behavior without collecting history", () => {
  const listeners = new Map<string, () => void>();
  const postMessage = vi.fn<(message: string) => void>();
  const rateButton = { dataset: { rate: "2x" }, textContent: "2x" };
  const video = {
    tagName: "VIDEO",
    dataset: {},
    playbackRate: 2,
    addEventListener: (event: string, handler: () => void) => listeners.set(event, handler),
  };
  const document = {
    body: { querySelectorAll: () => [video] },
    head: { appendChild: vi.fn() },
    createElement: () => ({ textContent: "" }),
    querySelector: (selector: string) => (selector === "video" ? video : null),
    getElementById: (id: string) => (id === "play-rate-button" ? rateButton : null),
    addEventListener: vi.fn(),
    exitFullscreen: vi.fn(),
  };
  const window = { ReactNativeWebView: { postMessage }, addEventListener: vi.fn() };
  runInNewContext(INJECTED_JAVASCRIPT, {
    document,
    window,
    MutationObserver: class {
      observe() {}
    },
    setInterval: vi.fn(() => 1),
    clearInterval: vi.fn(),
    setTimeout: vi.fn(() => 1),
    clearTimeout: vi.fn(),
  });
  expect([...listeners.keys()]).toEqual(["play", "ended", "pause"]);
  listeners.get("play")?.();
  listeners.get("pause")?.();
  listeners.get("ended")?.();
  expect(postMessage.mock.calls.map(([message]) => JSON.parse(message))).toEqual([
    { action: "playState", payload: "play" },
    { action: "playState", payload: "pause" },
    { action: "playState", payload: "ended" },
  ]);
  expect(video.playbackRate).toBe(1);
  expect(rateButton.dataset.rate).toBe("1x");
  expect(document.exitFullscreen).toHaveBeenCalledOnce();
  expect(window).not.toHaveProperty("reportPlayTime");
});
