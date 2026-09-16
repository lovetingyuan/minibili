import { beforeEach, describe, expect, test, vi } from "vitest";

import type { FavoriteFolder } from "../../api/favorites.types";

const mocks = vi.hoisted(() => ({
  states: [] as unknown[],
  refs: [] as { current: unknown }[],
  stateIndex: 0,
  refIndex: 0,
  current: true,
  create: vi.fn(),
  onCreated: vi.fn(),
  onLoginRequired: vi.fn(),
}));

// 与仓库已有 hook 测试一致，跨 render 保留 state/ref 以验证交互流程。
vi.mock("react", () => ({
  useState<T>(initial: T) {
    const index = mocks.stateIndex++;
    if (!(index in mocks.states)) mocks.states[index] = initial;
    return [
      mocks.states[index] as T,
      (value: T | ((previous: T) => T)) => {
        mocks.states[index] =
          typeof value === "function"
            ? (value as (previous: T) => T)(mocks.states[index] as T)
            : value;
      },
    ];
  },
  useRef<T>(initial: T) {
    const index = mocks.refIndex++;
    mocks.refs[index] ??= { current: initial };
    return mocks.refs[index];
  },
}));
vi.mock("../../api/useBilibiliFavorites", () => ({
  useBilibiliFavoriteFolderActions: () => ({ createFolder: mocks.create }),
}));
vi.mock("../../features/bilibili-session/session", () => ({
  bilibiliSession: { isCurrentAccount: () => mocks.current },
}));

import { FavoriteLoginRequiredError } from "../../api/video-favorites";
import { useCreateFavoriteFolder } from "./useCreateFavoriteFolder";

const account = { mid: "123", generation: 1 };
const folder: FavoriteFolder = { id: 456, fid: 45, mid: 123, title: "test", media_count: 0 };

function render() {
  mocks.stateIndex = 0;
  mocks.refIndex = 0;
  return useCreateFavoriteFolder({
    account,
    onCreated: mocks.onCreated,
    onLoginRequired: mocks.onLoginRequired,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.states = [];
  mocks.refs = [];
  mocks.current = true;
  mocks.create.mockResolvedValue(folder);
});

describe("create favorite folder dialog", () => {
  test("blocks blank and over-long names before requesting", async () => {
    render().setTitle("   ");
    const blank = render();
    expect(blank.nameError).toBe("收藏夹名称不能为空");
    expect(blank.canSubmit).toBe(false);
    expect(blank.count).toBe(0);
    await expect(blank.submit()).resolves.toBe(false);

    blank.setTitle("学".repeat(21));
    const tooLong = render();
    expect(tooLong.nameError).toBe("收藏夹名称不能超过 20 个字");
    expect(tooLong.count).toBe(21);
    await expect(tooLong.submit()).resolves.toBe(false);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  test("creates the trimmed name with the chosen privacy", async () => {
    const editor = render();
    editor.setTitle("  test  ");
    editor.setIsPrivate(true);
    const active = render();
    expect(active.canSubmit).toBe(true);
    await expect(active.submit()).resolves.toBe(true);
    expect(mocks.create).toHaveBeenCalledWith({ title: "test", privacy: 1 });
    expect(mocks.onCreated).toHaveBeenCalledWith(folder);
    expect(render().error).toBeNull();
  });

  test("keeps the dialog open and asks for a new login when credentials expire", async () => {
    mocks.create.mockRejectedValueOnce(
      new FavoriteLoginRequiredError("登录凭据失效，请重新登录 B站"),
    );
    render().setTitle("test");
    const active = render();
    await expect(active.submit()).resolves.toBe(false);
    expect(mocks.onCreated).not.toHaveBeenCalled();
    expect(mocks.onLoginRequired).toHaveBeenCalledOnce();
    const failed = render();
    expect(failed.error?.message).toBe("登录凭据失效，请重新登录 B站");
    expect(failed.canSubmit).toBe(true);
    expect(failed.canClose()).toBe(true);
  });

  test("refuses to submit once the login session changed", async () => {
    mocks.current = false;
    render().setTitle("test");
    await expect(render().submit()).resolves.toBe(false);
    expect(mocks.create).not.toHaveBeenCalled();
    expect(render().error?.message).toBe("登录状态已改变，请重新登录后操作");
  });

  test("locks submission and closing while the request is pending", async () => {
    const pending = Promise.withResolvers<FavoriteFolder>();
    mocks.create.mockReturnValueOnce(pending.promise);
    render().setTitle("test");
    const active = render();
    const first = active.submit();
    expect(active.canClose()).toBe(false);
    await expect(active.submit()).resolves.toBe(false);
    pending.resolve(folder);
    await expect(first).resolves.toBe(true);
    expect(mocks.create).toHaveBeenCalledOnce();
  });
});
