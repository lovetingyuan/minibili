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

/**
 * 正文文本节点的样式：同样禁止 `flex-1`，理由与上面的容器一致。
 *
 * uniwind 把 `flex-1` 编译成 `flexBasis: "0%"`，列向父级高度有界时它会按父级高度解析：
 * 剩余空间为 0 时正文塌成 0 高（文案消失），剩余空间大时正文把空间全部吃掉（把图片、操作栏顶出可视区，
 * 评论条目还会按旧的头部高度和头部重叠）。
 * 这里保留 `flex-row flex-wrap`，混排的文字与行内表情仍需按行换行；宽度靠列向容器默认的 stretch 撑满。
 */
export function getRichTextsTextClassName() {
  return "flex-row flex-wrap items-center";
}
