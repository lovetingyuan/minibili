import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { NavigationContext } from "@react-navigation/native";
import React from "react";
import { BackHandler } from "react-native";

import useLatest from "@/hooks/useLatest";

import type { BottomSheetProps } from "./bottom-sheet.types";
import { SheetBackdrop, SheetBackdropConfig } from "./SheetBackdrop";
import useBottomSheetThemeStyles from "./useBottomSheetThemeStyles";

const DEFAULT_BACKDROP_OPACITY = 0.5;

export function BottomSheet(props: BottomSheetProps) {
  const modalRef = React.useRef<BottomSheetModal>(null);
  // 只在自己 present 过以后才 dismiss，避免 gorhom 内部状态被留在 DISMISSING
  const presentedRef = React.useRef(false);
  const onCloseRef = useLatest(props.onClose);
  const themeStyles = useBottomSheetThemeStyles();
  // sheet 内容会被 portal 重新挂到 PortalHost 下，屏幕级 context 在这条链路上是断的，
  // 所以要把当前屏幕的 navigation 一起带进 portal，sheet 里的 useNavigation/useIsFocused
  // 才能拿到屏幕导航对象（容器 ref 没有 push）。
  const screenNavigation = React.useContext(NavigationContext);

  React.useEffect(() => {
    if (props.visible) {
      presentedRef.current = true;
      modalRef.current?.present();
      return;
    }
    if (presentedRef.current) {
      presentedRef.current = false;
      modalRef.current?.dismiss();
    }
  }, [props.visible]);

  // 原生弹窗换成 portal 后不再有 Modal 的 onRequestClose，返回键需要自己收口
  React.useEffect(() => {
    if (!props.visible) {
      return;
    }
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      onCloseRef.current();
      return true;
    });
    return () => {
      subscription.remove();
    };
  }, [props.visible, onCloseRef]);

  function handleDismiss() {
    presentedRef.current = false;
    onCloseRef.current();
  }

  return (
    <SheetBackdropConfig opacity={props.backdropOpacity ?? DEFAULT_BACKDROP_OPACITY}>
      <BottomSheetModal
        ref={modalRef}
        snapPoints={props.snapPoints}
        enableDynamicSizing={false}
        enablePanDownToClose
        // 内容区是可滚动的 FlashList，交给它自己处理手势，sheet 只响应把手拖拽
        enableContentPanningGesture={false}
        keyboardBehavior="interactive"
        // 键盘收起（返回键/失焦）时把 sheet 放回原吸附点，否则会停在临时位置上
        keyboardBlurBehavior="restore"
        // Android 侧键盘是覆盖窗口而不是压缩窗口（edge-to-edge），只能由 sheet 自己上移
        android_keyboardInputMode="adjustPan"
        enableBlurKeyboardOnGesture
        onDismiss={handleDismiss}
        backdropComponent={SheetBackdrop}
        backgroundStyle={themeStyles.background}
        handleStyle={themeStyles.handle}
        handleIndicatorStyle={themeStyles.handleIndicator}
      >
        <NavigationContext.Provider value={screenNavigation}>
          {props.children}
        </NavigationContext.Provider>
      </BottomSheetModal>
    </SheetBackdropConfig>
  );
}
