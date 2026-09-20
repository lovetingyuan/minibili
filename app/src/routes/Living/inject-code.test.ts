import { runInNewContext } from "node:vm";
import { expect, test, vi } from "vitest";

vi.stubGlobal("__DEV__", false);
const { INJECTED_JAVASCRIPT, INJECTED_JAVASCRIPT_BEFORE } = await import("./inject-code");

type VisibilityListener = (event: { stopImmediatePropagation: () => void }) => void;
type ErrorListener = (event: { target: unknown }) => void;
type BackgroundPlaybackController = {
  isEnabled: () => boolean;
  setEnabled: (enabled: boolean) => boolean;
  toggle: () => boolean;
};

type FakeNode = {
  dataset: Record<string, string>;
  getAttribute: (name: string) => string | null;
  nodeType: number;
  querySelectorAll: (selector: string) => FakeNode[];
  setAttribute: (name: string, value: string) => void;
  tagName: string;
};

type MutationRecordLike = {
  addedNodes?: FakeNode[];
  target?: FakeNode;
  type?: string;
};

type FakeElement = {
  addEventListener: ReturnType<typeof vi.fn>;
  appendChild: (child: FakeElement) => void;
  children: FakeElement[];
  dataset: Record<string, string>;
  id: string;
  innerHTML: string;
  style: { cssText: string };
  textContent: string;
};

function createFakeNode(tagName: string, attributes: Record<string, string> = {}): FakeNode {
  const store = new Map(Object.entries(attributes));
  return {
    dataset: {},
    getAttribute: (name) => store.get(name) ?? null,
    nodeType: 1,
    querySelectorAll: () => [],
    setAttribute: (name, value) => {
      store.set(name, value);
    },
    tagName,
  };
}

function createFakeElement(): FakeElement {
  const element: FakeElement = {
    addEventListener: vi.fn(),
    appendChild: (child) => {
      element.children.push(child);
    },
    children: [],
    dataset: {},
    id: "",
    innerHTML: "",
    style: { cssText: "" },
    textContent: "",
  };
  return element;
}

function findFakeElementById(root: FakeElement, id: string): FakeElement | undefined {
  if (root.id === id) {
    return root;
  }
  for (const child of root.children) {
    const found = findFakeElementById(child, id);
    if (found) {
      return found;
    }
  }
  return undefined;
}

function flushAsyncWork() {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

function setupInjectedHack(options?: { countText?: string; rankCode?: number; roomUid?: number }) {
  const countText = options?.countText ?? "131";
  const rankCode = options?.rankCode ?? 0;
  const roomUid = options?.roomUid ?? 21123591;
  const root = createFakeElement();
  const roomInfo = createFakeElement();
  root.appendChild(roomInfo);
  const anchorPopUp = createFakeElement();
  root.appendChild(anchorPopUp);
  const document = {
    createElement: vi.fn(() => createFakeElement()),
    getElementById: vi.fn((id: string) => findFakeElementById(root, id) ?? null),
    head: createFakeElement(),
    querySelector: vi.fn((selector: string) => {
      if (selector === ".room-info") {
        return roomInfo;
      }
      if (selector === ".anchor_popUp") {
        return anchorPopUp;
      }
      return null;
    }),
  };
  const fetchMock = vi.fn(async (url: string) => ({
    json: async () =>
      url.includes("getH5InfoByRoom")
        ? {
            code: 0,
            data: { room_info: { live_start_time: 1789832145, uid: roomUid } },
          }
        : {
            code: rankCode,
            data: {
              count: Number(countText),
              count_text: countText,
              item: [
                { face: "//i0.hdslb.com/bfs/face/1.jpg", name: "EugeniaW", rank: 1, score: 1240 },
                { face: "//i0.hdslb.com/bfs/face/2.jpg", name: "粉白酱", rank: 2, score: 733 },
                { face: "//i0.hdslb.com/bfs/face/3.jpg", name: "Wing_小伞", rank: 3, score: 303 },
              ],
            },
          },
    ok: true,
  }));
  const window = {
    location: { pathname: "/1100739" },
    ReactNativeWebView: { postMessage: vi.fn() },
  };
  const intervalCallbacks: Array<() => void> = [];
  const intervalDelays: number[] = [];
  const setIntervalMock = vi.fn((callback: () => void, delay?: number) => {
    intervalCallbacks.push(callback);
    intervalDelays.push(delay ?? 0);
    return intervalCallbacks.length;
  });
  const runPendingIntervals = () => {
    const pendingCallbacks = intervalCallbacks.splice(0, intervalCallbacks.length);
    for (const callback of pendingCallbacks) {
      callback();
    }
  };

  runInNewContext(INJECTED_JAVASCRIPT, {
    clearInterval: vi.fn(),
    document,
    fetch: fetchMock,
    setInterval: setIntervalMock,
    setTimeout: vi.fn((callback: () => void) => {
      callback();
      return 1;
    }),
    window,
  });

  return { anchorPopUp, fetchMock, intervalDelays, roomInfo, runPendingIntervals };
}

function setupInjectedController(options?: { workerAvailable?: boolean }) {
  let visibilityListener: VisibilityListener | undefined;
  let errorListener: ErrorListener | undefined;
  let mutationCallback: (() => void) | undefined;
  const mutationObservers: Array<(records: MutationRecordLike[]) => void> = [];
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
    addEventListener: vi.fn((event: string, listener: ErrorListener, capture?: boolean) => {
      if (event === "error" && capture) {
        errorListener = listener;
      }
    }),
    body: {},
    createElement: vi.fn(() => ({ textContent: "" })),
    documentElement: {},
    head: { appendChild: vi.fn() },
    hidden: false,
    querySelector: vi.fn((selector: string) => (selector === "video" ? video : null)),
    querySelectorAll: vi.fn(() => []),
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

    constructor(callback: (records: MutationRecordLike[]) => void) {
      mutationCallback = () => callback([]);
      mutationObservers.push(callback);
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
    errorListener: () => errorListener,
    intervalCallback: () => intervalCallback?.(),
    mutationCallback: () => mutationCallback?.(),
    mutationObservers,
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

test("upgrades insecure image urls to https before the request is sent", () => {
  const { mutationObservers } = setupInjectedController();
  const image = createFakeNode("IMG", {
    src: "http://i0.hdslb.com/bfs/live/emoji.png@120h.webp",
  });

  mutationObservers[0]?.([{ addedNodes: [image], type: "childList" }]);

  expect(image.getAttribute("src")).toBe("https://i0.hdslb.com/bfs/live/emoji.png@120h.webp");
});

test("upgrades insecure image urls inside an inserted subtree", () => {
  const { mutationObservers } = setupInjectedController();
  const image = createFakeNode("IMG", { src: "http://i0.hdslb.com/bfs/live/emoji.png" });
  const danmakuItem = createFakeNode("DIV");
  danmakuItem.querySelectorAll = () => [image];

  mutationObservers[0]?.([{ addedNodes: [danmakuItem], type: "childList" }]);

  expect(image.getAttribute("src")).toBe("https://i0.hdslb.com/bfs/live/emoji.png");
});

test("upgrades insecure image urls that are set after insertion", () => {
  const { mutationObservers } = setupInjectedController();
  const image = createFakeNode("IMG");
  image.setAttribute("src", "http://i0.hdslb.com/bfs/live/letter.png");

  mutationObservers[0]?.([{ target: image, type: "attributes" }]);

  expect(image.getAttribute("src")).toBe("https://i0.hdslb.com/bfs/live/letter.png");
});

test("upgrades insecure background images written into inline styles", () => {
  const { mutationObservers } = setupInjectedController();
  const node = createFakeNode("DIV", {
    style: "background-image: url('http://i0.hdslb.com/bfs/live/tail.png');",
  });

  mutationObservers[0]?.([{ addedNodes: [node], type: "childList" }]);

  expect(node.getAttribute("style")).toBe(
    "background-image: url('https://i0.hdslb.com/bfs/live/tail.png');",
  );
});

test("retries an image blocked as mixed content once over https", () => {
  const { errorListener } = setupInjectedController();
  const image = createFakeNode("IMG", { src: "http://i0.hdslb.com/bfs/live/blocked.png" });
  const listener = errorListener();

  listener?.({ target: image });
  expect(image.getAttribute("src")).toBe("https://i0.hdslb.com/bfs/live/blocked.png");
  expect(image.dataset.minibiliHttpsRetry).toBe("true");

  image.setAttribute("src", "http://i0.hdslb.com/bfs/live/blocked.png");
  listener?.({ target: image });
  expect(image.getAttribute("src")).toBe("http://i0.hdslb.com/bfs/live/blocked.png");
});

test("leaves https images untouched when they fail", () => {
  const { errorListener } = setupInjectedController();
  const image = createFakeNode("IMG", { src: "https://i0.hdslb.com/bfs/live/ok.png" });

  errorListener()?.({ target: image });

  expect(image.getAttribute("src")).toBe("https://i0.hdslb.com/bfs/live/ok.png");
  expect(image.dataset.minibiliHttpsRetry).toBeUndefined();
});

test("shows the room audience count right under the live start time", async () => {
  const { fetchMock, intervalDelays, roomInfo, runPendingIntervals } = setupInjectedHack();
  await flushAsyncWork();
  runPendingIntervals();
  await flushAsyncWork();

  const requestedUrls = fetchMock.mock.calls.map(([url]) => url);
  expect(requestedUrls.some((url) => url.includes("getH5InfoByRoom?room_id=1100739"))).toBe(true);
  expect(
    requestedUrls.some(
      (url) =>
        url.includes("rank/queryContributionRank") &&
        url.includes("room_id=1100739") &&
        url.includes("ruid=21123591") &&
        url.includes("type=online_rank"),
    ),
  ).toBe(true);
  expect(intervalDelays).toContain(60 * 1000);

  const liveMeta = roomInfo.children.find((child) => child.id === "live-meta");
  expect(liveMeta?.style.cssText).toContain("flex-direction: column");

  const [startTime, audienceCount] = liveMeta?.children ?? [];
  expect(startTime?.textContent).toMatch(/^\d{1,2}:\d{2}开始$/);
  expect(audienceCount?.id).toBe("live-audience-count");
  expect(audienceCount?.textContent).toBe("房间观众(131)");
});

test("leaves the room audience count empty when the rank request fails", async () => {
  const { roomInfo, runPendingIntervals } = setupInjectedHack({ rankCode: -352 });
  await flushAsyncWork();
  runPendingIntervals();
  await flushAsyncWork();

  const liveMeta = roomInfo.children.find((child) => child.id === "live-meta");
  const audienceCount = liveMeta?.children.find((child) => child.id === "live-audience-count");
  expect(audienceCount?.textContent).toBe("");
});

test("renders the room audience top 3 into the anchor popup", async () => {
  const { anchorPopUp, fetchMock, runPendingIntervals } = setupInjectedHack();
  await flushAsyncWork();
  runPendingIntervals();
  await flushAsyncWork();

  const requestedUrls = fetchMock.mock.calls.map(([url]) => url);
  expect(requestedUrls.some((url) => url.includes("page_size=3"))).toBe(true);

  const rankList = anchorPopUp.children.find((child) => child.id === "minibili-live-rank-list");
  expect(rankList?.innerHTML).toContain("榜1");
  expect(rankList?.innerHTML).toContain("EugeniaW: 1240");
  expect(rankList?.innerHTML).toContain("粉白酱: 733");
  expect(rankList?.innerHTML).toContain("Wing_小伞: 303");
});
