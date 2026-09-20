/**
 * B 站评论接口的 oid 是 64 位整数，动态 ID 目前有 19 位（例如 1249706685708107824），
 * 超过 JS 的安全整数范围，JSON.parse 会把它变成 1249706685708107800。
 * 点赞、回复、删除评论都要把 oid 回传给服务端，所以解析前先把 oid 转成字符串；
 * comments.schema 里 oid 声明为 string | number，两种形态都能通过校验。
 */
export function stringifyCommentOid(text: string) {
  return text.replaceAll(/"oid":(\d+)/g, (_, oid: string) => `"oid":"${oid}"`);
}
