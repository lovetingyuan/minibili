import { describe, expect, test } from "vitest";

import { isDownloadRestricted, resolveVideoAccess, resolveVideoBadges } from "./video-access";
import type { VideoAccessInput, VideoPayRights } from "./video-access.types";

const FREE_RIGHTS: VideoPayRights = { arcPay: 0, pay: 0, ugcPay: 0 };

/** 默认是一条能完整播放的普通视频，用例只覆盖自己关心的字段 */
function createInput(overrides: Partial<VideoAccessInput> = {}): VideoAccessInput {
  return {
    bvid: "BV1HS421w7wG",
    redirectUrl: "",
    isUpowerExclusive: false,
    isSteinGate: false,
    payRights: FREE_RIGHTS,
    durationSeconds: 568,
    servedDurationMs: 568_000,
    hasPlayableUrl: true,
    errorCode: null,
    isPending: false,
    ...overrides,
  };
}

describe("resolveVideoAccess", () => {
  test("请求还在路上时不判定为不可播放", () => {
    // 视频信息没回来时 cid 还是 0，播放地址请求还没发出：urls 与 errorCode 都是空的
    const loading = resolveVideoAccess(
      createInput({
        isPending: true,
        hasPlayableUrl: false,
        servedDurationMs: 0,
        errorCode: null,
      }),
    );

    expect(loading).toEqual({ kind: "pending" });
  });

  test("视频信息已有但播放地址请求中同样是 pending", () => {
    const access = resolveVideoAccess(
      createInput({
        isPending: true,
        hasPlayableUrl: false,
        servedDurationMs: 0,
        redirectUrl: "https://www.bilibili.com/bangumi/play/ep826498",
        payRights: { arcPay: 0, pay: 1, ugcPay: 0 },
      }),
    );

    expect(access).toEqual({ kind: "pending" });
  });

  test("请求结束拿到地址后不再受 pending 影响", () => {
    const access = resolveVideoAccess(
      createInput({ isPending: true, servedDurationMs: 568_000 }),
    );

    expect(access).toEqual({ kind: "playable", badge: null });
  });

  test("没有播放地址但请求未返回时，任何受限标记都不会提前报错", () => {
    const flagSets: Partial<VideoAccessInput>[] = [
      { redirectUrl: "https://www.bilibili.com/bangumi/play/ep826498" },
      { redirectUrl: "https://www.bilibili.com/bangumi/play/ep826498", payRights: { arcPay: 0, pay: 1, ugcPay: 0 } },
      { isUpowerExclusive: true },
      { isSteinGate: true },
      { payRights: { arcPay: 1, pay: 0, ugcPay: 0 } },
      { payRights: { arcPay: 0, pay: 0, ugcPay: 1 } },
      { errorCode: -404 },
      { errorCode: -10403 },
      { errorCode: 87008 },
    ];

    for (const flags of flagSets) {
      expect(
        resolveVideoAccess(
          createInput({ isPending: true, hasPlayableUrl: false, servedDurationMs: 0, ...flags }),
        ),
      ).toEqual({ kind: "pending" });
    }
  });

  test("普通视频不产生任何提示", () => {
    const access = resolveVideoAccess(createInput());

    expect(access).toEqual({ kind: "playable", badge: null });
  });

  test("充电专属试看 30 秒（BV1wZez6iEwK）标记为试看而不是播放失败", () => {
    const access = resolveVideoAccess(
      createInput({
        bvid: "BV1wZez6iEwK",
        isUpowerExclusive: true,
        durationSeconds: 1782,
        servedDurationMs: 29_978,
      }),
    );

    expect(access).toMatchObject({
      kind: "limited",
      reason: "charge",
      playerLabel: "充电专属 · 试看",
      servedDurationMs: 29_978,
      badge: { label: "充电专属", tone: "charge" },
    });
  });

  test("充电专属试看时长由 UP 设置（BV12y3Q6WEhh 试看 21 分钟）", () => {
    const access = resolveVideoAccess(
      createInput({
        bvid: "BV12y3Q6WEhh",
        isUpowerExclusive: true,
        durationSeconds: 1539,
        servedDurationMs: 1_259_985,
      }),
    );

    expect(access).toMatchObject({ kind: "limited", reason: "charge" });
  });

  test("已充电拿到完整地址时只保留内容角标", () => {
    const access = resolveVideoAccess(
      createInput({
        isUpowerExclusive: true,
        durationSeconds: 1782,
        servedDurationMs: 1_781_902,
      }),
    );

    expect(access).toEqual({ kind: "playable", badge: { label: "充电专属", tone: "charge" } });
  });

  test("充电专属没有开放试看（87008）时提示需要充电", () => {
    const access = resolveVideoAccess(
      createInput({
        bvid: "BV1RLYi6CERM",
        isUpowerExclusive: true,
        durationSeconds: 2931,
        servedDurationMs: 0,
        hasPlayableUrl: false,
        errorCode: 87008,
      }),
    );

    expect(access).toMatchObject({
      kind: "blocked",
      reason: "charge",
      badge: { label: "充电专属", tone: "charge" },
      notice: { title: "需要充电后观看" },
    });
    expect(access.kind === "blocked" && access.notice.action?.url).toBe(
      "https://www.bilibili.com/video/BV1RLYi6CERM",
    );
  });

  test("番剧会员集（-404 + redirect_url）提示需要大会员并跳回番剧页", () => {
    const access = resolveVideoAccess(
      createInput({
        bvid: "BV1Xx4y1b7Nf",
        redirectUrl: "https://www.bilibili.com/bangumi/play/ep826498",
        payRights: { arcPay: 0, pay: 1, ugcPay: 0 },
        durationSeconds: 1426,
        servedDurationMs: 0,
        hasPlayableUrl: false,
        errorCode: -404,
      }),
    );

    expect(access).toMatchObject({
      kind: "blocked",
      reason: "vip",
      badge: { label: "大会员", tone: "vip" },
      notice: { title: "需要大会员观看" },
    });
    expect(access.kind === "blocked" && access.notice.action?.url).toBe(
      "https://www.bilibili.com/bangumi/play/ep826498",
    );
  });

  test("免费番剧集拿到完整地址时照常播放", () => {
    const access = resolveVideoAccess(
      createInput({
        bvid: "BV15i421v7FQ",
        redirectUrl: "https://www.bilibili.com/bangumi/play/ep826497",
        durationSeconds: 2939,
        servedDurationMs: 2_938_131,
      }),
    );

    expect(access).toEqual({ kind: "playable", badge: null });
  });

  test("pay=1 但当前可完整播放时不提示（限时免费/免费期）", () => {
    const access = resolveVideoAccess(
      createInput({
        bvid: "BV13Dem6VEhn",
        redirectUrl: "https://www.bilibili.com/bangumi/play/ep6384216",
        payRights: { arcPay: 0, pay: 1, ugcPay: 0 },
        durationSeconds: 1206,
        servedDurationMs: 1_205_269,
      }),
    );

    expect(access).toEqual({ kind: "playable", badge: null });
  });

  test("互动视频（BV1vb4y1r7cg）片段播完提示暂不支持", () => {
    const access = resolveVideoAccess(
      createInput({
        bvid: "BV1vb4y1r7cg",
        isSteinGate: true,
        durationSeconds: 1613,
        servedDurationMs: 10_588,
      }),
    );

    expect(access).toMatchObject({
      kind: "limited",
      reason: "interactive",
      playerLabel: "交互视频",
      notice: { title: "暂不支持交互视频", replayLabel: "重新播放" },
    });
  });

  test("付费稿件拿不到地址时提示需要付费", () => {
    const access = resolveVideoAccess(
      createInput({
        payRights: { arcPay: 1, pay: 0, ugcPay: 0 },
        servedDurationMs: 0,
        hasPlayableUrl: false,
        errorCode: -404,
      }),
    );

    expect(access).toMatchObject({
      kind: "blocked",
      reason: "paid",
      badge: { label: "付费视频", tone: "vip" },
    });
  });

  test("付费内容被截断时按试看处理", () => {
    const access = resolveVideoAccess(
      createInput({
        payRights: { arcPay: 0, pay: 0, ugcPay: 1 },
        durationSeconds: 1200,
        servedDurationMs: 360_000,
      }),
    );

    expect(access).toMatchObject({
      kind: "limited",
      reason: "paid",
      playerLabel: "付费视频 · 试看",
    });
  });

  test("地区限制提示而不是加载失败", () => {
    const access = resolveVideoAccess(
      createInput({ servedDurationMs: 0, hasPlayableUrl: false, errorCode: -10403 }),
    );

    expect(access).toMatchObject({ kind: "blocked", reason: "region", badge: null });
  });

  test("已失效稿件提示不可用", () => {
    const access = resolveVideoAccess(
      createInput({ servedDurationMs: 0, hasPlayableUrl: false, errorCode: -404 }),
    );

    expect(access).toMatchObject({
      kind: "blocked",
      reason: "unavailable",
      notice: { title: "视频不可用" },
    });
  });

  test("未知错误保持原来的加载失败提示", () => {
    const access = resolveVideoAccess(
      createInput({ servedDurationMs: 0, hasPlayableUrl: false, errorCode: -1 }),
    );

    expect(access).toEqual({
      kind: "blocked",
      reason: "unknown",
      badge: null,
      notice: {
        title: "视频加载失败",
        message: "播放地址获取失败或播放器出错，请稍后重试",
        action: null,
      },
    });
  });

  test("分段 durl 累加后与总时长一致时不算试看", () => {
    const access = resolveVideoAccess(
      createInput({
        durationSeconds: 5555,
        servedDurationMs: 5_554_475,
      }),
    );

    expect(access).toEqual({ kind: "playable", badge: null });
  });

  test("时长差值在容差内不判定为试看", () => {
    const access = resolveVideoAccess(
      createInput({
        isUpowerExclusive: true,
        durationSeconds: 600,
        servedDurationMs: 595_000,
      }),
    );

    expect(access).toEqual({ kind: "playable", badge: { label: "充电专属", tone: "charge" } });
  });
});

describe("resolveVideoBadges", () => {
  test("只标注能确定的类型，番剧的 pay=1 不作为角标", () => {
    expect(
      resolveVideoBadges({
        redirectUrl: "https://www.bilibili.com/bangumi/play/ep826498",
        isUpowerExclusive: false,
        isSteinGate: false,
        payRights: { arcPay: 0, pay: 1, ugcPay: 0 },
      }),
    ).toEqual([]);
  });

  test("充电专属、付费稿件与交互视频各自展示角标", () => {
    expect(
      resolveVideoBadges({
        redirectUrl: "",
        isUpowerExclusive: true,
        isSteinGate: true,
        payRights: { arcPay: 1, pay: 0, ugcPay: 0 },
      }),
    ).toEqual([
      { label: "充电专属", tone: "charge" },
      { label: "付费视频", tone: "vip" },
      { label: "交互视频", tone: "info" },
    ]);
  });
});

describe("isDownloadRestricted", () => {
  test("普通视频与免费番剧集仍可下载", () => {
    expect(
      isDownloadRestricted({
        redirectUrl: "",
        isUpowerExclusive: false,
        isSteinGate: false,
        payRights: FREE_RIGHTS,
      }),
    ).toBe(false);
    expect(
      isDownloadRestricted({
        redirectUrl: "https://www.bilibili.com/bangumi/play/ep826497",
        isUpowerExclusive: false,
        isSteinGate: false,
        payRights: { arcPay: 0, pay: 0, ugcPay: 0 },
      }),
    ).toBe(false);
  });

  test("充电专属、付费稿件与会员番剧隐藏下载入口", () => {
    const base = {
      redirectUrl: "",
      isUpowerExclusive: false,
      isSteinGate: false,
      payRights: FREE_RIGHTS,
    };

    expect(isDownloadRestricted({ ...base, isUpowerExclusive: true })).toBe(true);
    expect(isDownloadRestricted({ ...base, payRights: { arcPay: 1, pay: 0, ugcPay: 0 } })).toBe(
      true,
    );
    expect(
      isDownloadRestricted({
        ...base,
        redirectUrl: "https://www.bilibili.com/bangumi/play/ep826498",
        payRights: { arcPay: 0, pay: 1, ugcPay: 0 },
      }),
    ).toBe(true);
  });
});
