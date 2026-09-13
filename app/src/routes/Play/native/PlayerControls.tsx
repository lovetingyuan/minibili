import { Icon } from "@/components/styled/rneui";
import { colors } from "@/constants/colors.tw";
import useResolvedColor from "@/hooks/useResolvedColor";
import React from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { withUniwind } from "uniwind";

import { formatPlaybackTime } from "./player-helpers";

/**
 * 控件显示/隐藏的淡入淡出时长
 */
const CONTROLS_FADE_DURATION_MS = 200;

// Animated.View 需要额外包一层才能识别 className
const StyledAnimatedView = withUniwind(Animated.View) as unknown as React.ComponentType<
  React.ComponentProps<typeof Animated.View> & { className?: string }
>;

type PlayerControlsProps = {
  isPlaying: boolean;
  currentTimeMs: number;
  durationMs: number;
  danmakuEnabled: boolean;
  fullscreen: boolean;
  visible: boolean;
  onTogglePlay: () => void;
  onToggleDanmaku: () => void;
  onToggleFullscreen: () => void;
  onSeek: (timeMs: number) => void;
  /**
   * 任意控件操作时调用，用于重置自动隐藏计时
   */
  onInteraction: () => void;
};

function ControlButton(props: {
  name: string;
  label: string;
  color: string;
  size: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.label}
      hitSlop={10}
      className="px-1 py-1"
      onPress={props.onPress}
    >
      <Icon name={props.name} type="material-design" size={props.size} color={props.color} />
    </Pressable>
  );
}

export default function PlayerControls(props: PlayerControlsProps) {
  const { isPlaying, danmakuEnabled, fullscreen, visible } = props;
  const accentColor = useResolvedColor(colors.secondary.text) ?? "#ff6699";
  const [trackWidth, setTrackWidth] = React.useState(0);
  const [scrubMs, setScrubMs] = React.useState<number | null>(null);
  const scrubRef = React.useRef<number | null>(null);
  const [opacity] = React.useState(() => new Animated.Value(visible ? 1 : 0));

  const durationMs = Math.max(1, props.durationMs);
  const displayMs = scrubMs ?? props.currentTimeMs;
  const progress = Math.min(1, Math.max(0, displayMs / durationMs));

  React.useEffect(() => {
    const animation = Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: CONTROLS_FADE_DURATION_MS,
      useNativeDriver: true,
    });
    animation.start();
    return () => {
      animation.stop();
    };
  }, [opacity, visible]);

  // 拖动过程会不断重渲染，手势只创建一次，参数从 ref 读取
  const scrubParamsRef = React.useRef({
    trackWidth,
    durationMs,
    onSeek: props.onSeek,
    onInteraction: props.onInteraction,
  });
  React.useEffect(() => {
    scrubParamsRef.current = {
      trackWidth,
      durationMs,
      onSeek: props.onSeek,
      onInteraction: props.onInteraction,
    };
  });

  const [scrubGesture] = React.useState(() => {
    function update(x: number) {
      const params = scrubParamsRef.current;
      if (params.trackWidth <= 0) {
        return;
      }
      const value = Math.min(1, Math.max(0, x / params.trackWidth)) * params.durationMs;
      scrubRef.current = value;
      setScrubMs(value);
    }

    return Gesture.Pan()
      .runOnJS(true)
      .minDistance(0)
      .onBegin((event) => {
        scrubParamsRef.current.onInteraction();
        update(event.x);
      })
      .onUpdate((event) => {
        update(event.x);
      })
      .onFinalize(() => {
        const value = scrubRef.current;
        scrubRef.current = null;
        setScrubMs(null);
        if (value !== null) {
          scrubParamsRef.current.onSeek(value);
          scrubParamsRef.current.onInteraction();
        }
      });
  });

  function press(action: () => void) {
    props.onInteraction();
    action();
  }

  return (
    <StyledAnimatedView
      className="absolute bottom-0 left-0 right-0 bg-black/40 px-3 pb-1 pt-1"
      style={{ opacity }}
      pointerEvents={visible ? "auto" : "none"}
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? "auto" : "no-hide-descendants"}
    >
      <View className="flex-row items-center gap-2">
        <ControlButton
          name={isPlaying ? "pause" : "play"}
          label={isPlaying ? "暂停" : "播放"}
          size={26}
          color="#ffffff"
          onPress={() => {
            press(props.onTogglePlay);
          }}
        />
        <GestureDetector gesture={scrubGesture}>
          <View
            className="h-7 flex-1 justify-center"
            onLayout={(event) => {
              setTrackWidth(event.nativeEvent.layout.width);
            }}
          >
            <View className="h-[3px] w-full rounded bg-white/30">
              <View
                className="h-[3px] rounded bg-pink-400"
                style={{ width: `${progress * 100}%` }}
              />
            </View>
            <View
              className="absolute top-2 h-3 w-3 rounded-full bg-pink-400"
              style={{ left: Math.max(0, progress * trackWidth - 6) }}
            />
          </View>
        </GestureDetector>
        <Text className="min-w-[84px] text-center text-xs tabular-nums text-white" numberOfLines={1}>
          {`${formatPlaybackTime(displayMs / 1000)}/${formatPlaybackTime(durationMs / 1000)}`}
        </Text>
        <ControlButton
          name={danmakuEnabled ? "comment-text-outline" : "comment-off-outline"}
          label={danmakuEnabled ? "关闭弹幕" : "打开弹幕"}
          size={22}
          color={danmakuEnabled ? accentColor : "#ffffff"}
          onPress={() => {
            press(props.onToggleDanmaku);
          }}
        />
        <ControlButton
          name={fullscreen ? "fullscreen-exit" : "fullscreen"}
          label={fullscreen ? "退出全屏" : "全屏"}
          size={24}
          color="#ffffff"
          onPress={() => {
            press(props.onToggleFullscreen);
          }}
        />
      </View>
    </StyledAnimatedView>
  );
}
