import "../global.css";

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import NetInfo from "@react-native-community/netinfo";
import { StatusBar } from "expo-status-bar";
import { AppState } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
// import { RootSiblingParent } from 'react-native-root-siblings'
import { SWRConfig } from "swr";
import type { ProviderConfiguration, SWRConfiguration } from "swr/_internal";

import fetcher from "./api/fetcher";
import ButtonsOverlay from "./components/ButtonsOverlay";
import ErrorFallback from "./components/ErrorFallback";
import ImagesView from "./components/ImageViewer";
import {
  BilibiliBlacklistManager,
  BilibiliFollowingsManager,
  CheckAppUpdate,
  CheckNetState,
  FollowingDynamicsUnreadManager,
  FollowingDynamicsUpdatesManager,
  LiveUpsManager,
  UserDataManager,
  VideoDownloadManager,
  WatchLaterManager,
  WatchProgressManager,
} from "./components/managers";
import { MenuProvider, menuProviderCustomStyles } from "./components/Menu";
import useAppOrientation from "./hooks/useAppOrientation";
import { ThemeProvider } from "./hooks/useTheme";
import Route from "./routes/Index";
import ErrorBoundary from "react-native-error-boundary";
import { InitStoreComp } from "./store";

let online = true;
const focus = true;

const SWRConfigValue: SWRConfiguration & Partial<ProviderConfiguration> = {
  fetcher,
  errorRetryCount: 2,
  errorRetryInterval: 1000,
  dedupingInterval: 5000,
  isVisible() {
    return focus;
  },
  isOnline() {
    return online;
  },
  initFocus(callback) {
    let appState = AppState.currentState;

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      online = nextAppState === "active";
      if (appState.match(/inactive|background/) && online) {
        callback();
      }
      appState = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  },
  initReconnect(callback) {
    return NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        online = true;
        callback();
      } else {
        online = false;
      }
    });
  },
};

export default function App() {
  useAppOrientation();
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <SWRConfig value={SWRConfigValue}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <MenuProvider backHandler customStyles={menuProviderCustomStyles}>
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                {/* sheet 内容通过 portal 渲染，放在 MenuProvider/ErrorBoundary 里面才能继承它们的 context */}
                <BottomSheetModalProvider>
                  <InitStoreComp />
                  <BilibiliFollowingsManager />
                  <BilibiliBlacklistManager />
                  <UserDataManager />
                  <CheckAppUpdate />
                  <CheckNetState />
                  <LiveUpsManager />
                  <FollowingDynamicsUpdatesManager />
                  <FollowingDynamicsUnreadManager />
                  <WatchLaterManager />
                  <WatchProgressManager />
                  <VideoDownloadManager />
                  <ButtonsOverlay />
                  <ImagesView />
                  <Route />
                </BottomSheetModalProvider>
              </ErrorBoundary>
            </MenuProvider>
            <StatusBar style="auto" />
          </GestureHandlerRootView>
        </SWRConfig>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
