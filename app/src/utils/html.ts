import he from "he";

/**
 * 只匹配 `<em>`、`<em class="keyword">`、`</em>`（兼容大小写与多余空格）。
 * 刻意不匹配 `<emotion>` 这类更长标签，避免误伤标题里的裸尖括号内容。
 */
const EM_TAG = /<em(?:\s[^>]*)?>|<\/em\s*>/gi;

/**
 * B站搜索接口会在命中的标题里插入 `<em class="keyword">关键词</em>` 高亮标记，
 * 搜索列表靠这些标记分段渲染高亮。传给其它页面（如播放页）时要去掉标记，
 * 并解码接口返回的 HTML 实体，得到与视频详情接口一致的纯文本标题。
 */
export function stripEmTags(text: string) {
  return he.decode(text.replace(EM_TAG, ""));
}
