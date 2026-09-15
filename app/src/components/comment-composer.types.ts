export type CommentComposerProps = {
  pending: boolean;
  /** 返回 true 表示发送成功，输入框会被清空 */
  onSubmit: (message: string) => Promise<boolean>;
  onClose: () => void;
};
