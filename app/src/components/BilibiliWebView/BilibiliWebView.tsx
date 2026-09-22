import React from "react";
import { ActivityIndicator, View } from "react-native";
import { WebView } from "react-native-webview";

import { bilibiliSession } from "@/features/bilibili-session/session";
import { BilibiliCookieModuleUnavailableError } from "@/features/bilibili-session/webview-cookies";

import type { BilibiliWebViewPreparation, BilibiliWebViewProps } from "./BilibiliWebView.types";
import { Button, Text } from "@/components/styled/rneui";

function PreparedWebView(props: BilibiliWebViewProps) {
  const [attempt, setAttempt] = React.useState(0);
  const [preparation, setPreparation] = React.useState<BilibiliWebViewPreparation>({
    ready: false,
    error: null,
  });

  React.useEffect(() => {
    const controller = new AbortController();
    const generation = bilibiliSession.getSnapshot().generation;
    function isCurrent() {
      const control = bilibiliSession.getSnapshot();
      return (
        !controller.signal.aborted && control.phase === "ready" && control.generation === generation
      );
    }

    void bilibiliSession.prepareWebViewCookies(controller.signal).then(
      () => {
        if (isCurrent()) {
          setPreparation({ ready: true, error: null });
        }
      },
      (cause: unknown) => {
        if (isCurrent()) {
          setPreparation({
            ready: false,
            error:
              cause instanceof BilibiliCookieModuleUnavailableError
                ? cause.message
                : "登录 Cookie 同步失败，请重试",
          });
        }
      },
    );

    return () => controller.abort();
  }, [attempt]);

  if (!preparation.ready) {
    return (
      <View className={props.className ?? "flex-1"} style={[props.containerStyle, props.style]}>
        {preparation.error ? (
          <View className="min-h-40 flex-1 items-center justify-center gap-3 px-6">
            <Text className="text-center" accessibilityRole="alert">
              {preparation.error}
            </Text>
            <Button
              title="重试"
              onPress={() => {
                setPreparation({ ready: false, error: null });
                setAttempt((value) => value + 1);
              }}
            />
          </View>
        ) : props.renderLoading ? (
          props.renderLoading()
        ) : (
          <View className="min-h-40 flex-1 items-center justify-center">
            <ActivityIndicator accessibilityLabel="正在同步登录状态" />
          </View>
        )}
      </View>
    );
  }

  return <WebView {...props} sharedCookiesEnabled thirdPartyCookiesEnabled />;
}

export default function BilibiliWebView(props: BilibiliWebViewProps) {
  const control = React.useSyncExternalStore(
    bilibiliSession.subscribe,
    bilibiliSession.getSnapshot,
  );

  if (control.phase !== "ready") {
    return (
      <View className={props.className ?? "flex-1"} style={[props.containerStyle, props.style]}>
        <View className="min-h-40 flex-1 items-center justify-center gap-3 px-6">
          {control.phase === "logging-out" ? <ActivityIndicator /> : null}
          <Text className="text-center">
            {control.phase === "logging-out" ? "正在退出登录" : "退出尚未完成，请在设置页重试"}
          </Text>
        </View>
      </View>
    );
  }

  // 会话改变时销毁旧网页，重新同步后再加载，避免继续显示上一账号的页面。
  return <PreparedWebView key={control.generation} {...props} />;
}
