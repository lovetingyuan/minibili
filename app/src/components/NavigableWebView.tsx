import { useIsFocused, useNavigation, usePreventRemove } from "@react-navigation/native";
import React from "react";
import { BackHandler } from "react-native";
import { WebView } from "react-native-webview";
import type { WebViewNavigation } from "react-native-webview";

import type { NavigableWebViewProps } from "./NavigableWebView.types";

export default function NavigableWebView({
  ref,
  onNavigationStateChange,
  ...props
}: NavigableWebViewProps) {
  const webViewRef = React.useRef<WebView | null>(null);
  const [canGoBack, setCanGoBack] = React.useState(false);
  const isFocused = useIsFocused();
  const navigation = useNavigation();
  const shouldHandleBack = isFocused && canGoBack;

  // 导航栏返回和原生返回手势同样优先回退网页。
  usePreventRemove(shouldHandleBack, ({ data }) => {
    if (
      data.action.type === "GO_BACK" ||
      data.action.type === "POP" ||
      data.action.type === "POP_TO" ||
      data.action.type === "POP_TO_TOP"
    ) {
      webViewRef.current?.goBack();
      return;
    }
    // replace/reset 等业务导航不应被网页历史阻挡。
    navigation.dispatch(data.action);
  });

  React.useEffect(() => {
    if (!shouldHandleBack) {
      return;
    }
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!webViewRef.current) {
        return false;
      }
      webViewRef.current.goBack();
      return true;
    });
    return () => subscription.remove();
  }, [shouldHandleBack]);

  function handleRef(instance: WebView | null) {
    webViewRef.current = instance;
    if (typeof ref === "function") {
      const cleanup = ref(instance);
      return () => {
        webViewRef.current = null;
        if (typeof cleanup === "function") {
          cleanup();
        } else {
          ref(null);
        }
      };
    }
    if (ref) {
      ref.current = instance;
    }
    return () => {
      webViewRef.current = null;
      if (ref) {
        ref.current = null;
      }
    };
  }

  function handleNavigationStateChange(state: WebViewNavigation) {
    setCanGoBack(state.canGoBack);
    onNavigationStateChange?.(state);
  }

  return (
    <WebView {...props} ref={handleRef} onNavigationStateChange={handleNavigationStateChange} />
  );
}
