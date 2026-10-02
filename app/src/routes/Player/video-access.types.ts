/** 角标色调：充电橙、会员粉、交互蓝 */
type VideoAccessTone = "charge" | "vip" | "info";

export type VideoAccessBadge = {
  label: string;
  tone: VideoAccessTone;
};

/** 只能看片段的原因：充电专属试看、付费试看、互动视频 */
export type VideoAccessLimitedReason = "charge" | "paid" | "interactive";

/** 试看内容在视频信息区的说明类型 */
export type VideoPreviewReason = "charge" | "paid";

/**
 * 拿不到完整播放地址的原因。`unknown` 表示既不是付费也不是已知受限，按普通加载失败处理。
 */
export type VideoAccessBlockedReason =
  | "charge"
  | "paid"
  | "vip"
  | "pgc"
  | "unavailable"
  | "region"
  | "unknown";

/** 只能看互动片段时，片段播完后的浮层提示 */
export type VideoAccessLimitedNotice = {
  title: string;
  message: string;
  action: VideoAccessAction;
  /** 「重新播放」按钮的文案 */
  replayLabel: string;
};

/** 完全拿不到播放地址时的提示 */
export type VideoAccessBlockedNotice = {
  title: string;
  message: string;
};

export type VideoAccessAction = {
  label: string;
  url: string;
};

export type VideoAccess =
  /**
   * 判定所需的数据还没到位（视频信息或播放地址请求中）。
   * 此时必须当作「还不知道」，不能按不可播放处理，否则每个视频都会先闪一次加载失败。
   */
  | { kind: "pending" }
  /** 播放地址完整，播放行为与以前一致 */
  | { kind: "playable"; badge: VideoAccessBadge | null }
  /** 有地址但被截断：充电专属试看、付费试看、互动视频片段 */
  | {
      kind: "limited";
      reason: VideoAccessLimitedReason;
      badge: VideoAccessBadge;
      /** 实际可播时长（毫秒），控制条按它显示进度 */
      servedDurationMs: number;
      /**
       * 片段播完后的浮层说明。只有交互视频还在播放器里提示，
       * 试看内容改到视频信息区说明，这里为 null
       */
      notice: VideoAccessLimitedNotice | null;
      /** 试看内容在信息区的说明类型；交互视频为 null */
      previewReason: VideoPreviewReason | null;
    }
  /** 没有可用地址，只在播放器封面上说明受限类型 */
  | {
      kind: "blocked";
      reason: VideoAccessBlockedReason;
      badge: VideoAccessBadge | null;
      notice: VideoAccessBlockedNotice;
    };

export type VideoPayRights = {
  /** 大会员专享（番剧/影视等 PGC 内容为 1） */
  pay: number;
  /** UGC 付费 */
  ugcPay: number;
  /** 付费稿件 */
  arcPay: number;
};

export type VideoAccessInput = {
  bvid: string;
  /** 番剧/影视等 PGC 内容的跳转地址，非 PGC 为空字符串 */
  redirectUrl: string;
  isUpowerExclusive: boolean;
  isSteinGate: boolean;
  payRights: VideoPayRights;
  /** view 接口返回的视频总时长（秒） */
  durationSeconds: number;
  /** 实际拿到的可播时长（毫秒），没有地址时为 0 */
  servedDurationMs: number;
  hasPlayableUrl: boolean;
  errorCode: number | null;
  /** 视频信息或播放地址请求尚未返回 */
  isPending: boolean;
};

/** 只用 view 接口就能确定的标识，供信息区与下载入口使用 */
export type VideoAccessSummaryInput = {
  redirectUrl: string;
  isUpowerExclusive: boolean;
  isSteinGate: boolean;
  payRights: VideoPayRights;
};
