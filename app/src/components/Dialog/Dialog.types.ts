import type { ComponentProps, ReactNode } from "react";
import type { ModalProps } from "react-native";

import type { Button } from "@/components/styled/rneui";

export type DialogProps = {
  visible: boolean;
  /** 关闭回调。不传表示弹窗不可关闭：遮罩点击与 Android 返回键都不响应 */
  onClose?: () => void;
  /** 点击遮罩是否关闭，默认 true；Android 返回键不受影响，始终遵循 onClose */
  dismissOnBackdrop?: boolean;
  /** 面板样式，默认 `w-[90%] max-w-lg rounded-xl p-5` 加白色底 */
  className?: string;
  /** 遮罩样式，默认 `bg-black/40` */
  backdropClassName?: string;
  /** 弹出动画，默认 "fade" */
  animationType?: ModalProps["animationType"];
  children?: ReactNode;
};

export type DialogTitleProps = {
  title: string;
  titleClassName?: string;
};

export type DialogActionsProps = {
  className?: string;
  children?: ReactNode;
};

/** 与 styled Button 同参，但排版固定为对话框按钮（clear + 15 号字 + 自动宽度） */
export type DialogButtonProps = Omit<
  ComponentProps<typeof Button>,
  "buttonStyle" | "containerStyle" | "style" | "titleStyle" | "type"
>;

export type DialogLoadingProps = {
  className?: string;
};
