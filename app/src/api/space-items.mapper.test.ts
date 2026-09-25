import { describe, expect, test } from "vitest";

import { getChargeBadge, mapSpaceVideoItem } from "./space-items.mapper";
import { SpaceVideoItemSchema } from "./space-items.schema";
import type { SpaceVideoItemResponse } from "./space-items.schema";
import type { SpaceOwner } from "./space-items.types";

const owner: SpaceOwner = { mid: 3493294065584194, name: "舒涵心灵疗愈", face: "face.jpg" };

/** 用真实接口字段形态构造投稿条目，缺省字段走 schema 默认值 */
function createItem(overrides: Record<string, unknown> = {}): SpaceVideoItemResponse {
  return SpaceVideoItemSchema.parse({
    aid: 117303240824289,
    bvid: "BV1wZez6iEwK",
    mid: 3493294065584194,
    title: "【高能充电💗专属视频】专属制作",
    ...overrides,
  });
}

describe("getChargeBadge", () => {
  test("充电专属投稿返回接口给的角标文案", () => {
    const item = createItem({ is_charging_arc: true, elec_arc_badge: "充电专属" });

    expect(getChargeBadge(item)).toBe("充电专属");
  });

  test("角标文案为空时回退成「充电专属」", () => {
    expect(getChargeBadge(createItem({ is_charging_arc: true, elec_arc_badge: "" }))).toBe(
      "充电专属",
    );
  });

  test('兼容 1 与 "1" 两种标记形态', () => {
    expect(getChargeBadge(createItem({ is_charging_arc: 1 }))).toBe("充电专属");
    expect(getChargeBadge(createItem({ is_charging_arc: "1" }))).toBe("充电专属");
  });

  test("普通投稿没有角标", () => {
    expect(getChargeBadge(createItem({ is_charging_arc: false, elec_arc_badge: "" }))).toBe(
      undefined,
    );
    expect(getChargeBadge(createItem())).toBe(undefined);
  });
});

describe("mapSpaceVideoItem", () => {
  test("把充电专属标记带进视频内容", () => {
    const item = mapSpaceVideoItem(
      createItem({ is_charging_arc: true, elec_arc_badge: "充电专属" }),
      owner,
    );

    expect(item.content).toMatchObject({ kind: "video", bvid: "BV1wZez6iEwK", badge: "充电专属" });
  });

  test("普通投稿不产生角标", () => {
    const item = mapSpaceVideoItem(createItem(), owner);

    expect(item.content).toMatchObject({ kind: "video", badge: undefined });
  });
});
