import { expect, test } from "vitest";

import { stripEmTags } from "./html";

test("removes keyword highlight tags and keeps the surrounding text", () => {
  expect(stripEmTags('<em class="keyword">原神</em>攻略')).toBe("原神攻略");
  expect(
    stripEmTags('【<em class="keyword">我的世界</em>】<em class="keyword">原神</em>材质包'),
  ).toBe("【我的世界】原神材质包");
  expect(stripEmTags('前<em class="keyword" >中</em>后')).toBe("前中后");
  expect(stripEmTags("<EM>大写</EM>")).toBe("大写");
  expect(stripEmTags("<em>无属性</em>")).toBe("无属性");
});

test("decodes html entities so the title matches the video detail api", () => {
  expect(stripEmTags("A&amp;B")).toBe("A&B");
  expect(stripEmTags("&quot;引号&quot;")).toBe('"引号"');
  expect(stripEmTags("it&#39;s")).toBe("it's");
  expect(stripEmTags("&lt;标签&gt;")).toBe("<标签>");
  expect(stripEmTags('<em class="keyword">原神</em>攻略&amp;')).toBe("原神攻略&");
});

test("leaves other text untouched", () => {
  expect(stripEmTags("普通标题 1<2 且 3 > 2")).toBe("普通标题 1<2 且 3 > 2");
  expect(stripEmTags("<emotion>不是高亮标签</emotion>")).toBe("<emotion>不是高亮标签</emotion>");
  expect(stripEmTags("")).toBe("");
});
