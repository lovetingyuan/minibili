import NetInfo from "@react-native-community/netinfo";
import { useIsFocused } from "@react-navigation/native";
import { useVideoPlayer } from "expo-video";
import React from "react";
import { AppState } from "react-native";

import useLiveUrl from "@/api/get-live-url";
import { useAppStateChange } from "@/hooks/useAppState";
import useLatest from "@/hooks/useLatest";
import { showToast } from "@/utils";
import { createLiveBackgroundPlayer } from "./live-background-player";
import type { LiveWebViewMessage, UseLiveBackgroundPlaybackOptions } from "./live-playback.types";

export function useLiveBackgroundPlayback(options: UseLiveBackgroundPlaybackOptions) {
  const [requested, setRequested] = React.useState(false);
  const { data, error, refresh } = useLiveUrl(requested ? options.roomId : "");
  const latest = useLatest({ ...options, refresh });
  const focused = useIsFocused();
  const player = useVideoPlayer(null, (currentPlayer) => {
    currentPlayer.audioMixingMode = "auto";
    currentPlayer.muted = true;
  });
  const controllerRef = React.useRef<ReturnType<typeof createLiveBackgroundPlayer> | null>(null);

  // 在 useVideoPlayer 的被动卸载清理释放原生对象前，先停止播放并移除监听。
  React.useLayoutEffect(() => {
    const controller = createLiveBackgroundPlayer({
      player,
      roomId: options.roomId,
      title: options.title,
      appState: AppState.currentState,
      refresh: () => latest.current.refresh(),
      onStatus: (status) => setRequested(status !== "off"),
      onError: showToast,
      sendCommand(command) {
        try {
          latest.current.webViewRef.current?.injectJavaScript(
            `window.__minibiliLivePlayback?.update(${JSON.stringify(command)});true;`,
          );
        } catch {
          // 网页重建时由 live-page-ready 消息重新同步；原生服务独立运行。
        }
      },
    });
    controllerRef.current = controller;
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected === true && state.isInternetReachable !== false;
      if (state.isConnected !== null) {
        controller.setNetworkConnected(connected);
      }
    });
    return () => {
      unsubscribe();
      controller.dispose();
      controllerRef.current = null;
    };
  }, [player, options.roomId, options.title, latest]);

  React.useEffect(() => {
    if (data) {
      controllerRef.current?.setSources(data);
    }
    if (error) {
      controllerRef.current?.addressFetchFailed();
    }
  }, [data, error, requested]);

  React.useEffect(() => {
    if (!focused) {
      controllerRef.current?.setEnabled(false);
    }
  }, [focused]);

  useAppStateChange((state) => controllerRef.current?.setAppState(state));

  function handlePlaybackMessage(message: LiveWebViewMessage) {
    if (message.action === "update-live-info" || message.roomId !== options.roomId) {
      return false;
    }
    if (message.action === "background-play") {
      controllerRef.current?.setEnabled(message.enabled && focused);
    } else if (message.action === "live-mute") {
      if (focused) {
        controllerRef.current?.setMuted(message.muted);
      }
    } else if (message.action === "live-playback-state") {
      controllerRef.current?.updateSnapshot(message.payload);
    } else {
      controllerRef.current?.syncWebPage();
    }
    return true;
  }

  return { handlePlaybackMessage };
}
