import type { AlertButton } from "react-native";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { BlockRelationChange, RelationAccount } from "../api/modify-relation.types";

const mocks = vi.hoisted(() => ({
  account: { mid: "123", generation: 1 } as RelationAccount | null,
  generation: 1,
  isPreparing: false,
  isMutating: false,
  block: vi.fn<(up: BlockRelationChange["up"], account: RelationAccount) => Promise<void>>(),
  alert: vi.fn<(title: string, message: string, buttons: AlertButton[]) => void>(),
  navigate: vi.fn(),
  showToast: vi.fn(),
  logout: vi.fn(async () => undefined),
}));
vi.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mocks.navigate }),
  createNavigationContainerRef: () => ({ isReady: () => true, navigate: mocks.navigate }),
}));
vi.mock("react-native", () => ({ Alert: { alert: mocks.alert } }));
vi.mock("../api/useBlockUp", () => ({
  useBlockUp: () => ({
    account: mocks.account,
    block: mocks.block,
    isPreparing: mocks.isPreparing,
    isMutating: mocks.isMutating,
  }),
}));
vi.mock("../features/bilibili-session/session", () => ({
  bilibiliSession: {
    isCurrentAccount: (account: RelationAccount) => account.generation === mocks.generation,
  },
}));
vi.mock("../features/bilibili-session/useBilibiliSession", () => ({
  useBilibiliSessionActions: () => ({ logout: mocks.logout }),
}));
vi.mock("../utils", () => ({ showToast: mocks.showToast }));

import { RelationLoginRequiredError } from "../api/modify-relation";
import { useBlockUpActions } from "./useBlockUpActions";

function pressButton(text: string) {
  const buttons = mocks.alert.mock.calls.at(-1)?.[2];
  const button = buttons?.find((candidate) => candidate.text === text);
  expect(button).toBeDefined();
  button?.onPress?.();
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.account = { mid: "123", generation: 1 };
  mocks.generation = 1;
  mocks.isPreparing = false;
  mocks.isMutating = false;
  mocks.block.mockResolvedValue(undefined);
});

describe("block UP confirmation", () => {
  test("cancel never sends a request", () => {
    useBlockUpActions().confirmBlock({ mid: 456, name: "UP" });
    expect(mocks.alert).toHaveBeenCalledWith(
      "拉黑 UP 主「UP」？",
      "将加入当前 B 站账号的黑名单",
      expect.any(Array),
    );
    expect(mocks.block).not.toHaveBeenCalled();
    pressButton("取消");
    expect(mocks.block).not.toHaveBeenCalled();
  });

  test("keeps the confirmed target and waits for success before reporting it", async () => {
    let resolve!: () => void;
    mocks.block.mockReturnValueOnce(
      new Promise<void>((done) => {
        resolve = done;
      }),
    );
    const up = { mid: 456, name: "UP" };
    useBlockUpActions().confirmBlock(up);
    up.mid = 789;
    up.name = "另一个 UP";
    pressButton("拉黑");
    expect(mocks.block).toHaveBeenCalledWith(
      { mid: 456, name: "UP" },
      { mid: "123", generation: 1 },
    );
    expect(mocks.showToast).not.toHaveBeenCalled();
    resolve();
    await vi.waitFor(() => expect(mocks.showToast).toHaveBeenCalledExactlyOnceWith("已拉黑"));
  });

  test("guides logged-out users to login without automatically resuming the block", () => {
    mocks.account = null;
    useBlockUpActions().confirmBlock({ mid: 456, name: "UP" });
    expect(mocks.alert).toHaveBeenCalledWith(
      "请先登录 B站",
      "请先登录 B站，登录后重新点击拉黑",
      expect.any(Array),
    );
    pressButton("去登录");
    expect(mocks.navigate).toHaveBeenCalledWith("BilibiliLogin");
    expect(mocks.logout).not.toHaveBeenCalled();
    mocks.account = { mid: "123", generation: 2 };
    expect(mocks.block).not.toHaveBeenCalled();
  });

  test("rejects account changes while the confirmation is open", () => {
    useBlockUpActions().confirmBlock({ mid: 456, name: "UP" });
    mocks.account = { mid: "789", generation: 2 };
    mocks.generation = 2;
    pressButton("拉黑");
    expect(mocks.block).not.toHaveBeenCalled();
    expect(mocks.showToast).toHaveBeenCalledWith("登录状态已改变，请重新操作");
  });

  test.each(["isPreparing", "isMutating"] as const)(
    "does not open confirmation while %s",
    (flag) => {
      mocks[flag] = true;
      useBlockUpActions().confirmBlock({ mid: 456, name: "UP" });
      expect(mocks.alert).not.toHaveBeenCalled();
      expect(mocks.block).not.toHaveBeenCalled();
      expect(mocks.showToast).toHaveBeenCalledOnce();
    },
  );

  test("reports request failure without success or retry", async () => {
    mocks.block.mockRejectedValueOnce(new Error("拉黑操作失败（-352）：操作被拒绝"));
    useBlockUpActions().confirmBlock({ mid: 456, name: "UP" });
    pressButton("拉黑");
    await vi.waitFor(() =>
      expect(mocks.showToast).toHaveBeenCalledExactlyOnceWith("拉黑操作失败（-352）：操作被拒绝"),
    );
    expect(mocks.block).toHaveBeenCalledOnce();
  });

  test("only logs out expired credentials after explicit re-login confirmation", async () => {
    mocks.block.mockRejectedValueOnce(new RelationLoginRequiredError("登录凭据失效"));
    useBlockUpActions().confirmBlock({ mid: 456, name: "UP" });
    pressButton("拉黑");
    await vi.waitFor(() => expect(mocks.alert).toHaveBeenCalledTimes(2));
    expect(mocks.logout).not.toHaveBeenCalled();
    pressButton("去登录");
    await vi.waitFor(() =>
      expect(mocks.navigate).toHaveBeenCalledWith("BilibiliLogin"),
    );
    expect(mocks.logout).toHaveBeenCalledOnce();
    expect(mocks.block).toHaveBeenCalledOnce();
  });
});
