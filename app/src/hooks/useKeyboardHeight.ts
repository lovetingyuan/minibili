import { useEffect, useState } from "react";
import { Keyboard, useWindowDimensions } from "react-native";

import { getKeyboardOverlap } from "./useKeyboardHeight.helpers";

const SHOW_EVENT = process.env.EXPO_OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
const HIDE_EVENT = process.env.EXPO_OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

/**
 * 键盘遮挡窗口底部的高度，键盘收起时为 0。
 *
 * 该值可直接作为贴底浮层的 paddingBottom，把内容整体抬到键盘上方
 * （仅在浮层底边与窗口底边对齐时成立）。
 */
export default function useKeyboardHeight() {
  const [height, setHeight] = useState(0);
  const { height: windowHeight } = useWindowDimensions();

  useEffect(() => {
    const showSubscription = Keyboard.addListener(SHOW_EVENT, (event) => {
      setHeight(getKeyboardOverlap(event.endCoordinates, windowHeight));
    });
    const hideSubscription = Keyboard.addListener(HIDE_EVENT, () => {
      setHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [windowHeight]);

  return height;
}
