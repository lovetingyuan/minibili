import { View } from 'react-native';

import { theme } from "@/constants/theme";

/** 看过一点点也要能看见，进度条最小画这么宽（百分比） */
const MIN_VISIBLE_PERCENT = 2;

/** 封面底部的观看进度条，比例无效或不大于 0 时不渲染 */
export function WatchProgressBar(props: { ratio: number }) {
  const { ratio } = props;
  if (!Number.isFinite(ratio) || ratio <= 0) {
    return null;
  }
  const percent = Math.min(100, Math.max(MIN_VISIBLE_PERCENT, Math.round(ratio * 100)));
  return (
    <View className="absolute bottom-0 left-0 h-1 w-full overflow-hidden bg-gray-900/40">
      <View className={`h-full ${theme.primary.bg}`} style={{ width: `${percent}%` }} />
    </View>
  );
}
