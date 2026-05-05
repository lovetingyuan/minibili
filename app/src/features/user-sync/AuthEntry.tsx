import { Button, Text } from "@/components/styled/rneui";
import React from "react";
import { ActivityIndicator, Alert, View } from "react-native";

import { useStore } from "@/store";

import { logoutUser, openAuthModal } from "./session";

export default function AuthEntry() {
  const { authEmail, authFailureReason, authReady, isAuthenticated } = useStore();
  const authErrorMessage =
    !isAuthenticated && authEmail && authFailureReason
      ? authFailureReason === "expired"
        ? "登录已过期，请重新验证"
        : authFailureReason === "invalid"
          ? "登录认证失败，请重新验证"
          : "暂时无法连接服务器"
      : null;

  return (
    <View className="items-end">
      {authReady ? (
        <View className="flex-row items-center justify-end gap-4">
          {authErrorMessage ? (
            <Text className="shrink text-xs text-amber-600">{authErrorMessage}</Text>
          ) : null}
          {isAuthenticated && authEmail ? (
            <Button
              buttonClassName="rounded-xl px-3"
              onPress={() => {
                Alert.alert("退出登录", `确认退出 ${authEmail}？`, [
                  {
                    text: "取消",
                    style: "cancel",
                  },
                  {
                    text: "退出",
                    onPress() {
                      void logoutUser();
                    },
                  },
                ]);
              }}
              size="sm"
              title={authEmail}
              type="clear"
            />
          ) : (
            <Button
              buttonClassName="rounded-xl px-4"
              onPress={() => {
                openAuthModal(authEmail ? "reauth" : "login", authFailureReason);
              }}
              radius={"sm"}
              size="sm"
              title={authEmail ? "重新验证" : "登录"}
              type={authEmail ? "outline" : "solid"}
            />
          )}
        </View>
      ) : (
        <ActivityIndicator size="small" />
      )}
    </View>
  );
}
