import { ThumbsUp } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { getInlineEmojiOffset } from "@/components/InlineEmoji";
import { ThemedIcon } from "@/components/ThemedIcon";
import { Text } from "@/components/styled/rneui";
import { theme } from "@/constants/theme";
import { parseNumber } from "@/utils";

import type { CommentLikeEntryProps } from "./comment.types";

const ICON_SIZE = 15;
// 正文是 15px，内联视图底边贴在正文基线上，比正文小的一行会整体偏高，往下压一点才和正文同一条视觉中线
const BASELINE_OFFSET = getInlineEmojiOffset(ICON_SIZE, 15);

// 点赞成功时左右各摆一次再回正，同时轻微放大回弹
const WIGGLE_DEGREE = 12;
const WIGGLE_SCALE = 1.15;
const WIGGLE_STEP_DURATION = 90;

/**
 * 评论正文末尾的内联点赞入口。
 *
 * 走 Text 的内联视图能力（Fabric 会用 TextInlineViewPlaceholderSpan 把子视图挂到文字流里），
 * 所以图标能像文字一样跟着正文换行，同时还能做 transform 动画。
 */
export function CommentLikeEntry(props: CommentLikeEntryProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const previous = useRef({ idStr: props.idStr, active: props.active });

  useEffect(() => {
    const previousState = previous.current;
    previous.current = { idStr: props.idStr, active: props.active };
    // 只在同一条评论「未点赞 -> 已点赞」时摇一次：首屏挂载、服务端重新校验、
    // 列表复用换到别的评论都不该误播，取消点赞也不播。
    if (previousState.idStr !== props.idStr || previousState.active || !props.active) {
      return;
    }
    rotation.value = withSequence(
      withTiming(-WIGGLE_DEGREE, { duration: WIGGLE_STEP_DURATION }),
      withTiming(WIGGLE_DEGREE, { duration: WIGGLE_STEP_DURATION * 1.2 }),
      withSpring(0, { damping: 14, stiffness: 220 }),
    );
    scale.value = withSequence(
      withTiming(WIGGLE_SCALE, { duration: WIGGLE_STEP_DURATION }),
      withSpring(1, { damping: 12, stiffness: 200 }),
    );
  }, [props.idStr, props.active, rotation, scale]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  // 已点赞但服务端返回 0 赞时只显示图标，不显示「0」
  const countText =
    props.count > 0 ? `${parseNumber(props.count)}${props.creatorLiked ? "+UP" : ""}` : "";

  return (
    <Pressable
      className={`flex-row items-center gap-0.5 ${props.pending ? "opacity-60" : ""}`}
      style={{ transform: [{ translateY: BASELINE_OFFSET }] }}
      accessibilityRole="button"
      accessibilityLabel={
        props.active ? `已点赞，点击取消点赞，点赞数 ${props.count}` : `点赞，点赞数 ${props.count}`
      }
      accessibilityState={{ selected: props.active, busy: props.pending, disabled: props.pending }}
      disabled={props.pending}
      // 左侧贴着正文，只往上下多给一点触摸区，避免误点到末尾正文时触发点赞
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
      onPress={props.onPress}
    >
      <Animated.View style={iconStyle}>
        <ThemedIcon
          icon={ThumbsUp}
          filled={props.active}
          size={ICON_SIZE}
          colorClassName={props.active ? theme.like.accent : theme.primary.accent}
        />
      </Animated.View>
      {countText ? (
        <Text
          className={`text-[13px] leading-4 font-normal ${
            props.active ? theme.like.text : theme.primary.text
          }`}
        >
          {countText}
        </Text>
      ) : null}
    </Pressable>
  );
}
