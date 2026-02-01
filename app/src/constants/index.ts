export const githubLink = "https://github.com/lovetingyuan/minibili";
export const site = "https://minibili.tingyuan.in/";
export const configUrl = `${site}config.json`;

export let UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36 Edg/134.0.0.0";

export const setUA = (ua: string) => {
  UA = ua;
};

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
    rid: 36,
    label: "📚 知识",
  },
  {
    rid: 188,
    label: "🔬 科技",
  },
  {
    rid: 160,
    label: "🏠 生活",
  },
  {
    rid: 119,
    label: "👻 鬼畜",
  },
  {
    rid: 217,
    label: "🐱 动物",
  },
  {
    rid: 1,
    label: "💫 动画",
  },
  {
    rid: 211,
    label: "🍜 美食",
  },
  {
    rid: 3,
    label: "🎵 音乐",
  },

  {
    rid: 234,
    label: "🚴 运动",
  },

  {
    rid: 129,
    label: "💃 舞蹈",
  },
  {
    rid: 4,
    label: "🎮 游戏",
  },
  {
    rid: 223,
    label: "🚗 汽车",
  },

  {
    rid: 5,
    label: "🎭 娱乐",
  },
  {
    rid: 181,
    label: "🎬 影视",
  },
  {
    rid: 155,
    label: "💅 时尚",
  },
  {
    rid: 168,
    label: "🏯 国创",
  },
  {
    rid: -2,
    label: "💡 原创",
  },
  {
    rid: -3,
    label: "🌱 新人",
  },
];
