import { Text, View } from "react-native";

import { formatPlaybackTime } from "./player-helpers";

type PlayerSeekHintProps = {
  /**
   * 滑动调整后的目标播放进度（毫秒）
   */
  targetMs: number;
  /**
   * 本次滑动的调整秒数，正数快进、负数后退
   */
  deltaSeconds: number;
};

/**
 * 左右滑动调整进度时的浮层提示：目标时间 + 本次调整的方向与秒数
 */
export default function PlayerSeekHint(props: PlayerSeekHintProps) {
  const { targetMs, deltaSeconds } = props;

  return (
    <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
      <View className="items-center rounded bg-black/60 px-3 py-2">
        <Text className="text-base font-bold tabular-nums text-white">
          {formatPlaybackTime(targetMs / 1000)}
        </Text>
        <Text className="text-xs text-white/80">
          {deltaSeconds >= 0 ? `快进 ${deltaSeconds} 秒` : `后退 ${-deltaSeconds} 秒`}
        </Text>
      </View>
    </View>
  );
}
