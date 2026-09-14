// 分享页与 B站取数服务共用的视频信息结构，仅包含类型定义。
export interface VideoInfoDimension {
  width: number;
  height: number;
  rotate: number;
}

export interface VideoInfoOwner {
  mid: number;
  name: string;
  face: string;
  /** 粉丝数，取不到时为 null */
  fans: number | null;
}

export interface VideoInfoStat {
  view: number;
  danmaku: number;
  reply: number;
  like: number;
  coin: number;
  favorite: number;
  share: number;
  nowRank: number;
  hisRank: number;
  evaluation: string;
}

export interface VideoInfoRights {
  isCooperation: boolean;
  isSteinGate: boolean;
  is360: boolean;
  noReprint: boolean;
}

export interface VideoInfoArgue {
  message: string;
  link: string;
}

export interface VideoInfoPage {
  page: number;
  cid: number;
  part: string;
  duration: number;
  width: number;
  height: number;
  firstFrame: string;
}

export interface VideoInfoData {
  bvid: string;
  aid: number;
  cid: number;
  currentPage: number;
  videos: number;
  title: string;
  desc: string;
  cover: string;
  duration: number;
  pubdate: number;
  ctime: number;
  tname: string;
  copyright: number;
  dimension: VideoInfoDimension;
  owner: VideoInfoOwner;
  stat: VideoInfoStat;
  rights: VideoInfoRights;
  argue: VideoInfoArgue | null;
  pages: VideoInfoPage[];
}

export interface VideoInfoResponse {
  code: number;
  message: string;
  data: VideoInfoData | null;
}
