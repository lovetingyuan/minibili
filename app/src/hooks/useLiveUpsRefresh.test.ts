import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cleanups: [] as (() => void)[],
  mutate: vi.fn(async () => undefined),
}));

vi.mock("react", async (importOriginal) => {
  const original = await importOriginal<typeof import("react")>();
  return {
    ...original,
    default: {
      ...original,
      useEffect: (effect: () => void | (() => void)) => {
        const cleanup = effect();
        if (typeof cleanup === "function") {
          mocks.cleanups.push(cleanup);
        }
      },
    },
  };
});
vi.mock("@/api/live-ups", () => ({ useLiveUps: () => ({ mutate: mocks.mutate }) }));

import { useLiveUpsRefresh } from "./useLiveUpsRefresh";

/** 模拟直播页被销毁（返回上一页）*/
function leaveLiveRoom() {
  const cleanups = [...mocks.cleanups];
  mocks.cleanups = [];
  for (const cleanup of cleanups) {
    cleanup();
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.cleanups = [];
});

describe("live ups refresh on leaving the live room", () => {
  test("re-fetches the live list after returning from the live room", () => {
    useLiveUpsRefresh();
    expect(mocks.mutate).not.toHaveBeenCalled();

    leaveLiveRoom();

    expect(mocks.mutate).toHaveBeenCalledOnce();
  });

  test("stays quiet when the re-fetch fails", async () => {
    mocks.mutate.mockRejectedValueOnce(new Error("network down"));
    useLiveUpsRefresh();

    leaveLiveRoom();
    await Promise.resolve();

    expect(mocks.mutate).toHaveBeenCalledOnce();
  });
});
