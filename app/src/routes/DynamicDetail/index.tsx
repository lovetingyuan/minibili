import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
// import { Text } from '@/components/styled/rneui'
// import { ResizeMode, Video } from 'expo-av'
import React from "react";
import { BackHandler, Image, Linking, Platform, View } from "react-native";
import BilibiliWebView from "@/components/BilibiliWebView";
import { Text } from "@/components/styled/rneui";
import UpName from "@/components/UpName";

// import useLiveUrl from '@/api/get-live-url'
import { useRecoverableWebView } from "@/hooks/useRecoverableWebView";
import useUpdateNavigationOptions from "@/hooks/useUpdateNavigationOptions";

import type { RootStackParamList } from "../../types";
import { showToast } from "../../utils";
import HeaderRight from "./HeaderRight";
import { INJECTED_JAVASCRIPT, INJECTED_JAVASCRIPT_BEFORE } from "./inject-code";

function Loading() {
  return (
    <View className="absolute h-full w-full items-center justify-center">
      <Image
        source={require("../../../assets/video-loading.png")}
        resizeMode="center"
        className="w-full"
      />
    </View>
  );
}

type Props = NativeStackScreenProps<RootStackParamList, "DynamicDetail">;

const MOBILE_CHROME_UA =
  "Mozilla/5.0 (Linux; Android 13; M2012K11AC Build/TKQ1.220829.002) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.7151.115 Mobile Safari/537.36";

type DynamicDetailOpenImageMessage = {
  action: "open-image";
  payload: {
    url: string;
  };
};

function isOpenImageMessage(data: unknown): data is DynamicDetailOpenImageMessage {
  if (typeof data !== "object" || data === null || !("action" in data)) {
    return false;
  }

  if (data.action !== "open-image" || !("payload" in data)) {
    return false;
  }

  const { payload } = data;
  return (
    typeof payload === "object" &&
    payload !== null &&
    "url" in payload &&
    typeof payload.url === "string"
  );
}

function DynamicDetailPage({ route }: Props) {
  const { title, url } = route.params;

  const {
    webViewRef,
    webViewKey,
    remountWebView,
    handleWebViewMessage,
    handleRenderProcessGone,
    handleContentProcessDidTerminate,
  } = useRecoverableWebView();
  // const [pageTitle, setPageTitle] = React.useState(`${name}的动态`)
  function onRefresh() {
    return new Promise<void>((r) => {
      remountWebView();
      setTimeout(r, 1000);
    });
  }

  useUpdateNavigationOptions({
    headerRight: () => {
      return <HeaderRight reload={onRefresh} />;
    },
    headerTitle: () => (
      <Text className="text-lg font-semibold" numberOfLines={1}>
        <UpName mid={route.params.user?.mid} className="text-lg font-semibold">
          {route.params.user?.name || title}
        </UpName>
        {route.params.user ? "的动态" : ""}
      </Text>
    ),
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
    React.useCallback(() => {
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

  return (
    <BilibiliWebView
      className="flex-1"
      source={{ uri: url }}
      key={webViewKey}
      originWhitelist={["http://*", "https://*", "bilibili://*"]}
      allowsFullscreenVideo
      injectedJavaScriptForMainFrameOnly
      allowsInlineMediaPlayback
      startInLoadingState
      // allowsBackForwardNavigationGestures
      mediaPlaybackRequiresUserAction={false}
      webviewDebuggingEnabled={__DEV__}
      injectedJavaScript={INJECTED_JAVASCRIPT}
      injectedJavaScriptBeforeContentLoaded={INJECTED_JAVASCRIPT_BEFORE}
      renderLoading={() => <Loading />}
      userAgent={MOBILE_CHROME_UA}
      ref={webViewRef}
      onNavigationStateChange={(navState) => {
        currentNavigationStateRef.current = {
          canGoBack: navState.canGoBack,
          title: navState.title,
          url: navState.url,
        };
      }}
      onRenderProcessGone={handleRenderProcessGone}
      onContentProcessDidTerminate={handleContentProcessDidTerminate}
      onMessage={(evt) => {
        if (handleWebViewMessage(evt.nativeEvent.data)) {
          return;
        }

        const data = JSON.parse(evt.nativeEvent.data) as unknown;
        if (isOpenImageMessage(data)) {
          const { url } = data.payload;
          Linking.openURL(url);
        }
      }}
      onLoad={() => {}}
      onError={() => {
        showToast("加载失败");
      }}
      onShouldStartLoadWithRequest={(request) => {
        if (request.url.startsWith("bilibili://")) {
          // Linking.openURL(request.url).catch(err => {
          //   __DEV__ && console.error(err)
          // })
          return false;
        }
        if (request.url.includes(".apk")) {
          return false;
        }
        return true;
      }}
    />
  );
}

export default DynamicDetailPage;
