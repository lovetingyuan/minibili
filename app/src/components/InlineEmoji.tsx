import { Image } from "@/components/styled/expo";
import { getImagePixelSize, parseImgUrl } from "@/utils";

import type { InlineEmojiProps } from "./inline-emoji.types";

// 文字视觉中线相对基线的位置（em），中英文取近似值
const TEXT_OPTICAL_CENTER_RATIO = 0.35;

// 表情两侧的空白间隔
const SIDE_GAP = 4;

// 行内图片的底边默认与文字基线对齐，图片比文字高时就会显得偏上
export function getInlineEmojiOffset(size: number, fontSize: number) {
  const offset = size / 2 - fontSize * TEXT_OPTICAL_CENTER_RATIO;
  return Math.round(offset * 2) / 2;
}

// 表情图片是正方形，用更宽的容器配合 contain 让它水平居中，两侧自然留出空白
export function InlineEmoji({ url, size, fontSize }: InlineEmojiProps) {
  return (
    <Image
      contentFit="contain"
      source={{ uri: parseImgUrl(url, getImagePixelSize(size)) }}
      style={{
        height: size,
        width: size + SIDE_GAP * 2,
        transform: [{ translateY: getInlineEmojiOffset(size, fontSize) }],
      }}
    />
  );
}
