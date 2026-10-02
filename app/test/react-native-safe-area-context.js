/**
 * Vitest 用的 react-native-safe-area-context 替身。
 */

export const initialWindowMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

export function useSafeAreaInsets() {
  return { top: 0, left: 0, right: 0, bottom: 0 };
}

export function useSafeAreaFrame() {
  return initialWindowMetrics.frame;
}

export function SafeAreaProvider({ children }) {
  return children;
}

export function SafeAreaView({ children }) {
  return children;
}
