import { afterEach, beforeEach, expect, test, vi } from "vitest";

vi.mock("cloudflare:workers", () => ({ DurableObject: class {} }));

import { createApp } from "../index";
import type { ServerBindings } from "../types";

const BVID = "BV1XctB6PEuZ";
const upstream = vi.fn<typeof fetch>();
const PROXY_URL = "https://minibili-bili-proxy.vercel.app";

const env: ServerBindings = {
  BILIBILI_PROXY_TOKEN: "test-token",
  BILIBILI_PROXY_URL: PROXY_URL,
  USER_STORAGE: { getByName: () => ({ syncData: async () => ({}) }) },
};

interface ViewOverrides {
  argue?: { argue_link: string; argue_msg: string };
  desc?: string;
  pages?: unknown[];
  title?: string;
}

function buildViewPayload(overrides: ViewOverrides = {}) {
  const defaultPages = [
    {
      cid: 100,
      dimension: { height: 1080, rotate: 0, width: 1920 },
      duration: 300,
      first_frame: "",
      page: 1,
      part: "第一个分P",
    },
    {
      cid: 101,
      dimension: { height: 1080, rotate: 0, width: 1920 },
      duration: 125,
      first_frame: "",
      page: 2,
      part: "第二个分P",
    },
  ];
  return {
    code: 0,
    data: {
      aid: 1,
      argue_info: overrides.argue ?? { argue_link: "", argue_msg: "" },
      bvid: BVID,
      cid: 100,
      copyright: 1,
      ctime: 1735689600,
      desc: overrides.desc ?? "简介内容",
      dimension: { height: 1080, rotate: 0, width: 1920 },
      duration: 425,
      owner: { face: "http://i0.hdslb.com/bfs/face.jpg", mid: 42, name: "测试UP主" },
      pages: overrides.pages ?? defaultPages,
      pic: "http://i0.hdslb.com/bfs/archive.jpg",
      pubdate: 1735689600,
      rights: {},
      stat: {
        coin: 2,
        danmaku: 20,
        evaluation: "",
        favorite: 30,
        his_rank: 0,
        like: 300,
        now_rank: 0,
        reply: 40,
        share: 5,
        view: 12000,
      },
      title: overrides.title ?? "测试标题",
      tname: "生活",
      videos: 2,
    },
    message: "0",
  };
}

function requestInfo(input: RequestInfo | URL | undefined, init?: RequestInit) {
  const url =
    typeof input === "string" ? input : input instanceof URL ? input.href : (input?.url ?? "");
  const payload: unknown =
    typeof init?.body === "string" ? (JSON.parse(init.body) as unknown) : undefined;
  const path = typeof payload === "object" && payload !== null ? Reflect.get(payload, "path") : "";
  return { path: typeof path === "string" ? path : "", url };
}

/** B 站把 Worker 出口拉黑时，proxy 会原样透传 412。 */
function mockBlockedUpstream() {
  upstream.mockImplementation(
    async () => new Response("blocked", { headers: { "x-proxy-source": "upstream" }, status: 412 }),
  );
}

function mockUpstream(view: unknown, options: { unavailable?: boolean } = {}) {
  upstream.mockImplementation(async (input, init) => {
    const { path, url } = requestInfo(input, init);
    if (url !== `${PROXY_URL}/api/bili`) {
      throw new Error(`unexpected upstream url: ${url}`);
    }
    if (path.includes("/x/web-interface/view")) {
      if (options.unavailable) {
        return new Response("upstream down", {
          headers: { "x-proxy-source": "upstream" },
          status: 503,
        });
      }
      return Response.json(view);
    }
    if (path.includes("/x/relation/stat")) {
      return Response.json({ code: 0, data: { follower: 12345 }, message: "0" });
    }
    throw new Error(`unexpected proxy path: ${path}`);
  });
}

async function requestShare(path: string) {
  const app = createApp();
  return app.fetch(new Request(`https://example.com${path}`), env);
}

beforeEach(() => {
  upstream.mockReset();
  vi.stubGlobal("fetch", upstream);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("renders the share page as html with dynamic metadata", async () => {
  mockUpstream(buildViewPayload());
  const response = await requestShare(`/share?bvid=${BVID}&p=2`);
  const html = await response.text();

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("text/html");
  expect(response.headers.get("cache-control")).toBe("public, max-age=300");
  expect(html).toContain("<title>测试标题 - MiniBili</title>");
  expect(html).toContain('name="description" content="简介内容"');
  expect(html).toContain('property="og:title" content="测试标题 - MiniBili"');
  expect(html).toContain('property="og:description" content="简介内容"');
  expect(html).toContain('property="og:image"');
  expect(html).toContain('content="https://i0.hdslb.com/bfs/archive.jpg"');
  expect(html).toContain('rel="canonical"');
  expect(html).toContain(`href="https://example.com/share?bvid=${BVID}&amp;p=2"`);
  expect(html).toContain(`src="https://player.bilibili.com/player.html?bvid=${BVID}&amp;p=2"`);
  expect(html).toContain("测试UP主");
  expect(html).toContain("1.2万粉丝");
  expect(html).toContain('title="播放 1.2万"');
  expect(html).toContain(`href="/share?bvid=${BVID}&amp;p=1"`);
  expect(html).toContain(`class="page-item is-active" href="/share?bvid=${BVID}&amp;p=2"`);
  expect(html).toContain('aria-current="page"');
  expect(html).toContain("data-copy-link");
  expect(html).toContain("data-desc-text");
  expect(html).toContain("<style>");
  // JSX 的 key 只用于列表 diff，不应落到标签上
  expect(html).not.toContain(" key=");
});

test("normalizes an out of range part into the first one", async () => {
  mockUpstream(buildViewPayload());
  const response = await requestShare(`/share?bvid=${BVID}&p=9`);
  const html = await response.text();

  expect(response.status).toBe(200);
  expect(html).toContain(`src="https://player.bilibili.com/player.html?bvid=${BVID}&amp;p=1"`);
  expect(html).toContain(`class="page-item is-active" href="/share?bvid=${BVID}&amp;p=1"`);
});

test("escapes the video title and description", async () => {
  const title = `A <script>alert('1')</script> & "q"`;
  mockUpstream(buildViewPayload({ title }));
  const response = await requestShare(`/share?bvid=${BVID}`);
  const html = await response.text();

  expect(html).not.toContain("<script>alert");
  expect(html).toContain("A &lt;script&gt;alert(&#39;1&#39;)&lt;/script&gt; &amp; &quot;q&quot;");
});

test("clamps long descriptions and skips the block that repeats the title", async () => {
  const longDesc = "长".repeat(200);
  mockUpstream(buildViewPayload({ desc: longDesc }));
  const clamped = await (await requestShare(`/share?bvid=${BVID}`)).text();
  expect(clamped).toContain('class="desc-text is-clamped"');
  expect(clamped).toContain("展开全部");

  mockUpstream(buildViewPayload({ desc: "测试标题", title: "测试标题" }));
  const repeated = await (await requestShare(`/share?bvid=${BVID}`)).text();
  expect(repeated).not.toContain('class="desc-text"');
});

test("renders the argue notice and skips the part list for single part videos", async () => {
  mockUpstream(
    buildViewPayload({
      argue: { argue_link: "https://example.com/argue", argue_msg: "该视频存在争议" },
      desc: "",
      pages: [
        {
          cid: 100,
          dimension: { height: 1080, rotate: 0, width: 1920 },
          duration: 300,
          first_frame: "",
          page: 1,
          part: "",
        },
      ],
    }),
  );
  const response = await requestShare(`/share?bvid=${BVID}`);
  const html = await response.text();

  expect(html).toContain("该视频存在争议");
  expect(html).toContain('href="https://example.com/argue"');
  // 简介为空时用 UP 主兜底描述
  expect(html).toContain('name="description" content="测试UP主在哔哩哔哩发布的视频"');
  expect(html).not.toContain("分P列表");
});

test("returns a 400 error page without the player when bvid is missing", async () => {
  const response = await requestShare("/share?p=2");
  const html = await response.text();

  expect(response.status).toBe(400);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(html).toContain("缺少视频参数");
  expect(html).toContain("访问 MiniBili 官网");
  expect(html).toContain('href="/share"');
  expect(html).not.toContain("<iframe");
  expect(upstream).not.toHaveBeenCalled();
});

test("returns a 404 error page when the video does not exist", async () => {
  mockUpstream({ code: -404, data: null, message: "啥都木有" });
  const response = await requestShare(`/share?bvid=${BVID}&p=2`);
  const html = await response.text();

  expect(response.status).toBe(404);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(html).toContain("视频不存在或已被删除");
  expect(html).toContain(`href="/share?bvid=${BVID}&amp;p=2"`);
  expect(html).not.toContain("<iframe");
});

test("returns a 502 error page when the upstream is unavailable", async () => {
  mockUpstream(buildViewPayload(), { unavailable: true });
  const response = await requestShare(`/share?bvid=${BVID}&p=2`);
  const html = await response.text();

  expect(response.status).toBe(502);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(html).toContain("视频信息加载失败");
  expect(html).toContain(`href="/share?bvid=${BVID}&amp;p=2"`);
  expect(html).not.toContain("<iframe");
});

test("returns a 502 error page when bilibili blocks the request", async () => {
  mockBlockedUpstream();
  const response = await requestShare(`/share?bvid=${BVID}&p=2`);
  const html = await response.text();

  expect(response.status).toBe(502);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(html).toContain("视频信息加载失败");
  // 被风控的状态不重试，且不会再有直连 B 站的请求
  expect(upstream).toHaveBeenCalledTimes(1);
  for (const [input] of upstream.mock.calls) {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    expect(url.startsWith(PROXY_URL)).toBe(true);
  }
});

test("redirects the legacy share.html link to the share page", async () => {
  const response = await requestShare(`/share.html?bvid=${BVID}&p=2`);

  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe(`/share?bvid=${BVID}&p=2`);
});
