import { useBackHandler } from "@react-native-community/hooks";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Text } from "@/components/styled/rneui";
import UpName from "@/components/UpName";
import { useVideoPlayer, VideoView } from "expo-video";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import BilibiliWebView from "@/components/BilibiliWebView";
import { withUniwind } from "uniwind";

import bilibiliFetch from "@/api/bilibili-fetch";
import useLiveUrl from "@/api/get-live-url";
import { colors } from "@/constants/colors.tw";
import { useLiveUpsRefresh } from "@/hooks/useLiveUpsRefresh";
import { useRecoverableWebView } from "@/hooks/useRecoverableWebView";
import useUpdateNavigationOptions from "@/hooks/useUpdateNavigationOptions";

import { UA } from "../../constants";
import type { RootStackParamList } from "../../types";
import { showToast } from "../../utils";
import HeaderRight from "./HeaderRight";
import { INJECTED_JAVASCRIPT, INJECTED_JAVASCRIPT_BEFORE } from "./inject-code";

function Loading() {
  return (
    <View className="absolute h-full w-full items-center justify-center">
      <ActivityIndicator
        accessibilityLabel="直播间加载中"
        size="large"
        colorClassName={colors.secondary.accent}
      />
    </View>
  );
}

type Props = NativeStackScreenProps<RootStackParamList, "Living">;
const StyledVideoView = withUniwind(VideoView) as unknown as React.ComponentType<
  React.ComponentProps<typeof VideoView> & { className?: string }
>;

type LiveWebViewMessage =
  | {
      action: "enable-background-play";
    }
  | {
      action: "update-live-info";
      payload: {
        url: string;
        callback: string;
      };
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseUpdateLiveInfoPayload(data: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch {
    return null;
  }

  if (isRecord(parsed) && typeof parsed.url === "string" && typeof parsed.callback === "string") {
    return {
      url: parsed.url,
      callback: parsed.callback,
    };
  }

  return null;
}

function parseLiveWebViewMessage(data: string): LiveWebViewMessage | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch {
    return null;
  }

  if (!isRecord(parsed) || typeof parsed.action !== "string") {
    return null;
  }

  if (parsed.action === "enable-background-play") {
    return {
      action: parsed.action,
    };
  }

  if (parsed.action === "update-live-info" && typeof parsed.payload === "string") {
    const payload = parseUpdateLiveInfoPayload(parsed.payload);
    if (!payload) {
      return null;
    }

    return {
      action: parsed.action,
      payload,
    };
  }

  return null;
}

function LiveWebPage({ route }: Props) {
  const { url, title: pageTitle } = route.params;

  const {
    webViewRef,
    webViewKey,
    remountWebView,
    handleWebViewMessage,
    handleRenderProcessGone,
    handleContentProcessDidTerminate,
  } = useRecoverableWebView();
  // 返回时直播状态可能已变化，补查一次直播列表
  useLiveUpsRefresh();
  // const [pageTitle, setPageTitle] = React.useState(title)

  useUpdateNavigationOptions({
    headerRight: () => (
      <HeaderRight
        reload={() => {
          remountWebView();
        }}
      />
    ),
    headerTitle: () => (
      <Text className="text-lg font-semibold" numberOfLines={1}>
        <UpName mid={route.params.user?.mid} className="text-lg font-semibold">
          {route.params.user?.name || pageTitle}
        </UpName>
        {route.params.user ? "的直播间" : ""}
      </Text>
    ),
  });
  const [enableBackgroundPlay, setEnableBackgroundPlay] = React.useState(false);
  const roomId = url.startsWith("https://live.bilibili.com/h5/") ? url.split("/")[4] : "";
  const liveUrls = useLiveUrl(enableBackgroundPlay ? roomId : "");
  const resolvedLiveUrls = liveUrls ?? [];
  const [validIndex, setValidIndex] = React.useState(1);
  const backPlay = enableBackgroundPlay && roomId && liveUrls?.length;
  const liveUrl = backPlay ? resolvedLiveUrls[validIndex] : "";
  const player = useVideoPlayer(
    liveUrl
      ? {
          uri: liveUrl,
          headers: {
            "user-agent": UA,
            origin: "https://live.bilibili.com",
            referer: "https://live.bilibili.com",
          },
        }
      : null,
    (currentPlayer) => {
      currentPlayer.audioMixingMode = "doNotMix";
      currentPlayer.staysActiveInBackground = true;
      currentPlayer.showNowPlayingNotification = true;
      currentPlayer.play();
    },
  );

  React.useEffect(() => {
    const subscription = player.addListener("statusChange", ({ error, status }) => {
      if (status !== "error" || !liveUrl) {
        return;
      }

      showToast(`抱歉出错了${error?.message ?? ""}`);
      if (validIndex < resolvedLiveUrls.length - 1) {
        setValidIndex((index) => index + 1);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [liveUrl, player, resolvedLiveUrls.length, validIndex]);

  useBackHandler(() => {
    if (backPlay) {
      // handle it
      setEnableBackgroundPlay(false);
      return true;
    }
    // let the default thing happen
    return false;
  });

  if (backPlay) {
    return (
      <View className="relative flex flex-1">
        <StyledVideoView
          player={player}
          nativeControls
          contentFit="contain"
          className="min-h-96 h-full w-full"
        />
        <View className="absolute left-2 top-2 flex-row items-center gap-4">
          {/* <Button
            title={' 返回 '}
            size="sm"
            onPress={() => {
              setEnableBackgroundPlay(false)
            }}
          /> */}
          <Text>当前支持后台播放</Text>
        </View>
      </View>
    );
  }
  return (
    <BilibiliWebView
      className="flex-1"
      // style={{ height }}
      source={{ uri: url }}
      key={webViewKey}
      // onScroll={(e) => setEnabled(e.nativeEvent.contentOffset.y === 0)}
      originWhitelist={["http://*", "https://*", "bilibili://*"]}
      allowsFullscreenVideo
      injectedJavaScriptForMainFrameOnly
      allowsInlineMediaPlayback
      startInLoadingState
      pullToRefreshEnabled
      applicationNameForUserAgent={"BILIBILI/8.0.0"}
      // allowsBackForwardNavigationGestures
      mediaPlaybackRequiresUserAction={false}
      webviewDebuggingEnabled={__DEV__}
      injectedJavaScript={INJECTED_JAVASCRIPT}
      injectedJavaScriptBeforeContentLoaded={INJECTED_JAVASCRIPT_BEFORE}
      renderLoading={() => <Loading />}
      userAgent=""
      ref={webViewRef}
      onMessage={(evt) => {
        if (handleWebViewMessage(evt.nativeEvent.data)) {
          return;
        }

        const data = parseLiveWebViewMessage(evt.nativeEvent.data);
        if (!data) {
          return;
        }

        if (data.action === "enable-background-play") {
          setEnableBackgroundPlay(true);
        }

        if (data.action === "update-live-info") {
          const { url, callback } = data.payload;
          bilibiliFetch(url, {
            headers: { "user-agent": UA },
          })
            .then((r) => r.text())
            .then((html) => {
              const index = html.indexOf("__NEPTUNE_IS_MY_WAIFU__=");
              const html2 = html.substring(index);
              const index2 = html2.indexOf("</script>");
              const html3 = html2.substring(0, index2);
              webViewRef.current?.injectJavaScript(`window.${callback}(${html3});`);
            });
        }
      }}
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
      onRenderProcessGone={handleRenderProcessGone}
      onContentProcessDidTerminate={handleContentProcessDidTerminate}
    />
  );
}

export default LiveWebPage;
