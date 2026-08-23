import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Skeleton } from "@/components/styled/rneui";
import React, { useCallback, useEffect } from "react";
import { BackHandler, Platform, Share, View } from "react-native";
import WebView from "react-native-webview";

import { useRecoverableWebView } from "@/hooks/useRecoverableWebView";
import useUpdateNavigationOptions from "@/hooks/useUpdateNavigationOptions";
import { useStore } from "@/store";
import { showToast } from "@/utils";

import type { NavigationProps, RootStackParamList } from "../../types";
import { av2bv } from "./avbv";
import { headerTitle, headerRight } from "./Header";
import injectCode from "./inject";

type Props = NativeStackScreenProps<RootStackParamList, "Dynamic">;

type DynamicOpenVideoPayload = {
  av: number;
  title: string;
  mid?: string | number;
  name?: string;
  face?: string;
};

type DynamicWebViewMessage =
  | {
      action: "reload-dynamic-page";
    }
  | {
      action: "open-video";
      payload: DynamicOpenVideoPayload;
    }
  | {
      action: "share-content";
      payload: {
        link: string;
        texts: string;
      };
    }
  | {
      action: "open-dynamic-detail" | "open-topic";
      payload: {
        url: string;
        title: string;
      };
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function getString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function getStringOrNumber(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? value : undefined;
}

function parseDynamicWebViewMessage(data: string): DynamicWebViewMessage | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch {
    return null;
  }

  if (!isRecord(parsed) || typeof parsed.action !== "string") {
    return null;
  }

  if (parsed.action === "reload-dynamic-page") {
    return {
      action: parsed.action,
    };
  }

  if (!isRecord(parsed.payload)) {
    return null;
  }

  if (parsed.action === "open-video") {
    const av = toNumber(parsed.payload.av);
    if (av === null) {
      return null;
    }

    return {
      action: parsed.action,
      payload: {
        av,
        title: getString(parsed.payload.title) ?? "",
        mid: getStringOrNumber(parsed.payload.mid),
        name: getString(parsed.payload.name),
        face: getString(parsed.payload.face),
      },
    };
  }

  if (parsed.action === "share-content") {
    const link = getString(parsed.payload.link);
    const texts = getString(parsed.payload.texts);
    if (!link || texts === undefined) {
      return null;
    }

    return {
      action: parsed.action,
      payload: {
        link,
        texts,
      },
    };
  }

  if (parsed.action === "open-dynamic-detail" || parsed.action === "open-topic") {
    const url = getString(parsed.payload.url);
    const title = getString(parsed.payload.title);
    if (!url || title === undefined) {
      return null;
    }

    return {
      action: parsed.action,
      payload: {
        url,
        title,
      },
    };
  }

  return null;
}

function LoadingComp() {
  return (
    <View>
      {Array(10)
        .fill(null)
        .map((_, i) => {
          return (
            <View className="my-2 gap-4 p-3" key={i}>
              {i % 2 === 0 ? (
                <View className="gap-2">
                  <Skeleton
                    animation="wave"
                    width={`${Math.floor(Math.random() * 81) + 10}%` as any}
                    height={15}
                  />
                  {Math.random() > 0.5 ? (
                    <Skeleton
                      animation="wave"
                      width={`${Math.floor(Math.random() * 81) + 10}%` as any}
                      height={15}
                    />
                  ) : null}
                  <Skeleton
                    width={`${Math.floor(Math.random() * 81) + 10}%` as any}
                    animation="wave"
                    height={15}
                  />
                </View>
              ) : null}
              <View className="flex-row gap-3">
                <Skeleton animation="pulse" width={"45%" as any} height={95} />
                <View className="flex-1 justify-between gap-3">
                  <Skeleton
                    animation="wave"
                    width={`${Math.floor(Math.random() * 81) + 10}%` as any}
                    height={15}
                  />
                  <Skeleton
                    animation="wave"
                    width={`${Math.floor(Math.random() * 81) + 10}%` as any}
                    height={15}
                  />
                </View>
              </View>
            </View>
          );
        })}
    </View>
  );
}

function Dynamic({ route }: Props) {
  const upId = route.params?.user?.mid; // || specialUser?.mid
  // const dynamicListRef = React.useRef<any>(null)

  const { reloadUerProfile } = useStore();
  const {
    webViewRef,
    webViewKey,
    handleWebViewMessage,
    handleRenderProcessGone,
    handleContentProcessDidTerminate,
  } = useRecoverableWebView();
  const navigation = useNavigation<NavigationProps["navigation"]>();

  useUpdateNavigationOptions({
    headerTitle,
    headerRight,
  });
  const currentNavigationStateRef = React.useRef<{
    canGoBack: boolean;
    title: string;
    url: string;
    init?: boolean;
  }>({
    canGoBack: false,
    title: "",
    url: "",
    init: true,
  });
  useFocusEffect(
    useCallback(() => {
      const onAndroidBackPress = () => {
        if (currentNavigationStateRef.current.canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      };
      if (Platform.OS === "android") {
        const handler = BackHandler.addEventListener("hardwareBackPress", onAndroidBackPress);

        return () => {
          handler.remove();
        };
      }
    }, []),
  );
  // useEffect(() => {
  //   if (dynamicOpenUrl) {
  //     setDynamicOpenUrl(0)
  //     webviewRef.current?.injectJavaScript(`
  //       window.ReactNativeWebView.postMessage(
  //       JSON.stringify({
  //         action: 'open-url',
  //         payload: {
  //           url: location.href
  //         },
  //       }),
  //     )
  //       `)
  //   }
  // }, [dynamicOpenUrl, setDynamicOpenUrl])

  useEffect(() => {
    if (reloadUerProfile) {
      webViewRef.current?.injectJavaScript(`
        window.location.reload();
      `);
    }
  }, [reloadUerProfile, webViewRef]);

  return (
    <View className="flex-1">
      <WebView
        className="flex-1"
        key={webViewKey}
        source={{ uri: `https://m.bilibili.com/space/${upId}` }}
        originWhitelist={["http://*", "https://*", "bilibili://*"]}
        allowsFullscreenVideo
        injectedJavaScriptForMainFrameOnly
        allowsInlineMediaPlayback
        startInLoadingState
        pullToRefreshEnabled
        // applicationNameForUserAgent={'BILIBILI/8.0.0'}
        // allowsBackForwardNavigationGestures
        mediaPlaybackRequiresUserAction={false}
        webviewDebuggingEnabled={__DEV__}
        injectedJavaScript={""}
        injectedJavaScriptBeforeContentLoaded={injectCode} // injectCode
        renderLoading={() => <LoadingComp />}
        onNavigationStateChange={(navState) => {
          currentNavigationStateRef.current = {
            canGoBack: navState.canGoBack,
            title: navState.title,
            url: navState.url,
          };
        }}
        userAgent="Mozilla/5.0 (Linux; Android 13; M2012K11AC Build/TKQ1.220829.002) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.7151.115 Mobile Safari/537.36"
        ref={webViewRef}
        onMessage={(evt) => {
          if (handleWebViewMessage(evt.nativeEvent.data)) {
            return;
          }

          const data = parseDynamicWebViewMessage(evt.nativeEvent.data);
          if (!data) {
            return;
          }

          if (data.action === "reload-dynamic-page") {
            webViewRef.current?.reload();
          } else if (data.action === "open-video") {
            const { av, title, mid, name, face } = data.payload;
            const bvid = av2bv(av);

            navigation.navigate("Play", {
              // aid: data.aid,
              bvid: bvid,
              title: title,
              mid,
              name,
              face,
              // title: data.title,
              // desc: data.desc,
              // mid: data.mid,
              // face: data.face,
              // name: data.name,
              // cover: data.cover,
              // date: data.date,
              // tag: data.tag,
              // video: data,
            });
          } else if (data.action === "share-content") {
            const { link, texts } = data.payload;
            Share.share({
              message: (texts.length > 100 ? texts.slice(0, 100) + "..." : texts) + "\n" + link,
            });
          } else if (data.action === "open-dynamic-detail") {
            const { url, title } = data.payload;
            navigation.navigate("DynamicDetail", { url, title });
          } else if (data.action === "open-topic") {
            const { url, title } = data.payload;
            navigation.navigate("WebPage", { url, title });
          }
        }}
        onLoad={() => {}}
        onError={() => {
          showToast("UP动态加载失败");
        }}
        onShouldStartLoadWithRequest={(request) => {
          if (!request.url.startsWith("http")) {
            return false;
          }
          if (request.url.split("?")[0].endsWith(".apk")) {
            return false;
          }
          const forbiddenUrls = ["data.bilibili.com"];
          if (
            forbiddenUrls.some((v) => {
              return request.url.includes(v);
            })
          ) {
            return false;
          }
          return true;
        }}
        onRenderProcessGone={handleRenderProcessGone}
        onContentProcessDidTerminate={handleContentProcessDidTerminate}
      />
    </View>
  );
}

export default Dynamic;
