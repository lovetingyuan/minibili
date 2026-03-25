import { Button, Icon, Text } from "@/components/styled/rneui";
import React from "react";
import { ActivityIndicator, Alert, Image, Linking, Pressable, View } from "react-native";

import { logoutUser, openAuthModal } from "@/features/user-sync/session";
import { useStore } from "@/store";
import { githubLink, site } from "../../constants";

export default Header;

function Header() {
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
    <>
      <Pressable
        className="mb-5 mt-1 flex-1 items-center"
        onPress={() => {
          Linking.openURL(site);
        }}
      >
        <Image
          source={require("../../../assets/minibili.png")}
          className="aspect-[33/10] h-auto w-[85%]"
        />
      </Pressable>
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="shrink text-2xl" numberOfLines={2}>
          一款简单的B站浏览App
        </Text>
        <Button
          radius={"sm"}
          type="clear"
          size="sm"
          containerClassName="self-start"
          onPress={() => {
            Linking.openURL(githubLink);
          }}
        >
          <Icon name="github" type="material-community" size={20} />
        </Button>
      </View>
      <View className="mb-2 mt-4 items-end">
        {authReady ? (
          <View className="flex-row items-center justify-end gap-4">
            {authErrorMessage ? (
              <Text className="shrink text-xs text-amber-600">{authErrorMessage}</Text>
            ) : null}
            {isAuthenticated && authEmail ? (
              <Button
                buttonClassName="rounded-xl px-0"
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
    </>
  );
}
