import { useResolveClassNames } from "uniwind";

/**
 * 把 tailwind class 解析成 RN 样式对象。
 * 组件自己解析而不是把 className 交给 RN 组件，是因为 uniwind 会把 `style` 排在 className 之后，
 * 直接混用会让运行时算出来的样式压过调用方传入的 className。
 */
export default function useResolvedStyle(className?: string) {
  return useResolveClassNames(className ?? "");
}
