import React from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import type { DanmakuItem } from "@/api/danmaku.types";
import useLatest from "@/hooks/useLatest";

import {
  DANMAKU_DEFAULT_FONTSIZE,
  isDanmakuLayoutFresh,
  mergeDanmakuItems,
  resolveDanmakuAnimation,
  resolveDanmakuLayout,
  selectVisibleDanmaku,
  type DanmakuLayout,
  type DanmakuRenderItem,
} from "./danmaku-track";
import { useDanmakuFeed } from "./use-danmaku-feed";

type DanmakuOverlayProps = {
  cid: number;
  enabled: boolean;
  isPlaying: boolean;
  currentTimeMs: number;
  /**
   * 弹幕从这一刻开始渲染，更早的弹幕不再补画（跳转、续播、开关弹幕时更新）
   */
  anchorTimeMs: number;
  /**
   * 播放倍速，弹幕位移跟随倍速
   */
  playbackRate: number;
  width: number;
  height: number;
  fontSize?: number;
  /**
   * 本地回显的弹幕（自己刚发送的那条），与网络弹幕共用轨道避免重叠
   */
  localItems?: DanmakuItem[];
};

// 默认值保持同一引用，避免每次渲染都重算轨道表
const EMPTY_LOCAL_ITEMS: DanmakuItem[] = [];
const EMPTY_VISIBLE_ITEMS: DanmakuRenderItem[] = [];

// 轨道表只取决于弹幕数据与容器尺寸，与播放进度无关，因此可以按数据缓存
const layoutCache = new WeakMap<DanmakuItem[], DanmakuLayout>();
const mergeCache = new WeakMap<
  DanmakuItem[],
  { localItems: DanmakuItem[]; items: DanmakuItem[] }
>();

function getDanmakuLayout(
  items: DanmakuItem[],
  containerWidth: number,
  containerHeight: number,
  fontSize: number,
) {
  const cached = layoutCache.get(items);
  if (cached && isDanmakuLayoutFresh(cached, { containerWidth, containerHeight, fontSize })) {
    return cached;
  }
  const layout = resolveDanmakuLayout(items, { containerWidth, containerHeight, fontSize });
  layoutCache.set(items, layout);
  return layout;
}

function getDanmakuItems(items: DanmakuItem[], localItems: DanmakuItem[]) {
  if (localItems.length === 0) {
    return items;
  }
  const cached = mergeCache.get(items);
  if (cached && cached.localItems === localItems) {
    return cached.items;
  }
  const merged = mergeDanmakuItems(items, localItems);
  mergeCache.set(items, { localItems, items: merged });
  return merged;
}

function DanmakuItemView(props: {
  item: DanmakuRenderItem;
  isPlaying: boolean;
  playbackRate: number;
}) {
  const { item, isPlaying, playbackRate } = props;
  // 挂载时按当前播放进度定位，暂停状态下进入的弹幕也能停在正确位置
  const [translateX] = React.useState(() => new Animated.Value(item.currentX));
  const itemRef = useLatest(item);

  React.useEffect(() => {
    if (!isPlaying) {
      translateX.stopAnimation();
      return;
    }

    const latest = itemRef.current;
    const animationState = resolveDanmakuAnimation(latest, playbackRate);
    // 原生动画在 App 进入后台时可能停止；恢复时必须先对齐最新媒体时间。
    translateX.setValue(animationState.startX);
    if (animationState.durationMs === 0) {
      translateX.setValue(animationState.endX);
      return;
    }

    const animation = Animated.timing(translateX, {
      toValue: animationState.endX,
      // 剩余行程按播放倍速折算成真实时间，长按加速时弹幕同步变快
      duration: animationState.durationMs,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    animation.start();

    return () => {
      animation.stop();
    };
  }, [translateX, isPlaying, playbackRate, itemRef]);

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
  const { cid, enabled, isPlaying, currentTimeMs, anchorTimeMs, playbackRate, width, height } =
    props;
  const fontSize = props.fontSize ?? DANMAKU_DEFAULT_FONTSIZE;
  const localItems = props.localItems ?? EMPTY_LOCAL_ITEMS;
  const { items } = useDanmakuFeed({ cid, enabled, currentTimeMs });

  const mergedItems = getDanmakuItems(items, localItems);
  const layout = getDanmakuLayout(mergedItems, width, height, fontSize);
  const visibleItems =
    enabled && width > 0 && height > 0
      ? selectVisibleDanmaku(mergedItems, layout, { currentTimeMs, anchorTimeMs })
      : EMPTY_VISIBLE_ITEMS;

  if (!enabled) {
    return null;
  }

  // 容器尺寸变化（切全屏、旋转）后重建弹幕视图，避免残留旧坐标
  const geometryKey = `${width}x${height}x${fontSize}`;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {visibleItems.map((item) => (
        <DanmakuItemView
          key={`${item.key}#${geometryKey}`}
          item={item}
          isPlaying={isPlaying}
          playbackRate={playbackRate}
        />
      ))}
    </View>
  );
}
