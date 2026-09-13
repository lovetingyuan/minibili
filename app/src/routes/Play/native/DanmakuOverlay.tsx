import React from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import useLatest from "@/hooks/useLatest";

import {
  DANMAKU_DEFAULT_FONTSIZE,
  findDanmakuStartIndex,
  resolveDanmakuBatch,
  type DanmakuRenderItem,
} from "./danmaku-track";
import { useDanmakuFeed } from "./use-danmaku-feed";

type DanmakuOverlayProps = {
  cid: number;
  /**
   * 视频总时长（秒），用于计算分段数量
   */
  durationSeconds: number;
  enabled: boolean;
  isPlaying: boolean;
  currentTimeMs: number;
  /**
   * 播放进度跳变时自增，用于重置弹幕
   */
  seekToken: number;
  width: number;
  height: number;
  fontSize?: number;
};

type ConsumerState = {
  lanes: number[];
  nextIndex: number;
};

function resolveItemTranslateX(item: DanmakuRenderItem, currentTimeMs: number) {
  const elapsed = Math.min(item.durationMs, Math.max(0, currentTimeMs - item.startMs));
  return item.startX - (elapsed / item.durationMs) * item.travel;
}

function DanmakuItemView(props: {
  item: DanmakuRenderItem;
  isPlaying: boolean;
  currentTimeMs: number;
  onFinished: (key: string) => void;
}) {
  const { item, isPlaying, currentTimeMs } = props;
  // 挂载时按当前播放时间定位，暂停状态下进入的弹幕也能停在正确位置
  const [translateX] = React.useState(
    () => new Animated.Value(resolveItemTranslateX(item, currentTimeMs)),
  );
  const currentTimeRef = useLatest(currentTimeMs);
  const onFinishedRef = useLatest(props.onFinished);

  React.useEffect(() => {
    if (!isPlaying) {
      translateX.stopAnimation();
      return;
    }

    const elapsed = Math.min(item.durationMs, Math.max(0, currentTimeRef.current - item.startMs));
    const animation = Animated.timing(translateX, {
      toValue: item.startX - item.travel,
      duration: Math.max(16, item.durationMs - elapsed),
      easing: Easing.linear,
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) {
        onFinishedRef.current(item.key);
      }
    });

    return () => {
      animation.stop();
    };
  }, [translateX, item, isPlaying, currentTimeRef, onFinishedRef]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: 0,
        top: item.top,
        transform: [{ translateX }],
      }}
    >
      <Text
        style={{
          color: item.color,
          fontSize: item.fontSize,
          textShadowColor: "rgba(0, 0, 0, 0.85)",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 2,
        }}
      >
        {item.content}
      </Text>
    </Animated.View>
  );
}

export default function DanmakuOverlay(props: DanmakuOverlayProps) {
  const { cid, durationSeconds, enabled, isPlaying, currentTimeMs, width, height } = props;
  const fontSize = props.fontSize ?? DANMAKU_DEFAULT_FONTSIZE;
  const { items, resetToken } = useDanmakuFeed({ cid, durationSeconds, enabled, currentTimeMs });

  const [activeItems, setActiveItems] = React.useState<DanmakuRenderItem[]>([]);
  const consumerRef = React.useRef<ConsumerState>({ lanes: [], nextIndex: 0 });
  const itemsRef = useLatest(items);
  const currentTimeRef = useLatest(currentTimeMs);

  // 切分P、跳转、开关弹幕、分段乱序补拉时重新定位
  const resetKey = `${cid}-${props.seekToken}-${resetToken}-${enabled ? 1 : 0}`;
  React.useEffect(() => {
    consumerRef.current = {
      lanes: [],
      nextIndex: findDanmakuStartIndex(itemsRef.current, currentTimeRef.current),
    };
    setActiveItems([]);
  }, [resetKey, itemsRef, currentTimeRef]);

  React.useEffect(() => {
    if (!enabled || width <= 0 || height <= 0) {
      return;
    }

    const consumer = consumerRef.current;
    const result = resolveDanmakuBatch(items, consumer.nextIndex, consumer.lanes, {
      currentTimeMs,
      containerWidth: width,
      containerHeight: height,
      fontSize,
    });
    consumer.lanes = result.lanes;
    consumer.nextIndex = result.nextIndex;

    if (result.items.length > 0) {
      setActiveItems((previous) => [...previous, ...result.items]);
    }
  }, [currentTimeMs, items, enabled, width, height, fontSize]);

  React.useEffect(() => {
    setActiveItems((previous) => {
      const next = previous.filter((item) => item.startMs + item.durationMs > currentTimeMs - 500);
      return next.length === previous.length ? previous : next;
    });
  }, [currentTimeMs]);

  function handleItemFinished(key: string) {
    setActiveItems((previous) => previous.filter((item) => item.key !== key));
  }

  if (!enabled) {
    return null;
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {activeItems.map((item) => (
        <DanmakuItemView
          key={item.key}
          item={item}
          isPlaying={isPlaying}
          currentTimeMs={currentTimeMs}
          onFinished={handleItemFinished}
        />
      ))}
    </View>
  );
}
