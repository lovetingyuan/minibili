import { useIsFocused } from "@react-navigation/native";
import React from "react";
import { ActivityIndicator, View } from "react-native";

import { useBilibiliFollowings } from "@/api/followings";
import { LoginRequired } from "@/components/LoginRequired";
import { Button, Text } from "@/components/styled/rneui";
import { theme } from "@/constants/theme";
import { bilibiliSession } from "@/features/bilibili-session/session";
import { useBilibiliSession } from "@/features/bilibili-session/useBilibiliSession";

type Props = {
  Content: React.ComponentType;
  syncFollowings?: boolean;
};

function RevalidateSessionOnFocus({ syncFollowings }: Pick<Props, "syncFollowings">) {
  const { account } = useBilibiliSession();
  useBilibiliFollowings(
    syncFollowings && account && bilibiliSession.isCurrentAccount(account)
      ? account.mid
      : undefined,
    account?.generation,
    () => Boolean(account && bilibiliSession.isCurrentAccount(account)),
  );
  return null;
}

export default function BilibiliAccountGate({ Content, syncFollowings }: Props) {
  const focused = useIsFocused();
  const { account, error, isChecking, control, revalidate } = useBilibiliSession();

  let content: React.ReactNode;
  if (control.phase !== "ready") {
    content = (
      <View className="flex-1 items-center justify-center gap-4 px-8">
        {control.phase === "logging-out" ? (
          <ActivityIndicator size="large" colorClassName={theme.secondary.accent} />
        ) : null}
        <Text>
          {control.phase === "logging-out" ? "正在退出登录" : "退出尚未完成，请在设置页重试"}
        </Text>
      </View>
    );
  } else if (account === undefined) {
    content = (
      <View className="flex-1 items-center justify-center gap-4 px-8">
        {error ? (
          <>
            <Text>暂时无法确认登录状态，请检查网络后重试</Text>
            <Button
              title="重试"
              loading={isChecking}
              onPress={() => {
                void revalidate();
              }}
            />
          </>
        ) : (
          <ActivityIndicator size="large" colorClassName={theme.secondary.accent} />
        )}
      </View>
    );
  } else {
    content = (
      <>
        {error ? (
          <View className="flex-row items-center justify-center gap-2 px-3 py-2">
            <Text className="shrink text-xs">登录状态校验失败，已保留上次状态</Text>
            <Button
              title="重试"
              type="clear"
              size="sm"
              loading={isChecking}
              onPress={() => {
                void revalidate();
              }}
            />
          </View>
        ) : null}
        {account && bilibiliSession.isCurrentAccount(account) ? (
          <Content key={`${account.mid}:${account.generation}`} />
        ) : account ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" colorClassName={theme.secondary.accent} />
          </View>
        ) : focused ? (
          <LoginRequired description="登录后即可查看 B站账号内容" />
        ) : null}
      </>
    );
  }

  return (
    <View className="flex-1">
      {focused ? <RevalidateSessionOnFocus syncFollowings={syncFollowings} /> : null}
      {content}
    </View>
  );
}
