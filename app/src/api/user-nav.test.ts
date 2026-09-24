import { afterEach, describe, expect, test, vi } from "vitest";

import type { UserNavType } from "./user-nav.schema";

const WBI_IMG: UserNavType["wbi_img"] = {
  img_url: "https://i0.hdslb.com/bfs/wbi/img.png",
  sub_url: "https://i0.hdslb.com/bfs/wbi/sub.png",
};

/** wbi 缓存是模块级状态，每个用例重新加载模块，避免用例之间串台 */
function loadWBIInfo() {
  vi.resetModules();
  return import("./user-nav");
}

function createRequest(nav: UserNavType) {
  const calls: string[] = [];
  return {
    calls,
    request: async (url: string) => {
      calls.push(url);
      return nav;
    },
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("wbi key", () => {
  test("并发请求只打一次 nav", async () => {
    const { getWBIInfo } = await loadWBIInfo();
    const { calls, request } = createRequest({ isLogin: true, wbi_img: WBI_IMG });

    const [first, second] = await Promise.all([getWBIInfo(request), getWBIInfo(request)]);

    expect(calls).toEqual(["/x/web-interface/nav"]);
    expect(first).toEqual(WBI_IMG);
    expect(second).toEqual(WBI_IMG);
  });

  test("一小时内复用缓存，过期后重新拉取", async () => {
    vi.useFakeTimers();
    const { getWBIInfo } = await loadWBIInfo();
    const { calls, request } = createRequest({ isLogin: true, wbi_img: WBI_IMG });

    await getWBIInfo(request);
    vi.advanceTimersByTime(59 * 60 * 1000);
    await getWBIInfo(request);
    expect(calls).toHaveLength(1);

    vi.advanceTimersByTime(2 * 60 * 1000);
    await getWBIInfo(request);
    expect(calls).toHaveLength(2);
  });

  test("请求失败不缓存，下次调用重新拉取", async () => {
    const { getWBIInfo } = await loadWBIInfo();
    const failingCalls: string[] = [];
    const failingRequest = async (url: string): Promise<UserNavType> => {
      failingCalls.push(url);
      throw new Error("network error");
    };
    const { calls, request } = createRequest({ isLogin: true, wbi_img: WBI_IMG });

    await expect(getWBIInfo(failingRequest)).rejects.toThrow("network error");
    await getWBIInfo(request);

    expect(failingCalls).toHaveLength(1);
    expect(calls).toHaveLength(1);
  });

  test("未登录时同样能拿到 wbi key", async () => {
    const { getWBIInfo } = await loadWBIInfo();
    const { request } = createRequest({ isLogin: false, wbi_img: WBI_IMG });

    await expect(getWBIInfo(request)).resolves.toEqual(WBI_IMG);
  });

  test("清缓存后重新拉取（登录成功后用）", async () => {
    const { clearWBIInfoCache, getWBIInfo } = await loadWBIInfo();
    const { calls, request } = createRequest({ isLogin: true, wbi_img: WBI_IMG });

    await getWBIInfo(request);
    clearWBIInfoCache();
    await getWBIInfo(request);

    expect(calls).toHaveLength(2);
  });
});
