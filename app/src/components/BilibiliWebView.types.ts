import type { ComponentPropsWithRef } from "react";
import type WebView from "react-native-webview";

export type BilibiliWebViewProps = ComponentPropsWithRef<typeof WebView>;

export type BilibiliWebViewPreparation = {
  ready: boolean;
  error: string | null;
};
