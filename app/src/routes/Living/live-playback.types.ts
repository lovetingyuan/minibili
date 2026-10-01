import type React from "react";
import type { VideoPlayer } from "expo-video";
import type { AppStateStatus } from "react-native";
import type WebView from "react-native-webview";
import type { LivePlayInfo } from "@/api/get-live-url.types";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/types";

export type LivePageProps = NativeStackScreenProps<RootStackParamList, "Living">;

export type WebPlaybackSnapshot = {
  playing: boolean;
  muted: boolean;
  volume: number;
};

export type LiveBackgroundStatus = "off" | "preparing" | "on";

export type LivePlaybackCommand = WebPlaybackSnapshot & {
  status: LiveBackgroundStatus;
  background: boolean;
};

export type LiveWebViewMessage =
  | { action: "background-play"; roomId: string; enabled: boolean }
  | { action: "live-mute"; roomId: string; muted: boolean }
  | { action: "live-playback-state"; roomId: string; payload: WebPlaybackSnapshot }
  | { action: "live-page-ready"; roomId: string }
  | { action: "update-live-info"; payload: { url: string; callback: string } };

export type LiveBackgroundPlayerOptions = {
  player: VideoPlayer;
  roomId: string;
  title: string;
  appState: AppStateStatus;
  refresh: () => Promise<LivePlayInfo | undefined>;
  onStatus: (status: LiveBackgroundStatus) => void;
  sendCommand: (command: LivePlaybackCommand) => void;
  onError: (message: string) => void;
};

export type UseLiveBackgroundPlaybackOptions = {
  roomId: string;
  title: string;
  webViewRef: React.RefObject<WebView | null>;
};
