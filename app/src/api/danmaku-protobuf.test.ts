import { expect, test } from "vitest";

import { decodeDanmakuSegment, decodeUtf8 } from "./danmaku-protobuf";

function fromHex(hex: string) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

/**
 * 按 DmSegMobileReply 的 elems(1) 字段包装成完整分段数据
 */
function wrapElems(elems: string[]) {
  const chunks: number[] = [];
  for (const hex of elems) {
    const bytes = fromHex(hex);
    chunks.push(0x0a, bytes.length, ...bytes);
  }
  return new Uint8Array(chunks);
}

// 真实响应 /x/v2/dm/web/seg.so 的前两个滚动弹幕元素
const REAL_ELEM_APPLE =
  "0880b69ca099fde59e1510d3ed011801201928ffffff07320836333437333532633a09e88bb9e69e9ce590a740beb896af06480a621331353330353436343737383432353034343438a2010130aa010130c80101d001c590adb705d80101";
const REAL_ELEM_GOOD =
  "0880fe90a084e1e69e1510fc82031801201928ffffff07320835343835343562613a09e79c9fe4b88de9949940d7bb96af064808621331353330353439393038313739303039323830a2010130aa010130c80101d001c590adb705d80101";

test("parses real danmaku segment elements", () => {
  const items = decodeDanmakuSegment(wrapElems([REAL_ELEM_APPLE, REAL_ELEM_GOOD]));

  expect(items).toEqual([
    { progressMs: 30419, content: "苹果吧", color: 0xffffff, fontsize: 25 },
    { progressMs: 49532, content: "真不错", color: 0xffffff, fontsize: 25 },
  ]);
});

test("keeps only scrolling danmaku", () => {
  // progress=100 mode=5(顶部弹幕) content=你好
  const top = "10641805" + "3a06e4bda0e5a5bd";
  // progress=200 mode=1 content=好
  const scroll = "10c8011801" + "3a03e5a5bd";

  expect(decodeDanmakuSegment(wrapElems([top, scroll]))).toEqual([
    { progressMs: 200, content: "好", color: 0xffffff, fontsize: 25 },
  ]);
});

test("tolerates shuffled fields and unknown fields", () => {
  const shuffled =
    // content 在前，随后是未知的定长字段(field15/wire5)、未知的长度字段(field10/wire2)
    "3a03e5a5bd" + "7d01020304" + "52026100" + "1801" + "102a";

  expect(decodeDanmakuSegment(wrapElems([shuffled]))).toEqual([
    { progressMs: 42, content: "好", color: 0xffffff, fontsize: 25 },
  ]);
});

test("returns parsed items without throwing on truncated data", () => {
  const buffer = wrapElems([REAL_ELEM_APPLE, REAL_ELEM_GOOD]);

  expect(decodeDanmakuSegment(buffer.slice(0, buffer.length - 3))).toEqual([
    { progressMs: 30419, content: "苹果吧", color: 0xffffff, fontsize: 25 },
  ]);
  expect(decodeDanmakuSegment(new Uint8Array())).toEqual([]);
});

test("decodes utf8 text including surrogate pairs", () => {
  const bytes = fromHex("f09f8e89e5a5bd");

  expect(decodeUtf8(bytes, 0, bytes.length)).toBe("🎉好");
});
