import type { DanmakuItem } from "./danmaku.types";

/**
 * 弹幕接口 /x/v2/dm/web/seg.so 返回 protobuf（DmSegMobileReply），
 * 这里手写最小解码器，避免引入 protobufjs 与 schema 文件。
 *
 * DmSegMobileReply: repeated DanmakuElem elems = 1
 * DanmakuElem: 1 id / 2 progress / 3 mode / 4 fontsize / 5 color / 6 midHash / 7 content / 9 weight ...
 */

const WIRE_VARINT = 0;
const WIRE_FIXED64 = 1;
const WIRE_LENGTH_DELIMITED = 2;
const WIRE_FIXED32 = 5;

const FIELD_ELEMS = 1;
const FIELD_PROGRESS = 2;
const FIELD_MODE = 3;
const FIELD_FONTSIZE = 4;
const FIELD_COLOR = 5;
const FIELD_CONTENT = 7;

const DANMAKU_SCROLL_MODES: number[] = [1, 2, 3];
const DEFAULT_FONTSIZE = 25;
const DEFAULT_COLOR = 0xffffff;

type Varint = {
  value: number;
  next: number;
};

function readVarint(bytes: Uint8Array, offset: number): Varint | null {
  let value = 0;
  let scale = 1;
  let position = offset;

  while (position < bytes.length) {
    const byte = bytes[position];
    position += 1;
    value += (byte & 0x7f) * scale;
    if ((byte & 0x80) === 0) {
      return { value, next: position };
    }
    scale *= 128;
    // 弹幕 id 是 64 位整数，允许到 2^63（只做跳过与取小字段，不要求精确值）
    if (scale > 2 ** 63) {
      return null;
    }
  }

  return null;
}

/**
 * 只需要展示中文与常见字符，这里手写 UTF-8 解码，避免依赖 TextDecoder
 */
export function decodeUtf8(bytes: Uint8Array, start: number, end: number): string {
  let result = "";
  let position = start;

  while (position < end) {
    const first = bytes[position];
    position += 1;

    if (first < 0x80) {
      result += String.fromCharCode(first);
      continue;
    }

    let codePoint = 0;
    let extraBytes = 0;

    if ((first & 0xe0) === 0xc0) {
      codePoint = first & 0x1f;
      extraBytes = 1;
    } else if ((first & 0xf0) === 0xe0) {
      codePoint = first & 0x0f;
      extraBytes = 2;
    } else if ((first & 0xf8) === 0xf0) {
      codePoint = first & 0x07;
      extraBytes = 3;
    } else {
      continue;
    }

    if (position + extraBytes > end) {
      break;
    }

    for (let index = 0; index < extraBytes; index += 1) {
      codePoint = (codePoint << 6) | (bytes[position] & 0x3f);
      position += 1;
    }

    if (codePoint > 0xffff) {
      const offset = codePoint - 0x10000;
      result += String.fromCharCode(0xd800 + (offset >> 10), 0xdc00 + (offset & 0x3ff));
    } else {
      result += String.fromCharCode(codePoint);
    }
  }

  return result;
}

function skipField(
  bytes: Uint8Array,
  position: number,
  end: number,
  wireType: number,
): number | null {
  if (wireType === WIRE_VARINT) {
    return readVarint(bytes, position)?.next ?? null;
  }
  if (wireType === WIRE_LENGTH_DELIMITED) {
    const length = readVarint(bytes, position);
    if (!length) {
      return null;
    }
    const next = length.next + length.value;
    return next > end ? null : next;
  }
  if (wireType === WIRE_FIXED64) {
    const next = position + 8;
    return next > end ? null : next;
  }
  if (wireType === WIRE_FIXED32) {
    const next = position + 4;
    return next > end ? null : next;
  }
  return null;
}

function decodeDanmakuElem(bytes: Uint8Array, start: number, end: number): DanmakuItem | null {
  let progressMs = 0;
  let mode = -1;
  let fontsize = DEFAULT_FONTSIZE;
  let color = DEFAULT_COLOR;
  let content = "";
  let position = start;

  while (position < end) {
    const key = readVarint(bytes, position);
    if (!key) {
      return null;
    }
    position = key.next;

    const field = Math.floor(key.value / 8);
    const wireType = key.value % 8;

    if (wireType === WIRE_LENGTH_DELIMITED) {
      const length = readVarint(bytes, position);
      if (!length) {
        return null;
      }
      const contentStart = length.next;
      const contentEnd = contentStart + length.value;
      if (contentEnd > end) {
        return null;
      }
      if (field === FIELD_CONTENT) {
        content = decodeUtf8(bytes, contentStart, contentEnd);
      }
      position = contentEnd;
      continue;
    }

    if (wireType === WIRE_VARINT) {
      const value = readVarint(bytes, position);
      if (!value) {
        return null;
      }
      position = value.next;
      if (field === FIELD_PROGRESS) {
        progressMs = value.value;
      } else if (field === FIELD_MODE) {
        mode = value.value;
      } else if (field === FIELD_FONTSIZE) {
        fontsize = value.value;
      } else if (field === FIELD_COLOR) {
        color = value.value;
      }
      continue;
    }

    const next = skipField(bytes, position, end, wireType);
    if (next === null) {
      return null;
    }
    position = next;
  }

  if (!content || !DANMAKU_SCROLL_MODES.includes(mode)) {
    return null;
  }

  return { progressMs, content, color, fontsize };
}

/**
 * 解码一个弹幕分段，只返回滚动弹幕；数据非法时返回已成功解析的部分
 */
export function decodeDanmakuSegment(input: Uint8Array): DanmakuItem[] {
  const items: DanmakuItem[] = [];
  let position = 0;

  while (position < input.length) {
    const key = readVarint(input, position);
    if (!key) {
      break;
    }
    position = key.next;

    const field = Math.floor(key.value / 8);
    const wireType = key.value % 8;

    if (wireType === WIRE_LENGTH_DELIMITED) {
      const length = readVarint(input, position);
      if (!length) {
        break;
      }
      const start = length.next;
      const end = start + length.value;
      if (end > input.length) {
        break;
      }
      if (field === FIELD_ELEMS) {
        const item = decodeDanmakuElem(input, start, end);
        if (item) {
          items.push(item);
        }
      }
      position = end;
      continue;
    }

    const next = skipField(input, position, input.length, wireType);
    if (next === null) {
      break;
    }
    position = next;
  }

  return items;
}
