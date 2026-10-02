import type {
  VideoAccess,
  VideoAccessAction,
  VideoAccessBadge,
  VideoAccessBlockedReason,
  VideoAccessBlockedNotice,
  VideoAccessInput,
  VideoAccessLimitedNotice,
  VideoAccessSummaryInput,
  VideoPayRights,
  VideoPreviewReason,
} from "./video-access.types";

/**
 * 试看判定容差：实际可播时长比视频总时长少这么多才算被截断。
 * 正常视频的两者基本一致（实测 29:47 的视频差值在 1 秒内），
 * 实测的试看片段差值从十几秒到几十分钟不等。
 */
const PREVIEW_GAP_MS = 10_000;

/** 充电专属没有开放试看时 B站 返回的错误码 */
const UPOWER_EXCLUSIVE_ERROR_CODE = 87008;

const BILIBILI_VIDEO_URL = "https://www.bilibili.com/video/";
const OPEN_IN_BILIBILI_LABEL = "在 B站 打开";

const CHARGE_BADGE: VideoAccessBadge = { label: "充电专属", tone: "charge" };
const PAID_BADGE: VideoAccessBadge = { label: "付费视频", tone: "vip" };
const VIP_BADGE: VideoAccessBadge = { label: "大会员", tone: "vip" };
const PGC_BADGE: VideoAccessBadge = { label: "番剧/影视", tone: "vip" };
const INTERACTIVE_BADGE: VideoAccessBadge = { label: "交互视频", tone: "info" };

/**
 * 试看内容在视频信息区的说明文案。
 * 播放器里不再提示试看，只在这里说明，所以文案保持简短。
 */
const PREVIEW_NOTES: Record<VideoPreviewReason, string> = {
  charge: "该视频为充电专属内容，仅能试看",
  paid: "该视频为付费内容，仅能试看",
};

export function resolvePreviewNote(reason: VideoPreviewReason) {
  return PREVIEW_NOTES[reason];
}

function isPaidRights(rights: VideoPayRights) {
  return rights.pay === 1 || rights.ugcPay === 1 || rights.arcPay === 1;
}

function isUgcPaid(rights: VideoPayRights) {
  return rights.ugcPay === 1 || rights.arcPay === 1;
}

/** 交互视频优先跳回 B站：PGC 用接口给的番剧地址，其余用视频页地址 */
function resolveBilibiliAction(input: VideoAccessInput): VideoAccessAction {
  return {
    label: OPEN_IN_BILIBILI_LABEL,
    url: input.redirectUrl || `${BILIBILI_VIDEO_URL}${encodeURIComponent(input.bvid)}`,
  };
}

/** 交互视频片段播完后的浮层：试看内容已经不在播放器里提示了 */
function buildInteractiveNotice(input: VideoAccessInput): VideoAccessLimitedNotice {
  return {
    title: "暂不支持交互视频",
    message: "该视频为交互视频，MiniBili 暂不支持互动分支，可在 B站 体验完整互动内容",
    action: resolveBilibiliAction(input),
    replayLabel: "重新播放",
  };
}

/** 受限内容拿不到地址时的说明：只保留类型与原因，播放器上不再给跳转按钮 */
function buildBlockedNotice(reason: VideoAccessBlockedReason): VideoAccessBlockedNotice {
  switch (reason) {
    case "charge":
      return {
        title: "需要充电后观看",
        message: "该视频为 UP主 充电专属内容，MiniBili 无法播放，可在 B站 充电后观看",
      };
    case "paid":
      return {
        title: "需要付费观看",
        message: "该视频为付费内容，购买后可在 B站 观看",
      };
    case "pgc":
      return {
        title: "暂时无法播放",
        message: "该视频为番剧/影视内容，MiniBili 暂不支持播放，可在 B站 观看",
      };
    case "vip":
      return {
        title: "需要大会员观看",
        message: "该视频为番剧/影视等会员内容，MiniBili 暂不支持播放，可在 B站 观看",
      };
    case "region":
      return {
        title: "当前地区无法观看",
        message: "该视频受地区或版权限制，请在 B站 客户端再试",
      };
    case "unavailable":
      return {
        title: "视频不可用",
        message: "视频不存在、已被删除或没有访问权限",
      };
    default:
      return {
        title: "视频加载失败",
        message: "播放地址获取失败或播放器出错，请稍后重试",
      };
  }
}

/**
 * 判定当前视频能不能完整播放、是不是只有试看片段、还是完全拿不到地址。
 *
 * 结论以**实际拿到的播放地址**为准：`rights.pay` 等标记只能解释原因。
 * 实测存在 `pay=1`（番剧/影视）但当前可以完整播放的内容（限时免费/免费期），
 * 也有拿不到地址但没有任何付费标记的稿件（被删/无权限）。
 */
export function resolveVideoAccess(input: VideoAccessInput): VideoAccess {
  // 数据还没到位时先不判定：视频信息或播放地址请求中，urls 和 errorCode 都是空的，
  // 直接往下走会把每个视频都判成「不可播放」
  if (input.isPending && !input.hasPlayableUrl) {
    return { kind: "pending" };
  }

  if (input.hasPlayableUrl) {
    if (input.isSteinGate) {
      return {
        kind: "limited",
        reason: "interactive",
        badge: INTERACTIVE_BADGE,
        servedDurationMs: input.servedDurationMs,
        notice: buildInteractiveNotice(input),
        previewReason: null,
      };
    }

    const gapMs = input.durationSeconds * 1000 - input.servedDurationMs;
    const truncated = input.servedDurationMs > 0 && gapMs > PREVIEW_GAP_MS;
    if (truncated && (input.isUpowerExclusive || isPaidRights(input.payRights))) {
      const reason = input.isUpowerExclusive ? "charge" : "paid";
      const badge = input.isUpowerExclusive ? CHARGE_BADGE : PAID_BADGE;
      return {
        kind: "limited",
        reason,
        badge,
        servedDurationMs: input.servedDurationMs,
        // 试看不在播放器里提示，只在播放器下方的视频信息区说明
        notice: null,
        previewReason: reason,
      };
    }

    // 已经充电/是大会员时同样走这里：拿得到完整地址就不提示
    const badge = input.isUpowerExclusive
      ? CHARGE_BADGE
      : isUgcPaid(input.payRights)
        ? PAID_BADGE
        : null;
    return { kind: "playable", badge };
  }

  // 下面都是拿不到任何播放地址的情况
  if (input.isUpowerExclusive || input.errorCode === UPOWER_EXCLUSIVE_ERROR_CODE) {
    return {
      kind: "blocked",
      reason: "charge",
      badge: CHARGE_BADGE,
      notice: buildBlockedNotice("charge"),
    };
  }
  if (input.redirectUrl && input.payRights.pay === 1) {
    return {
      kind: "blocked",
      reason: "vip",
      badge: VIP_BADGE,
      notice: buildBlockedNotice("vip"),
    };
  }
  if (isUgcPaid(input.payRights)) {
    return {
      kind: "blocked",
      reason: "paid",
      badge: PAID_BADGE,
      notice: buildBlockedNotice("paid"),
    };
  }
  if (input.redirectUrl) {
    return {
      kind: "blocked",
      reason: "pgc",
      badge: PGC_BADGE,
      notice: buildBlockedNotice("pgc"),
    };
  }
  if (input.payRights.pay === 1) {
    return {
      kind: "blocked",
      reason: "vip",
      badge: VIP_BADGE,
      notice: buildBlockedNotice("vip"),
    };
  }
  if (input.errorCode === -10403) {
    return {
      kind: "blocked",
      reason: "region",
      badge: null,
      notice: buildBlockedNotice("region"),
    };
  }
  if (input.errorCode === -404 || input.errorCode === -403) {
    return {
      kind: "blocked",
      reason: "unavailable",
      badge: null,
      notice: buildBlockedNotice("unavailable"),
    };
  }
  return {
    kind: "blocked",
    reason: "unknown",
    badge: null,
    notice: buildBlockedNotice("unknown"),
  };
}

/**
 * 只用 view 接口就能确定的角标。番剧/影视的 `pay=1` 不能作为角标：
 * 限时免费的剧集同样是 `pay=1`，能不能看只有播放地址说了算。
 */
export function resolveVideoBadges(input: VideoAccessSummaryInput): VideoAccessBadge[] {
  const badges: VideoAccessBadge[] = [];
  if (input.isUpowerExclusive) {
    badges.push(CHARGE_BADGE);
  }
  if (isUgcPaid(input.payRights)) {
    badges.push(PAID_BADGE);
  }
  if (input.isSteinGate) {
    badges.push(INTERACTIVE_BADGE);
  }
  return badges;
}

/**
 * 受限内容取不到可下载的地址，菜单里直接隐藏下载入口，
 * 避免先点一次再收到「暂不支持下载」。
 */
export function isDownloadRestricted(input: VideoAccessSummaryInput) {
  return (
    input.isUpowerExclusive ||
    isUgcPaid(input.payRights) ||
    (input.redirectUrl !== "" && input.payRights.pay === 1)
  );
}
