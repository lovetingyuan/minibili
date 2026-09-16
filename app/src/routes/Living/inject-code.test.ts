import { runInNewContext } from "node:vm";
import { expect, test, vi } from "vitest";

vi.stubGlobal("__DEV__", false);
const { INJECTED_JAVASCRIPT, INJECTED_JAVASCRIPT_BEFORE } = await import("./inject-code");

type VisibilityListener = (event: { stopImmediatePropagation: () => void }) => void;
type BackgroundPlaybackController = {
  isEnabled: () => boolean;
  setEnabled: (enabled: boolean) => boolean;
  toggle: () => boolean;
};

function setupInjectedController(options?: { workerAvailable?: boolean }) {
  let visibilityListener: VisibilityListener | undefined;
  let mutationCallback: (() => void) | undefined;
  let intervalCallback: (() => void) | undefined;
  const workerInstances: WorkerMock[] = [];
  const videoListeners = new Map<string, () => void>();
  const video = {
    ended: false,
    muted: false,
    paused: false,
    addEventListener: vi.fn((event: string, listener: () => void) => {
      videoListeners.set(event, listener);
    }),
    removeEventListener: vi.fn((event: string) => {
      videoListeners.delete(event);
    }),
    play: vi.fn(() => {
      video.paused = false;
      return Promise.resolve();
    }),
  };
  const document = {
    body: {},
    documentElement: {},
    head: { appendChild: vi.fn() },
    hidden: false,
    createElement: vi.fn(() => ({ textContent: "" })),
    querySelector: vi.fn((selector: string) => (selector === "video" ? video : null)),
  };

  class WorkerMock {
    onmessage: (() => void) | null = null;
    messages: string[] = [];

    constructor() {
      workerInstances.push(this);
    }

    postMessage(message: string) {
      this.messages.push(message);
    }
  }

  class MutationObserverMock {
    disconnect = vi.fn();
    observe = vi.fn();

    constructor(callback: () => void) {
      mutationCallback = callback;
    }
  }

  const oscillator = {
    connect: vi.fn(),
    frequency: { value: 0 },
    start: vi.fn(),
    stop: vi.fn(),
  };
  const gain = {
    connect: vi.fn(),
    gain: { value: 0 },
  };
  const audioContext = {
    close: vi.fn(() => Promise.resolve()),
    createGain: vi.fn(() => gain),
    createOscillator: vi.fn(() => oscillator),
    destination: {},
    resume: vi.fn(() => Promise.resolve()),
    state: "running",
  };
  class AudioContextMock {
    constructor() {
      return audioContext;
    }
  }

  const window: {
    AudioContext: unknown;
    Blob: unknown;
    MutationObserver: unknown;
    Worker: unknown;
    URL: {
      createObjectURL: ReturnType<typeof vi.fn>;
      revokeObjectURL: ReturnType<typeof vi.fn>;
    };
    addEventListener: ReturnType<typeof vi.fn>;
    clearInterval: ReturnType<typeof vi.fn>;
    clearTimeout: ReturnType<typeof vi.fn>;
    navigator: { mediaSession: { playbackState: string } };
    setInterval: ReturnType<typeof vi.fn>;
    setTimeout: ReturnType<typeof vi.fn>;
    webkitAudioContext?: unknown;
    __minibiliLiveBackgroundPlayback?: BackgroundPlaybackController;
  } = {
    AudioContext: AudioContextMock,
    Blob: options?.workerAvailable === false ? undefined : class {},
    MutationObserver: MutationObserverMock,
    Worker: options?.workerAvailable === false ? undefined : WorkerMock,
    URL: {
      createObjectURL: vi.fn(() => "blob:minibili-live-background"),
      revokeObjectURL: vi.fn(),
    },
    addEventListener: vi.fn((event: string, listener: VisibilityListener, capture?: boolean) => {
      if (event === "visibilitychange" && capture) {
        visibilityListener = listener;
      }
    }),
    clearInterval: vi.fn(() => {
      intervalCallback = undefined;
    }),
    clearTimeout: vi.fn(),
    navigator: { mediaSession: { playbackState: "none" } },
    setInterval: vi.fn((callback: () => void) => {
      intervalCallback = callback;
      return 2;
    }),
    setTimeout: vi.fn((callback: () => void) => {
      callback();
      return 1;
    }),
  };

  runInNewContext(INJECTED_JAVASCRIPT_BEFORE, { document, window });

  return {
    controller: window.__minibiliLiveBackgroundPlayback!,
    audioContext,
    document,
    intervalCallback: () => intervalCallback?.(),
    mutationCallback: () => mutationCallback?.(),
    oscillator,
    video,
    visibilityListener,
    videoListeners,
    workerInstances,
    window,
  };
}

test("only intercepts visibility changes while web background playback is enabled", () => {
  const { controller, document, visibilityListener, workerInstances } = setupInjectedController();
  const disabledEvent = { stopImmediatePropagation: vi.fn() };

  visibilityListener?.(disabledEvent);
  expect(disabledEvent.stopImmediatePropagation).not.toHaveBeenCalled();

  controller.setEnabled(true);
  document.hidden = true;
  const enabledEvent = { stopImmediatePropagation: vi.fn() };
  visibilityListener?.(enabledEvent);

  expect(enabledEvent.stopImmediatePropagation).toHaveBeenCalledOnce();
  expect(workerInstances).toHaveLength(1);
  expect(workerInstances[0].messages).toEqual(["start"]);

  controller.setEnabled(false);
  expect(workerInstances[0].messages).toEqual(["start", "stop"]);
});

test("worker ticks resume a paused video without creating duplicate workers", () => {
  const { controller, document, video, visibilityListener, workerInstances } =
    setupInjectedController();
  document.hidden = true;

  controller.setEnabled(true);
  controller.setEnabled(false);
  controller.setEnabled(true);

  expect(workerInstances).toHaveLength(1);
  expect(workerInstances[0].messages).toEqual(["start", "stop", "start"]);

  video.paused = true;
  workerInstances[0].onmessage?.();
  expect(video.play).toHaveBeenCalledOnce();

  visibilityListener?.({ stopImmediatePropagation: vi.fn() });
  expect(video.play).toHaveBeenCalledOnce();
});

test("combines watchdog, media events, DOM observation, and Web Audio keep-alive", () => {
  const {
    audioContext,
    controller,
    document,
    intervalCallback,
    mutationCallback,
    oscillator,
    video,
    videoListeners,
    window,
  } = setupInjectedController();
  document.hidden = true;

  controller.setEnabled(true);
  expect(oscillator.start).toHaveBeenCalledOnce();
  expect(window.navigator.mediaSession.playbackState).toBe("playing");

  video.paused = true;
  videoListeners.get("pause")?.();
  video.paused = true;
  intervalCallback();
  video.paused = true;
  mutationCallback();
  expect(video.play).toHaveBeenCalledTimes(3);

  controller.setEnabled(false);
  expect(window.clearInterval).toHaveBeenCalledOnce();
  expect(oscillator.stop).toHaveBeenCalledOnce();
  expect(audioContext.close).toHaveBeenCalledOnce();
  expect(window.navigator.mediaSession.playbackState).toBe("none");
});

test("falls back safely when Worker APIs are unavailable", () => {
  const { controller, document, video, visibilityListener, workerInstances } =
    setupInjectedController({ workerAvailable: false });
  document.hidden = true;
  video.paused = true;

  expect(() => controller.setEnabled(true)).not.toThrow();
  expect(() => visibilityListener?.({ stopImmediatePropagation: vi.fn() })).not.toThrow();
  expect(workerInstances).toHaveLength(0);
  expect(video.play).toHaveBeenCalledOnce();
});

test("retries a rejected play while muted and restores the previous mute state", async () => {
  const { controller, video } = setupInjectedController();
  video.paused = true;
  video.play
    .mockImplementationOnce(() => Promise.reject(new Error("background playback rejected")))
    .mockImplementationOnce(() => {
      video.paused = false;
      return Promise.resolve();
    });

  controller.setEnabled(true);
  await Promise.resolve();
  await Promise.resolve();

  expect(video.play).toHaveBeenCalledTimes(2);
  expect(video.muted).toBe(false);
});

test("live background button no longer enters the native player path", () => {
  expect(INJECTED_JAVASCRIPT).toContain("__minibiliLiveBackgroundPlayback");
  expect(INJECTED_JAVASCRIPT).not.toContain("enable-background-play");
});
