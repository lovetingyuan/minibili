/**
 * Vitest 用的 react-native-reanimated 替身：真实实现依赖原生 worklets，
 * 纯逻辑单测只需要模块可加载。
 */

export function useSharedValue(initial) {
  return { value: initial };
}

export function useAnimatedStyle(styleFactory) {
  return typeof styleFactory === "function" ? styleFactory() : {};
}

export function useAnimatedRef() {
  return { current: null };
}

export function useDerivedValue(factory) {
  return { value: typeof factory === "function" ? factory() : undefined };
}

export function withTiming(value) {
  return value;
}

export function withSpring(value) {
  return value;
}

export function withDelay(_delay, value) {
  return value;
}

export function withSequence(...values) {
  return values.at(-1);
}

export function runOnJS(fn) {
  return fn;
}

export function runOnUI(fn) {
  return fn;
}

export function interpolate(value) {
  return value;
}

export const Extrapolation = { CLAMP: "clamp", EXTEND: "extend", IDENTITY: "identity" };
export const Easing = { linear: (value) => value, bezier: () => (value) => value };

function createLayoutAnimation() {
  const animation = {
    duration: () => animation,
    delay: () => animation,
    springify: () => animation,
    withInitialValues: () => animation,
  };
  return animation;
}

export const FadeIn = createLayoutAnimation();
export const FadeInUp = createLayoutAnimation();
export const FadeInDown = createLayoutAnimation();
export const FadeOut = createLayoutAnimation();
export const FadeOutUp = createLayoutAnimation();
export const FadeOutDown = createLayoutAnimation();
export const SlideInDown = createLayoutAnimation();
export const SlideOutDown = createLayoutAnimation();

export const Animated = {
  View: () => null,
  Text: () => null,
  ScrollView: () => null,
  createAnimatedComponent: (component) => component,
};

export default Animated;
