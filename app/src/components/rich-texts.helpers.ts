import { clsx } from "clsx";

/**
 * 正文容器的样式：必须由内容撑开高度，禁止加 `flex-1`。
 *
 * `flex-1` 展开是 `flexGrow: 1 / flexShrink: 1 / flexBasis: 0`，一旦父级在重排时拿到有界高度约束
 * （例如动态详情页把卡片放在评论列表的 ListHeaderComponent 里，评论行挂载后 FlashList 会重新量一次
 * 头部），整块话题+正文会被算成 0 高——表现就是"文案先出现再消失"，卡片其余部分位置不变。
 * 列向容器默认 `alignItems: stretch`，去掉 `flex-1` 宽度依然撑满。
 */
export function getRichTextsContainerClassName(textOverflow: boolean, className?: string) {
  return clsx(textOverflow ? "mb-4" : "mb-3", className);
}
