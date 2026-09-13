import React from "react";
import { Gesture } from "react-native-gesture-handler";

import {
  type PlayerSwipeDirection,
  PLAYER_SWIPE_ACTIVE_OFFSET_Y,
  PLAYER_SWIPE_FAIL_OFFSET_X,
  resolveVerticalSwipe,
} from "./player-helpers";

type PlayerGestureOptions = {
  onSingleTap: () => void;
  onDoubleTap: () => void;
  onLongPressStart: () => void;
  onLongPressEnd: () => void;
  onVerticalSwipe: (direction: PlayerSwipeDirection) => void;
};

/**
 * 单击继续播放、双击暂停、长按加速。
 * 手势只创建一次（组件会随播放时间频繁重渲染，重建手势会打断进行中的长按），
 * 回调统一从 ref 读取最新实现。
 */
export function usePlayerGestures(options: PlayerGestureOptions) {
  const optionsRef = React.useRef(options);

  React.useEffect(() => {
    optionsRef.current = options;
  });

  const [gesture] = React.useState(() => {
    const singleTap = Gesture.Tap()
      .runOnJS(true)
      .maxDuration(250)
      .onEnd(() => {
        optionsRef.current.onSingleTap();
      });
    const doubleTap = Gesture.Tap()
      .runOnJS(true)
      .numberOfTaps(2)
      .maxDelay(250)
      .maxDuration(250)
      .onEnd(() => {
        optionsRef.current.onDoubleTap();
      });
    const longPress = Gesture.LongPress()
      .runOnJS(true)
      .minDuration(500)
      .onStart(() => {
        optionsRef.current.onLongPressStart();
      })
      .onFinalize(() => {
        optionsRef.current.onLongPressEnd();
      });
    // 竖向滑动切换播放器高度，横向偏移过大时判定为其他手势
    const verticalSwipe = Gesture.Pan()
      .runOnJS(true)
      .activeOffsetY([-PLAYER_SWIPE_ACTIVE_OFFSET_Y, PLAYER_SWIPE_ACTIVE_OFFSET_Y])
      .failOffsetX([-PLAYER_SWIPE_FAIL_OFFSET_X, PLAYER_SWIPE_FAIL_OFFSET_X])
      .onEnd((event) => {
        const direction = resolveVerticalSwipe({
          translationX: event.translationX,
          translationY: event.translationY,
        });
        if (direction) {
          optionsRef.current.onVerticalSwipe(direction);
        }
      });

    return Gesture.Race(Gesture.Exclusive(doubleTap, singleTap), longPress, verticalSwipe);
  });

  return gesture;
}
