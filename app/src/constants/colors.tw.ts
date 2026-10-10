import type { BrandTone, Tone } from "./colors.types";

/** 色值只在 global.css 中定义；这里的完整 class 供 Tailwind 扫描和原生属性解析。 */
const primary = {
  text: "text-primary",
  accent: "accent-primary",
  bg: "bg-primary-solid",
  border: "border-primary",
  tint: "bg-primary-tint",
  content: "text-brand-content",
  onDark: "text-primary-on-media",
  accentOnDark: "accent-primary-on-media",
} as const satisfies BrandTone;

const secondary = {
  text: "text-secondary",
  accent: "accent-secondary",
  bg: "bg-secondary-solid",
  border: "border-secondary",
  tint: "bg-secondary-tint",
  content: "text-brand-content",
  onDark: "text-secondary-on-media",
  accentOnDark: "accent-secondary-on-media",
} as const satisfies BrandTone;

export const theme = {
  background: {
    page: "bg-page",
    surface: "bg-surface",
    overlay: "bg-overlay",
    fill: {
      text: "text-fill",
      accent: "accent-fill",
      bg: "bg-fill",
      border: "border-fill",
    },
    fillStrong: {
      text: "text-fill-strong",
      accent: "accent-fill-strong",
      bg: "bg-fill-strong",
      border: "border-fill-strong",
    },
    fillDisabled: {
      text: "text-fill-disabled",
      accent: "accent-fill-disabled",
      bg: "bg-fill-disabled",
      border: "border-fill-disabled",
    },
    fillMuted: {
      text: "text-fill-muted",
      accent: "accent-fill-muted",
      bg: "bg-fill-muted",
      border: "border-fill-muted",
    },
  },
  border: { divider: "border-divider", outline: "border-outline" },
  text: {
    heading: "text-heading",
    primary: "text-foreground",
    secondary: "text-foreground-secondary",
    muted: "text-muted",
    disabled: "text-disabled",
  },
  icon: {
    primary: "accent-foreground",
    secondary: "accent-foreground-secondary",
    muted: "accent-muted",
    disabled: "accent-disabled",
    placeholder: "accent-fill-muted",
  },
  primary,
  secondary,
  like: secondary,
  mediaBadge: {
    text: "text-media-content",
    accent: "accent-media-content",
    bg: "bg-media-badge",
    border: "border-media-badge",
  } satisfies Tone,
  toast: {
    text: "text-toast-content",
    accent: "accent-toast-content",
    bg: "bg-toast",
    border: "border-toast-border",
  } satisfies Tone,
  success: {
    text: "text-success",
    accent: "accent-success",
    bg: "bg-success-solid",
    border: "border-success",
  } satisfies Tone,
  warning: {
    text: "text-warning",
    accent: "accent-warning",
    bg: "bg-warning-solid",
    border: "border-warning",
  } satisfies Tone,
  error: {
    text: "text-error",
    accent: "accent-error",
    bg: "bg-error-solid",
    border: "border-error",
  } satisfies Tone,
  skeleton: { base: "accent-skeleton", highlight: "accent-skeleton-highlight" },
  content: "text-brand-content",
  ripple: { primary: "accent-primary/32", content: "accent-brand-content/32" },
  media: {
    content: "text-media-content",
    muted: "text-media-content/50",
    shadow: "accent-media-shadow",
  },
} as const;
