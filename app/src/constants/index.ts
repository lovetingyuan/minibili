export const githubLink = "https://github.com/lovetingyuan/minibili";
export const site = "https://minibili.tingyuan.in/";

export const serverUrl =
  typeof __DEV__ === "boolean" && __DEV__
    ? `http://${process.env.EXPO_PUBLIC_IPV4}:8787`
    : "https://minibili.tingyuan.in";

export let UA =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36";

/**
 * 视频 CDN（*.bilivideo.com）的播放地址是按 pc 平台签发的，防盗链要求：
 * 必须带 Referer，且 UA 中不能出现 "android"（不区分大小写），否则一律 403。
 * ExoPlayer 默认 UA（"... (Linux; Android 13 ...) ExoPlayerLib/..."）同样会被拒，
 * 因此媒体请求必须显式使用桌面浏览器 UA；接口请求继续使用 UA。
 */
export const mediaUA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export const GhProxy = "https://ghfast.top";

export const RanksConfig = [
  {
    rid: -1,
    label: `🔥 热门${typeof __DEV__ === "boolean" && __DEV__ ? "dev" : ""}`,
  },
  {
    rid: 0,
    label: "📺 全站",
  },
  {
    rid: 1010,
    label: "📚 知识",
  },
  {
    rid: 1012,
    label: "🔬 科技",
  },
  // {
  //   rid: 160,
  //   label: '🏠 生活',
  // },
  {
    rid: 1007,
    label: "👻 鬼畜",
  },
  {
    rid: 1024,
    label: "🐱 动物",
  },
  {
    rid: 1005,
    label: "💫 动画",
  },
  {
    rid: 1020,
    label: "🍜 美食",
  },
  {
    rid: 1003,
    label: "🎵 音乐",
  },

  {
    rid: 1018,
    label: "🚴 运动",
  },

  {
    rid: 1004,
    label: "💃 舞蹈",
  },
  {
    rid: 1008,
    label: "🎮 游戏",
  },
  {
    rid: 1013,
    label: "🚗 汽车",
  },

  {
    rid: 1002,
    label: "🎭 娱乐",
  },
  {
    rid: 1001,
    label: "🎬 影视",
  },
  {
    rid: 1014,
    label: "💅 时尚",
  },
  // {
  //   rid: 168,
  //   label: '🏯 国创',
  // },
  // {
  //   rid: -2,
  //   label: '💡 原创',
  // },
  // {
  //   rid: -3,
  //   label: '🌱 新人',
  // },
];
