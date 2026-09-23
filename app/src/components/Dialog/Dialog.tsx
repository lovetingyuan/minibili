import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  View,
} from "react-native";

import { Button, Text } from "@/components/styled/rneui";
import { theme } from "@/constants/theme";
import useResolvedColor from "@/hooks/useResolvedColor";

import type {
  DialogActionsProps,
  DialogButtonProps,
  DialogLoadingProps,
  DialogProps,
  DialogTitleProps,
} from "./Dialog.types";

const defaultPanelClassName = `w-[90%] max-w-lg rounded-xl p-5 ${theme.background.overlay}`;
const defaultBackdropClassName = "bg-black/40";

function DialogBase({
  animationType = "fade",
  backdropClassName = defaultBackdropClassName,
  children,
  className,
  dismissOnBackdrop = true,
  onClose,
  visible,
}: DialogProps) {
  // 遮罩点击与 Android 返回键都收口到 onClose；onClose 缺省时吞掉返回键，避免冒泡到导航层
  function handleRequestClose() {
    onClose?.();
  }

  function handleBackdropPress() {
    onClose?.();
  }

  const dismissible = onClose !== undefined;

  return (
    <Modal
      animationType={animationType}
      onRequestClose={handleRequestClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <Pressable
        accessibilityLabel={dismissible ? "关闭弹窗" : undefined}
        accessibilityRole={dismissible ? "button" : undefined}
        className={`absolute inset-0 ${backdropClassName}`}
        onPress={dismissible && dismissOnBackdrop ? handleBackdropPress : undefined}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 items-center justify-center"
        pointerEvents="box-none"
      >
        <View className={`${defaultPanelClassName} ${className ?? ""}`}>{children}</View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function DialogTitle({ title, titleClassName }: DialogTitleProps) {
  // 对齐 RNE Dialog.Title：18 号字、加粗、下边距 10
  return <Text className={`mb-2.5 text-lg font-semibold ${titleClassName ?? ""}`}>{title}</Text>;
}

function DialogActions({ children, className }: DialogActionsProps) {
  return (
    <View className={`mt-2.5 flex-row-reverse flex-wrap justify-start ${className ?? ""}`}>
      {children}
    </View>
  );
}

function DialogButton({ titleClassName, ...props }: DialogButtonProps) {
  return (
    <Button
      {...props}
      containerStyle={{ width: "auto" }}
      style={{ marginLeft: 5 }}
      titleClassName={titleClassName}
      titleStyle={{ fontSize: 15, fontWeight: "500" }}
      type="clear"
    />
  );
}

function DialogLoading({ className }: DialogLoadingProps) {
  const color = useResolvedColor(theme.primary.accent);

  return (
    <View className={`items-center justify-center py-5 ${className ?? ""}`}>
      <ActivityIndicator color={color} size="large" />
    </View>
  );
}

export const Dialog = Object.assign(DialogBase, {
  Actions: DialogActions,
  Button: DialogButton,
  Loading: DialogLoading,
  Title: DialogTitle,
});
