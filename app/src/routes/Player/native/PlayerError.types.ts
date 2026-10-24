export type PlayerErrorProps = {
  retrying: boolean
  onRetry: () => void
  /** 付费限制或互动视频片段播完后的标题 */
  title?: string
  description?: string
  /** 非错误提示中的重播按钮文案；未传时使用文字重试 */
  retryLabel?: string
  /** 受限内容的主操作，例如「在 B站 打开」 */
  actionLabel?: string
  onAction?: () => void
  /** 付费等明确受限的内容仅显示说明，不提供重试 */
  showRetry?: boolean
}
