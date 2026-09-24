import { beforeEach, describe, expect, test, vi } from "vitest";
import type { AlertButton } from "react-native";

const mocks = vi.hoisted(() => ({
  alert: vi.fn<(title: string, message?: string, buttons?: AlertButton[]) => void>(),
  navigate: vi.fn(),
  showToast: vi.fn(),
  current: true,
  logout: vi.fn(async () => undefined),
}));

vi.mock("react-native", () => ({ Alert: { alert: mocks.alert } }));
vi.mock("../../utils", () => ({ showToast: mocks.showToast }));
vi.mock("../../routes/navigation", () => ({
  openBilibiliLogin: () => {
    mocks.navigate("BilibiliLogin");
  },
}));
vi.mock("./session", () => ({
  bilibiliSession: { isCurrentAccount: () => mocks.current },
}));

import { BilibiliAuthExpiredError } from "./auth-expiration";
import { LoginRequiredError } from "./login-required";
import { handleLoginRequiredError, showLoginRequiredAlert } from "./login-required-alert";

const account = { mid: "123", generation: 1 };

function pressGoToLogin() {
  const buttons = mocks.alert.mock.calls.at(-1)?.[2];
  const button = buttons?.find((candidate) => candidate.text === "去登录");
  expect(button).toBeDefined();
  button?.onPress?.();
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.current = true;
  mocks.logout.mockResolvedValue(undefined);
});

describe("操作类请求的登录引导", () => {
  test("非登录类错误不弹窗", () => {
    expect(handleLoginRequiredError(new Error("网络错误"))).toBe(false);
    expect(mocks.alert).not.toHaveBeenCalled();
  });

  test("登录类错误弹出统一弹窗并返回 true", () => {
    expect(handleLoginRequiredError(new BilibiliAuthExpiredError(-101, "账号未登录"))).toBe(true);
    expect(mocks.alert).toHaveBeenCalledWith("请先登录 B站", "账号未登录", expect.any(Array));
  });

  test("缺少错误信息时使用默认文案", () => {
    showLoginRequiredAlert("   ");
    expect(mocks.alert).toHaveBeenCalledWith("请先登录 B站", "登录后即可继续操作", expect.any(Array));
  });

  test("确认后清理失效登录态并打开登录页", async () => {
    handleLoginRequiredError(new LoginRequiredError("登录凭据失效"), undefined, {
      session: { account, logout: mocks.logout },
    });
    pressGoToLogin();

    await vi.waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith("BilibiliLogin"));
    expect(mocks.logout).toHaveBeenCalledOnce();
  });

  test("账号已被新会话替换时不再退出登录，直接打开登录页", () => {
    mocks.current = false;
    handleLoginRequiredError(new LoginRequiredError("登录凭据失效"), undefined, {
      session: { account, logout: mocks.logout },
    });
    pressGoToLogin();

    expect(mocks.logout).not.toHaveBeenCalled();
    expect(mocks.navigate).toHaveBeenCalledWith("BilibiliLogin");
  });
});
