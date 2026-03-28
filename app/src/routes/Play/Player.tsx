import { type RouteProp, useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { Image as ExpoImage } from "@/components/styled/expo";
import { CheckBox } from "@/components/styled/rneui";
import * as KeepAwake from "expo-keep-awake";
import React from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import WebView, { type WebViewMessageEvent } from "react-native-webview";

import { useVideoMp4Url } from "@/api/play-url";
import { UA } from "@/constants";
import { colors } from "@/constants/colors.tw";
import { useMarkVideoWatched } from "@/store/actions";
import type { NavigationProps, RootStackParamList } from "@/types";

import { useVideoInfo } from "../../api/video-info";
import { useAppStateChange } from "../../hooks/useAppState";
import { useStore } from "../../store";
import { parseDuration, parseImgUrl, showToast } from "../../utils";
import { INJECTED_JAVASCRIPT } from "./inject-play";

const PlayUrl = "https://www.bilibili.com/blackboard/html5mobileplayer.html";

type PlayerMessage = {
  action?: string;
  payload?: unknown;
};

type PlayerErrorType = "play-url" | "webview";

function Player(props: { currentPage: number; onPlayEnded: () => void }) {
  const { getIsWiFi, imagesList } = useStore();
  const route = useRoute<RouteProp<RootStackParamList, "Play">>();
  const { width, height } = useWindowDimensions();
  const [verticalExpand, setVerticalExpand] = React.useState(false);
  const { data } = useVideoInfo(route.params.bvid);
  const isWifi = getIsWiFi();

  const [loadPlayer, setLoadPlayer] = React.useState(isWifi);
  const [highQuality, setHighQuality] = React.useState(isWifi);
  const [playerErrorType, setPlayerErrorType] = React.useState<PlayerErrorType | null>(null);
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [webViewKey, setWebViewKey] = React.useState(0);

  const loadingErrorRef = React.useRef(false);
  const webviewRef = React.useRef<WebView | null>(null);
  const videoInfo = {
    ...route.params,
    ...data,
  };
  const cid = videoInfo.pages ? videoInfo.pages[props.currentPage - 1].cid : 0;
  const { videoUrl, error: playUrlError, retry: retryVideoUrl } = useVideoMp4Url(
    videoInfo.bvid,
    cid,
    highQuality,
  );
  const markVideoWatched = useMarkVideoWatched();

  const [isEnded, setIsEnded] = React.useState(true);
  const handleRetry = async () => {
    if (isRetrying) {
      return;
    }

    setPlayerErrorType(null);
    setIsRetrying(true);
    loadingErrorRef.current = false;

    try {
      await retryVideoUrl();
    } catch {}

    if (webviewRef.current && videoUrl) {
      webviewRef.current.reload();
    }
    setWebViewKey((key) => key + 1);
    setIsRetrying(false);
  };

  /**
   * hasimg  play -> imagepause
   *         pause -> nothing
   * noimg   imagepause -> play
   */
  React.useEffect(() => {
    webviewRef.current?.injectJavaScript(`
    ;(function() {
      const video = document.querySelector('video');
      if (video) {
        if (${imagesList.length > 0}) {
          if (!video.paused) {
            video.pause();
            video.dataset.imgPaused = 'true'
          }
        } else {
          if (video.dataset.imgPaused === 'true') {
            video.play();
            video.dataset.imgPaused = ''
          }
        }
      }
    })();
    true;
    `);
  }, [imagesList.length]);

  React.useEffect(() => {
    if (!loadPlayer) {
      return;
    }

    setPlayerErrorType(null);
    setIsRetrying(false);
    loadingErrorRef.current = false;
  }, [cid, highQuality, loadPlayer]);

  React.useEffect(() => {
    if (!loadPlayer || !playUrlError) {
      return;
    }

    setPlayerErrorType("play-url");
    setIsRetrying(false);
    loadingErrorRef.current = true;
  }, [loadPlayer, playUrlError]);

  useAppStateChange((currentAppState) => {
    if (currentAppState === "active" && loadingErrorRef.current) {
      void handleRetry();
    }
    if (currentAppState !== "active") {
      KeepAwake.deactivateKeepAwake("PLAY");
    }
  });

  const navigation = useNavigation<NavigationProps["navigation"]>();

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        KeepAwake.deactivateKeepAwake("PLAY");
      };
    }, []),
  );

  React.useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      e.preventDefault();
      webviewRef.current?.injectJavaScript(`
      window.reportPlayTime();
      true;
      `);
      setTimeout(() => {
        navigation.dispatch(e.data.action);
      });
    });
    return unsubscribe;
  }, [navigation]);

  let videoWidth = 0;
  let videoHeight = 0;
  if (videoInfo?.width && videoInfo?.height) {
    if (videoInfo.rotate) {
      videoWidth = videoInfo.height;
      videoHeight = videoInfo.width;
    } else {
      videoWidth = videoInfo.width;
      videoHeight = videoInfo.height;
    }
  }
  const isVerticalVideo = videoWidth < videoHeight;
  let videoViewHeight = width * 0.6;
  if (loadPlayer && videoWidth && videoHeight) {
    if (isEnded) {
      videoViewHeight = width * 0.6;
    } else {
      if (isVerticalVideo) {
        videoViewHeight = verticalExpand ? height * 0.66 : height * 0.33;
      } else {
        videoViewHeight = (videoHeight / videoWidth) * width + 26;
      }
    }
  }
  const handleMessage = (evt: WebViewMessageEvent) => {
    try {
      const eventData = JSON.parse(evt.nativeEvent.data) as PlayerMessage;
      if (eventData.action === "playState") {
        setIsEnded(eventData.payload === "ended");
        if (eventData.payload === "play") {
          KeepAwake.activateKeepAwakeAsync("PLAY");
        } else if (eventData.payload === "ended" || eventData.payload === "pause") {
          KeepAwake.deactivateKeepAwake("PLAY");
        }
        if (eventData.payload === "ended") {
          setVerticalExpand(false);
          props.onPlayEnded();
        }
        // 'play', 'ended', 'pause', 'waiting', 'playing'
      }
      if (eventData.action === "change-video-height") {
        if (!isEnded) {
          setVerticalExpand(eventData.payload === "down");
        }
      }
      if (eventData.action === "reload") {
        void handleRetry();
      }
      if (eventData.action === "showToast") {
        if (typeof eventData.payload === "string") {
          showToast(eventData.payload);
        }
      }
      if (eventData.action === "reportPlayTime") {
        if (
          videoInfo.name &&
          videoInfo.cover &&
          videoInfo.date &&
          videoInfo.duration &&
          videoInfo.mid &&
          typeof eventData.payload === "number"
        ) {
          markVideoWatched(
            {
              bvid: videoInfo.bvid,
              cover: videoInfo.cover,
              date: videoInfo.date,
              duration: videoInfo.duration,
              mid: videoInfo.mid,
              name: videoInfo.name,
              title: videoInfo.title,
            },
            eventData.payload,
          );
        }
      }
      // if (eventData.action === 'updateUrlSettled') {
      // }
      if (eventData.action === "console.log") {
        if (__DEV__) {
          // oxlint-disable-next-line no-console
          console.log("message", eventData.payload);
        }
      }
    } catch {}
  };
  const renderPlayerBackground = (children?: React.ReactNode) => {
    if (videoInfo?.cover) {
      return (
        <ImageBackground
          source={{ uri: parseImgUrl(videoInfo.cover, 672, 420) }}
          resizeMode="cover"
          className="flex-1 items-center justify-center"
        >
          <View className="absolute inset-0 bg-black/30" />
          {children}
        </ImageBackground>
      );
    }

    return <View className="flex-1 items-center justify-center bg-black">{children}</View>;
  };
  const renderLoading = () => (
    <View className="absolute h-full w-full">
      {renderPlayerBackground(
        playerErrorType ? null : (
          <ActivityIndicator
            size={"large"}
            colorClassName={colors.secondary.accent}
            className="scale-150"
          />
        ),
      )}
    </View>
  );

  let playPageUrl: string | undefined;
  if (videoUrl && loadPlayer) {
    const search = new URLSearchParams();
    Object.entries({
      bvid: videoInfo.bvid,
      cid,
      isOutside: true,
      // quality: isWifi ? 64 : 32,
      // portraitFullScreen: true,
      // highQuality: isWifi ? 1 : 0,
      p: props.currentPage,
      autoplay: 1, // isWifi ? 0 : 1,
      hasMuteButton: true,
    }).forEach(([k, v]) => {
      if (v !== undefined) {
        search.append(k, `${v}`);
      }
    });
    playPageUrl = `${PlayUrl}?${search}#${encodeURIComponent(videoUrl)}`;
  }

  // React.useEffect(() => {
  //   if (playPageUrl && webviewRef.current) {
  //     webviewRef.current.injectJavaScript(`location.href="${playPageUrl}"`)
  //   }
  // }, [playPageUrl])

  const errorInfo =
    playerErrorType === "play-url"
      ? {
          title: "视频加载失败",
          description: "播放地址获取失败，请稍后重试",
        }
      : {
          title: "播放器加载失败",
          description: "播放器初始化失败，请点击重试",
        };
  const player = !loadPlayer ? (
    <Pressable
      onPress={() => {
        setLoadPlayer(true);
      }}
      className="flex-1"
    >
      {videoInfo?.cover ? (
        <ImageBackground
          source={{ uri: parseImgUrl(videoInfo.cover, 500, 312) }}
          resizeMode="cover"
          className="flex-1 items-center justify-center"
        >
          <ExpoImage
            source={require("../../../assets/play.png")}
            className="h-16 w-16 opacity-80"
          />
          <View className="absolute bottom-2 left-2 flex-row gap-2">
            {videoInfo?.duration ? (
              <Text className="rounded bg-gray-900/60 px-2 py-0.5 font-bold text-white">
                {parseDuration(videoInfo?.duration)}
              </Text>
            ) : null}
            {isWifi ? null : (
              <Text className="rounded bg-gray-900/60 px-2 py-[2px] font-bold text-white">
                播放将消耗流量
              </Text>
            )}
          </View>

          <View className="absolute bottom-2 right-2">
            <CheckBox
              checked={highQuality}
              title="高清"
              textClassName="text-white"
              wrapperClassName="rounded bg-gray-900/60 py-[2px] px-2 text-white font-bold"
              checkedColorClassName={colors.secondary.accent}
              uncheckedColor={"white"}
              size={18}
              containerClassName="bg-transparent p-0 m-0"
              onPress={() => {
                setHighQuality(!highQuality);
              }}
            />
          </View>
        </ImageBackground>
      ) : null}
    </Pressable>
  ) : playPageUrl ? (
    <WebView
      source={{
        // uri: 'player.bilibili.com/player.html?isOutside=true&aid=116255201697323&bvid=BV1NLw1zoECS&cid=36813670314&p=1', // playPageUrl,
        uri: playPageUrl,
      }}
      key={`${cid}-${highQuality ? "hq" : "sq"}-${webViewKey}`}
      ref={webviewRef}
      className="flex-1 bg-black"
      originWhitelist={["https://*", "bilibili://*"]}
      allowsFullscreenVideo
      injectedJavaScriptForMainFrameOnly
      allowsInlineMediaPlayback
      startInLoadingState
      userAgent={UA}
      mediaPlaybackRequiresUserAction={false}
      injectedJavaScript={INJECTED_JAVASCRIPT}
      renderLoading={renderLoading}
      onMessage={handleMessage}
      webviewDebuggingEnabled={__DEV__}
      onContentProcessDidTerminate={() => {
        webviewRef.current?.reload();
      }}
      onLoad={() => {
        loadingErrorRef.current = false;
        setPlayerErrorType(null);
        setIsRetrying(false);
      }}
      onError={() => {
        if (!loadingErrorRef.current) {
          showToast("当前视频加载失败/(ㄒoㄒ)/~~");
        }
        loadingErrorRef.current = true;
        setPlayerErrorType("webview");
        setIsRetrying(false);
      }}
      onHttpError={() => {
        if (!loadingErrorRef.current) {
          showToast("当前视频加载失败/(ㄒoㄒ)/~~");
        }
        loadingErrorRef.current = true;
        setPlayerErrorType("webview");
        setIsRetrying(false);
      }}
      onShouldStartLoadWithRequest={(request) => {
        // Only allow navigating within this website
        if (request.url.endsWith("/log-reporter.js")) {
          return false;
        }
        if (request.url.startsWith("http") && !request.url.includes(".apk")) {
          return true;
        }
        return false;
      }}
    />
  ) : (
    renderPlayerBackground(
      playerErrorType ? null : (
        <ActivityIndicator
          size={"large"}
          colorClassName={colors.secondary.accent}
          className="scale-150"
        />
      ),
    )
  );
  return (
    <View
      renderToHardwareTextureAndroid
      className="relative w-full shrink-0 overflow-hidden bg-black"
      style={{ height: videoViewHeight }}
    >
      {player}
      {loadPlayer && playerErrorType ? (
        <View className="absolute inset-0">
          {renderPlayerBackground(
            <View className="items-center gap-3 px-8">
              <Text className="text-xl font-bold text-white">{errorInfo.title}</Text>
              <Text className="text-center text-sm leading-6 text-white/80">
                {errorInfo.description}
              </Text>
              <Pressable
                className={
                  isRetrying
                    ? "mt-2 rounded-full bg-sky-400/60 px-6 py-3"
                    : "mt-2 rounded-full bg-sky-500 px-6 py-3"
                }
                disabled={isRetrying}
                onPress={() => {
                  void handleRetry();
                }}
              >
                <Text className="font-bold text-white">{isRetrying ? "重试中..." : "重试"}</Text>
              </Pressable>
            </View>,
          )}
        </View>
      ) : null}
    </View>
  );
}

export default Player;
