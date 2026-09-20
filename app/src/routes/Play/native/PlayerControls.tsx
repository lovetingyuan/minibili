import { Icon } from "@/components/styled/rneui";
import { colors } from "@/constants/colors.tw";
import useResolvedColor from "@/hooks/useResolvedColor";
import React from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

import { formatPlaybackTime, resolvePlaybackDisplayMs } from "./player-helpers";
import type { PlaybackRate } from "./playback-rate";
import PlayerTopActions from "./PlayerTopActions";

/**
 * 控件显示/隐藏的淡入淡出时长
 */
const CONTROLS_FADE_DURATION_MS = 200;

// Animated.View 需要额外包一层才能识别 className
const StyledAnimatedView = withUniwind(Animated.View) as unknown as React.ComponentType<
  React.ComponentProps<typeof Animated.View> & { className?: string }
>;

type PlayerControlsProps = {
  /**
   * 是否稳定处于暂停态（缓冲、seek 造成的短暂暂停不算，见 usePlayerPausedUi）
   */
  paused: boolean;
  /**
   * 播放是否已经结束（不会自动继续播放）。结束时进度对齐总时长，
   * 避免最后一次 timeUpdate 停在总时长前一秒造成 03:31/03:32 的显示
   */
  ended: boolean;
  currentTimeMs: number;
  durationMs: number;
  playbackRate: PlaybackRate;
  danmakuEnabled: boolean;
  /**
   * 未登录 B站 时不展示发送弹幕按钮
   */
  canSendDanmaku: boolean;
  /**
   * 退到后台（含息屏）后是否继续播放
   */
  backgroundPlayEnabled: boolean;
  loopEnabled: boolean;
  autoNextEnabled: boolean;
  showAutoNext: boolean;
  fullscreen: boolean;
  visible: boolean;
  onTogglePlay: () => void;
  onPlaybackRateChange: (rate: PlaybackRate) => void;
  onToggleDanmaku: () => void;
  onSendDanmaku: () => void;
  onToggleBackgroundPlay: () => void;
  onToggleLoop: () => void;
  onToggleAutoNext: () => void;
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

/**
 * 使用单个汉字代替图标，字形大小与同尺寸图标保持一致
 */
function CharacterButton(props: {
  character: string;
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
      <Text
        className="text-center font-medium"
        style={{ color: props.color, fontSize: props.size, lineHeight: props.size + 2 }}
      >
        {props.character}
      </Text>
    </Pressable>
  );
}

export default function PlayerControls(props: PlayerControlsProps) {
  const { paused, danmakuEnabled, fullscreen, visible } = props;
  const accentColor = useResolvedColor(colors.secondary.text) ?? "#ff6699";
  const insets = useSafeAreaInsets();
  const [trackWidth, setTrackWidth] = React.useState(0);
  const [scrubMs, setScrubMs] = React.useState<number | null>(null);
  const [playbackRateMenuOpen, setPlaybackRateMenuOpen] = React.useState(false);
  const scrubRef = React.useRef<number | null>(null);
  const [opacity] = React.useState(() => new Animated.Value(visible ? 1 : 0));

  const durationMs = Math.max(1, props.durationMs);
  const displayMs = resolvePlaybackDisplayMs({
    currentMs: props.currentTimeMs,
    durationMs,
    ended: props.ended,
    scrubMs,
  });
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

  React.useEffect(() => {
    if (!visible) {
      setPlaybackRateMenuOpen(false);
    }
  }, [visible]);

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
    <>
      {/* 右上角：后台播放开关与发送弹幕，与底部控件同步显隐；全屏时避让状态栏与刘海 */}
      <StyledAnimatedView
        className="absolute left-0 right-0 top-0 flex-row justify-end px-3"
        style={{ opacity, paddingTop: fullscreen ? Math.max(insets.top, 8) : 8 }}
        pointerEvents={visible ? "box-none" : "none"}
        accessibilityElementsHidden={!visible}
        importantForAccessibility={visible ? "auto" : "no-hide-descendants"}
      >
        <PlayerTopActions
          playbackRate={props.playbackRate}
          playbackRateMenuOpen={playbackRateMenuOpen}
          loopEnabled={props.loopEnabled}
          autoNextEnabled={props.autoNextEnabled}
          showAutoNext={props.showAutoNext}
          backgroundPlayEnabled={props.backgroundPlayEnabled}
          canSendDanmaku={props.canSendDanmaku}
          onTogglePlaybackRateMenu={() => {
            props.onInteraction();
            setPlaybackRateMenuOpen((open) => !open);
          }}
          onClosePlaybackRateMenu={() => {
            setPlaybackRateMenuOpen(false);
          }}
          onPlaybackRateChange={(rate) => {
            setPlaybackRateMenuOpen(false);
            press(() => {
              props.onPlaybackRateChange(rate);
            });
          }}
          onToggleBackgroundPlay={() => {
            press(props.onToggleBackgroundPlay);
          }}
          onToggleLoop={() => {
            press(props.onToggleLoop);
          }}
          onToggleAutoNext={() => {
            press(props.onToggleAutoNext);
          }}
          onSendDanmaku={() => {
            press(props.onSendDanmaku);
          }}
        />
      </StyledAnimatedView>
      <StyledAnimatedView
        className="absolute bottom-0 left-0 right-0 bg-black/40 px-3 pb-1 pt-1"
        style={{ opacity }}
        pointerEvents={visible ? "auto" : "none"}
        accessibilityElementsHidden={!visible}
        importantForAccessibility={visible ? "auto" : "no-hide-descendants"}
      >
        <View className="flex-row items-center gap-2">
          <ControlButton
            name={paused ? "play" : "pause"}
            label={paused ? "播放" : "暂停"}
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
          <Text
            className="min-w-[84px] text-center text-xs tabular-nums text-white"
            numberOfLines={1}
          >
            {`${formatPlaybackTime(displayMs / 1000)}/${formatPlaybackTime(durationMs / 1000)}`}
          </Text>
          <CharacterButton
            character="弹"
            label={danmakuEnabled ? "关闭弹幕" : "打开弹幕"}
            size={14}
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
    </>
  );
}
