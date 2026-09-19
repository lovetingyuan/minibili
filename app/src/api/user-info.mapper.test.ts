import { describe, expect, test } from "vitest";

import { mapUserCardInfo } from "./user-info.mapper";
import { UserCardInfoResponseSchema } from "./user-info.schema";

function createResponse(officialDescription?: string) {
  return {
    card: {
      mid: "235555226",
      name: "测试UP",
      sex: "保密",
      face: "https://i0.hdslb.com/avatar.jpg",
      birthday: "",
      place: "",
      description: "",
      fans: 100,
      friend: 20,
      attention: 30,
      sign: "个人签名",
      official_verify:
        officialDescription === undefined ? undefined : { type: 0, desc: officialDescription },
      level_info: { current_level: 6 },
      vip: { status: 1 },
    },
    following: true,
    follower: 100,
  };
}

describe("user card mapping", () => {
  test("maps the official description and signature", () => {
    const response = UserCardInfoResponseSchema.parse(createResponse("认证UP主"));

    expect(mapUserCardInfo(response)).toMatchObject({
      mid: "235555226",
      name: "测试UP",
      sign: "个人签名",
      officialDescription: "认证UP主",
    });
  });

  test("uses an empty official description for an unverified UP", () => {
    const response = UserCardInfoResponseSchema.parse(createResponse());

    expect(mapUserCardInfo(response).officialDescription).toBe("");
  });
});
