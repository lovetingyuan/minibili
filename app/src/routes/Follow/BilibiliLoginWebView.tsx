import React from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";

import { BILIBILI_API_COOKIE_URL, hasBilibiliLoginCookie } from "@/api/bilibili-cookie.helpers";
import { Button, Text } from "@/components/styled/rneui";
import { BilibiliSessionChangedError } from "@/features/bilibili-session/controller";
import { useBilibiliSession } from "@/features/bilibili-session/useBilibiliSession";
import { useAppStateChange } from "@/hooks/useAppState";
import useLatest from "@/hooks/useLatest";
import { showToast } from "@/utils";

const BILIBILI_LOGIN_URL = "https://passport.bilibili.com/h5-app/passport/login";

export default function BilibiliLoginWebView() {
  const { login } = useBilibiliSession();
  const loginRef = useLatest(login);
  const pageUrlRef = React.useRef(BILIBILI_LOGIN_URL);
  const appState = useAppStateChange();
  const [webViewKey, setWebViewKey] = React.useState(0);
  const [captureVersion, setCaptureVersion] = React.useState(0);
  const [pageReady, setPageReady] = React.useState(false);
  const [pageFailed, setPageFailed] = React.useState(false);
  const [nativeModuleUnavailable, setNativeModuleUnavailable] = React.useState(false);
  const [captureFailed, setCaptureFailed] = React.useState(false);
  const active = appState === "active" && pageReady && !pageFailed;

  React.useEffect(() => {
    if (!active) {
      return;
    }
    const controller = new AbortController();
    let busy = false;
    let stopped = false;
    let rejectedCookie = "";

    async function captureCookie() {
      if (busy || stopped || controller.signal.aborted) {
        return;
      }
      busy = true;
      try {
        let CookieManager: (typeof import("@preeternal/react-native-cookie-manager"))["default"];
        try {
          CookieManager = (await import("@preeternal/react-native-cookie-manager")).default;
        } catch {
          stopped = true;
          if (!controller.signal.aborted) {
            setNativeModuleUnavailable(true);
          }
          return;
        }
        const cookie = await CookieManager.getCookieHeader(
          BILIBILI_API_COOKIE_URL,
          process.env.EXPO_OS === "ios",
        );
        if (
          controller.signal.aborted ||
          cookie === rejectedCookie ||
          !hasBilibiliLoginCookie(cookie)
        ) {
          return;
        }
        const accepted = await loginRef.current(cookie, controller.signal);
        if (accepted) {
          stopped = true;
          if (!controller.signal.aborted) {
            showToast("登录成功");
          }
        } else {
          rejectedCookie = cookie;
        }
      } catch (error) {
        if (!controller.signal.aborted && !(error instanceof BilibiliSessionChangedError)) {
          stopped = true;
          setCaptureFailed(true);
        }
      } finally {
        busy = false;
      }
    }

    const timer = setInterval(() => {
      void captureCookie();
    }, 1000);
    void captureCookie();
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [active, captureVersion, loginRef]);

  function reloadPage() {
    pageUrlRef.current = BILIBILI_LOGIN_URL;
    setPageReady(false);
    setPageFailed(false);
    setCaptureFailed(false);
    setWebViewKey((key) => key + 1);
  }

  if (nativeModuleUnavailable) {
    return (
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <Text className="text-center text-lg font-bold">当前安装包缺少 Cookie 模块</Text>
        <Text className="text-center leading-6">
          Expo Go 或旧版 APK 无法使用此登录功能，请重新构建并安装最新版开发包或 APK。
        </Text>
      </View>
    );
  }

  if (pageFailed) {
    return (
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <Text>登录页面加载失败，请检查网络后重试</Text>
        <Button title="重新加载" onPress={reloadPage} />
      </View>
    );
  }

  return (
    <View className="flex-1">
      {captureFailed ? (
        <View className="items-center gap-2 px-4 py-3">
          <Text>登录校验或 Cookie 保存失败，请重试</Text>
          <Button
            title="重试"
            size="sm"
            onPress={() => {
              setCaptureFailed(false);
              setCaptureVersion((version) => version + 1);
            }}
          />
        </View>
      ) : null}
      <WebView
        key={webViewKey}
        className="flex-1"
        source={{ uri: BILIBILI_LOGIN_URL }}
        originWhitelist={["https://*"]}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        startInLoadingState
        onLoadStart={(event) => {
          pageUrlRef.current = event.nativeEvent.url;
        }}
        onLoadEnd={() => {
          setPageReady(true);
        }}
        onError={() => {
          setPageFailed(true);
        }}
        onHttpError={(event) => {
          if (event.nativeEvent.url === pageUrlRef.current) {
            setPageFailed(true);
          }
        }}
        onRenderProcessGone={() => {
          setPageFailed(true);
        }}
        onContentProcessDidTerminate={() => {
          setPageFailed(true);
        }}
      />
    </View>
  );
}
