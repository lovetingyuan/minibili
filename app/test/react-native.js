/**
 * Vitest 用的 react-native 替身。
 *
 * node_modules 里的 react-native 使用 Flow 语法，rolldown 无法解析，凡是间接
 * import 到它的纯逻辑单测都会在加载阶段失败。这里只提供测试实际用到的导出。
 */

function noop() {}

export const Alert = {
  alert: noop,
};

export const Share = {
  share: async () => ({ action: "dismissedAction" }),
};

export const AppState = {
  currentState: "active",
  addEventListener: () => ({ remove: noop }),
};

export const Linking = {
  openURL: async () => true,
};

export const Platform = {
  OS: "android",
  select: (options) => options.android ?? options.default,
};

export const PixelRatio = {
  get: () => 1,
  roundToNearestPixel: (value) => value,
};

export const StyleSheet = {
  absoluteFill: {},
  create: (styles) => styles,
};

export const View = noop;
export const Text = noop;
export const Pressable = noop;
