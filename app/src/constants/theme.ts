/**
 * 主题配置：应用里所有颜色都从这里取，组件里不要再写死色值。
 *
 * - 每个值都是一段 Tailwind class：浅色值写在前面，深色用 `dark:` 变体，
 *   由 uniwind 按系统深浅色解析（例如 `bg-white dark:bg-slate-950`）；
 * - 一个色调（tone）有 text / accent / bg / border 四种用法：
 *   `text-*` 给文字，`accent-*` / `text-*` 给需要取到具体色值的原生组件与图标，
 *   `bg-*` 给底色，`border-*` 给描边；
 * - 组件优先使用语义名（background / text / icon / primary ...），
 *   语义名覆盖不到的细粒度场景再用 slate 色阶；
 * - 换肤：`themes` 里每个主题形状一致，配合 useTheme 就能整体切换。
 */

/** 一个色调的四种用法 */
export type Tone = {
  text: string
  accent: string
  bg: string
  border: string
}

/** 品牌色：比普通色调多一层 tint，用于标签底、图标底板这类浅色块 */
export type BrandTone = Tone & {
  tint: string
}

/** 中性色阶：0 最浅（占位、分隔块）→ 9 最深（标题），深色模式下整体反转 */
const slate = {
  0: {
    text: 'text-slate-50 dark:text-slate-950',
    accent: 'accent-slate-50 dark:accent-slate-950',
    bg: 'bg-slate-50 dark:bg-slate-950',
    border: 'border-slate-50 dark:border-slate-950',
  },
  1: {
    text: 'text-slate-100 dark:text-slate-900',
    accent: 'accent-slate-100 dark:accent-slate-900',
    bg: 'bg-slate-100 dark:bg-slate-900',
    border: 'border-slate-100 dark:border-slate-900',
  },
  2: {
    text: 'text-slate-200 dark:text-slate-800',
    accent: 'accent-slate-200 dark:accent-slate-800',
    bg: 'bg-slate-200 dark:bg-slate-800',
    border: 'border-slate-200 dark:border-slate-800',
  },
  3: {
    text: 'text-slate-300 dark:text-slate-700',
    accent: 'accent-slate-300 dark:accent-slate-700',
    bg: 'bg-slate-300 dark:bg-slate-700',
    border: 'border-slate-300 dark:border-slate-700',
  },
  4: {
    text: 'text-slate-400 dark:text-slate-600',
    accent: 'accent-slate-400 dark:accent-slate-600',
    bg: 'bg-slate-400 dark:bg-slate-600',
    border: 'border-slate-400 dark:border-slate-600',
  },
  5: {
    text: 'text-slate-500',
    accent: 'accent-slate-500',
    bg: 'bg-slate-500',
    border: 'border-slate-500',
  },
  6: {
    text: 'text-slate-600 dark:text-slate-400',
    accent: 'accent-slate-600 dark:accent-slate-400',
    bg: 'bg-slate-600 dark:bg-slate-400',
    border: 'border-slate-600 dark:border-slate-400',
  },
  7: {
    text: 'text-slate-700 dark:text-slate-300',
    accent: 'accent-slate-700 dark:accent-slate-300',
    bg: 'bg-slate-700 dark:bg-slate-300',
    border: 'border-slate-700 dark:border-slate-300',
  },
  8: {
    text: 'text-slate-800 dark:text-slate-200',
    accent: 'accent-slate-800 dark:accent-slate-200',
    bg: 'bg-slate-800 dark:bg-slate-200',
    border: 'border-slate-800 dark:border-slate-200',
  },
  9: {
    text: 'text-slate-900 dark:text-slate-100',
    accent: 'accent-slate-900 dark:accent-slate-100',
    bg: 'bg-slate-900 dark:bg-slate-100',
    border: 'border-slate-900 dark:border-slate-100',
  },
} as const satisfies Record<number, Tone>

export type Theme = {
  /** 底色 */
  background: {
    /** 页面底色 */
    page: string
    /** 卡片、列表块底色 */
    surface: string
    /** 浮层底色：对话框、菜单、底部弹窗 */
    overlay: string
    /** 浅色填充：标签、输入框、选中态 */
    fill: Tone
    /** 更深的填充：头像、封面占位 */
    fillStrong: Tone
    /** 不可用填充：禁用按钮底色 */
    fillDisabled: Tone
    /** 关闭状态、次级占位的填充 */
    fillMuted: Tone
  }
  /** 描边 */
  border: {
    /** 分隔线：列表、卡片之间的细线 */
    divider: string
    /** 描边：输入框、卡片轮廓 */
    outline: string
  }
  /** 文字 */
  text: {
    /** 标题（视频标题、页面标题） */
    heading: string
    /** 正文、默认文字 */
    primary: string
    /** 次要信息（UP 主、播放量） */
    secondary: string
    /** 弱化信息（时间、说明） */
    muted: string
    /** 不可用文字 */
    disabled: string
  }
  /** 图标（和文字同色，单独一组方便以后拉开层次） */
  icon: {
    primary: string
    secondary: string
    muted: string
    disabled: string
    /** 未选中、占位图标 */
    placeholder: string
  }
  /** 主色：深一档的蓝给文字，品牌浅蓝给角标与蒙层 */
  primary: BrandTone & {
    /** 品牌浅蓝（#00AEEC）的文字形态，用在深色蒙层上，例如「直播中」 */
    onDark: string
  }
  /** 品牌粉：关注态、UP 标记 */
  secondary: BrandTone
  /** 评论点赞高亮 */
  like: Tone
  /** 封面角标：深色半透明底 + 白字，保证任意缩略图上都能看清 */
  mediaBadge: Tone
  success: Tone
  warning: Tone
  error: Tone
  /** 中性色阶：语义色覆盖不到的细粒度明暗 */
  slate: typeof slate
}

/**
 * 默认主题：slate 中性色 + 偏冷的蓝主色 + B 站品牌粉辅助色。
 * 深浅色都写在同一段 class 里，跟随系统的深浅色切换。
 */
export const defaultTheme: Theme = {
  background: {
    page: 'bg-slate-100 dark:bg-black',
    surface: 'bg-white dark:bg-slate-950',
    overlay: 'bg-white dark:bg-slate-900',
    fill: slate[1],
    fillStrong: slate[2],
    fillDisabled: slate[3],
    fillMuted: slate[4],
  },
  border: {
    divider: slate[2].border,
    outline: slate[3].border,
  },
  text: {
    heading: slate[9].text,
    primary: slate[8].text,
    secondary: slate[7].text,
    muted: slate[6].text,
    disabled: slate[5].text,
  },
  icon: {
    primary: slate[8].accent,
    secondary: slate[7].accent,
    muted: slate[6].accent,
    disabled: slate[5].accent,
    placeholder: slate[4].accent,
  },
  /**
   * 主色：两个蓝分工
   * - #008AC5（深一档）：浅色背景上的链接、选中态文字与图标
   * - #00AEEC（品牌浅蓝）：角标、实底、浅底，以及深色蒙层上的「直播中」
   */
  primary: {
    text: 'text-[#008AC5] dark:text-[#00AEEC]',
    accent: 'accent-[#008AC5] dark:accent-[#00AEEC]',
    bg: 'bg-[#00AEEC]',
    border: 'border-[#00AEEC]',
    tint: 'bg-[#00AEEC]/10 dark:bg-[#00AEEC]/20',
    onDark: 'text-[#00AEEC]',
  },
  /**
   * 辅助色：全局唯一的粉（B 站粉），关注态、UP 标记、置顶标签都用它
   */
  secondary: {
    text: 'text-[#FF6699]',
    accent: 'accent-[#FF6699]',
    bg: 'bg-[#FF6699]',
    border: 'border-[#FF6699]',
    tint: 'bg-[#FF6699]/10 dark:bg-[#FF6699]/20',
  },
  /** 评论点赞高亮：复用品牌粉，保证全局只有一个粉色 */
  like: {
    text: 'text-[#FF6699]',
    accent: 'accent-[#FF6699]',
    bg: 'bg-[#FF6699]',
    border: 'border-[#FF6699]',
  },
  mediaBadge: {
    text: 'text-white',
    accent: 'accent-white',
    bg: 'bg-slate-950/70',
    border: 'border-slate-950/70',
  },
  success: {
    text: 'text-emerald-600 dark:text-emerald-400',
    accent: 'accent-emerald-600 dark:accent-emerald-400',
    bg: 'bg-emerald-600',
    border: 'border-emerald-600',
  },
  warning: {
    text: 'text-orange-500 dark:text-orange-400',
    accent: 'accent-orange-500 dark:accent-orange-400',
    bg: 'bg-orange-500',
    border: 'border-orange-500',
  },
  error: {
    text: 'text-red-500 dark:text-red-400',
    accent: 'accent-red-500 dark:accent-red-400',
    bg: 'bg-red-500',
    border: 'border-red-500',
  },
  slate,
}

/** 主题表：以后加主题就在这里加一份同样形状的配置，再用 useTheme 切换 */
export const themes = {
  default: defaultTheme,
} as const

export type ThemeId = keyof typeof themes

/** 默认主题，组件里一般用 useTheme() 拿到当前主题 */
export const theme = themes.default

/** react-navigation 深色主题的容器底色，与页面底色保持一致 */
export const RouteBackgroundColor = theme.background.page
