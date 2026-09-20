import { expect, test } from "vitest";

import { stringifyCommentOid } from "./comment-json.helpers";

test("stringifies oid so 64-bit ids survive JSON.parse", () => {
  const text = '{"oid":1249706685708107824,"rpid":317945292720,"root":0}';

  expect(JSON.parse(stringifyCommentOid(text))).toEqual({
    oid: "1249706685708107824",
    rpid: 317945292720,
    root: 0,
  });
});

test("stringifies every oid occurrence and leaves string oids untouched", () => {
  const text = '{"oid":1249706685708107824,"reply":{"oid":1249706685708107824},"v":{"oid":"7"}}';

  expect(stringifyCommentOid(text)).toBe(
    '{"oid":"1249706685708107824","reply":{"oid":"1249706685708107824"},"v":{"oid":"7"}}',
  );
});

test("only rewrites the oid field", () => {
  const text = '{"aid":1249706685708107824,"oid":228138377,"sub_oid":1}';

  expect(stringifyCommentOid(text)).toBe(
    '{"aid":1249706685708107824,"oid":"228138377","sub_oid":1}',
  );
});
