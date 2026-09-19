import { beforeEach, describe, expect, test, vi } from "vitest";

import type { VideoFavoriteFolders } from "../../api/video-favorites.types";
import type { FavoriteDialogProps } from "./Favorite.types";

const mocks = vi.hoisted(() => ({
  states: [] as unknown[],
  refs: [] as { current: unknown }[],
  stateIndex: 0,
  refIndex: 0,
  effects: [] as (() => () => void)[],
  captureEffects: true,
  current: true,
  mutate: vi.fn<() => Promise<VideoFavoriteFolders | undefined>>(),
  save: vi.fn<(initialIds: number[], selectedIds: number[]) => Promise<void>>(),
}));

// 与仓库已有 hook 测试一致，模拟外部依赖；跨 render 保留 state/ref 以验证交互流程。
vi.mock("react", () => ({
  useState<T>(initial: T) {
    const index = mocks.stateIndex++;
    if (!(index in mocks.states)) {
      mocks.states[index] = initial;
    }
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
  useEffect(effect: () => () => void) {
    if (mocks.captureEffects) {
      mocks.effects.push(effect);
    }
  },
}));
vi.mock("../../api/useVideoFavorites", () => ({
  useVideoFavoriteFolders: () => ({ trigger: mocks.mutate }),
  useModifyVideoFavorites: () => ({ save: mocks.save, isMutating: false }),
}));
vi.mock("../../features/bilibili-session/session", () => ({
  bilibiliSession: { isCurrentAccount: () => mocks.current },
}));

import { FavoriteResultUnknownError } from "../../api/video-favorites";
import { useFavoriteEditor } from "./useFavoriteEditor";

const data: VideoFavoriteFolders = {
  count: 2,
  list: [
    { id: 303350121, fid: 3033501, mid: 123, title: "默认收藏夹", media_count: 1, fav_state: 1 },
    { id: 3328621821, fid: 33286218, mid: 123, title: "学习", media_count: 0, fav_state: 0 },
  ],
};
const props: FavoriteDialogProps = {
  account: { mid: "123", generation: 1 },
  video: { aid: "123", bvid: "BV1" },
  onClose: vi.fn(),
  onLoginRequired: vi.fn(),
};

function render() {
  mocks.stateIndex = 0;
  mocks.refIndex = 0;
  return useFavoriteEditor(props);
}

async function mount() {
  render();
  mocks.captureEffects = false;
  const cleanup = mocks.effects[0]();
  await vi.waitFor(() => expect(render().loading).toBe(false));
  return cleanup;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.states = [];
  mocks.refs = [];
  mocks.effects = [];
  mocks.captureEffects = true;
  mocks.current = true;
  mocks.mutate.mockResolvedValue(data);
  mocks.save.mockResolvedValue();
});

describe("favorite editor workflow", () => {
  test("waits for a fresh query, initializes membership, and does not submit unchanged selections", async () => {
    expect(render().canSubmit).toBe(false);
    mocks.effects = [];
    await mount();
    const editor = render();
    expect(editor.selection?.selectedIds).toEqual([303350121]);
    expect(editor.canSubmit).toBe(false);
    expect(await editor.submit()).toBe(false);
    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.mutate).toHaveBeenCalledOnce();
  });

  test("supports removing all; locks submission, selection and close synchronously", async () => {
    await mount();
    render().toggle(303350121);
    const editor = render();
    expect(editor.canSubmit).toBe(true);
    const saving = Promise.withResolvers<void>();
    mocks.save.mockReturnValueOnce(saving.promise);
    const first = editor.submit();
    expect(editor.canClose()).toBe(false);
    expect(await editor.submit()).toBe(false);
    editor.toggle(3328621821);
    expect(render().selection?.selectedIds).toEqual([]);
    expect(mocks.save).toHaveBeenCalledExactlyOnceWith([303350121], []);
    saving.resolve();
    expect(await first).toBe(true);
    expect(render().canClose()).toBe(true);
  });

  test("preserves edits on business failure without marking the operation successful", async () => {
    await mount();
    render().toggle(3328621821);
    mocks.save.mockRejectedValueOnce(new Error("操作被拒绝"));
    expect(await render().submit()).toBe(false);
    expect(render().error?.message).toBe("操作被拒绝");
    expect(render().selection?.selectedIds).toEqual([303350121, 3328621821]);
    expect(render().canSubmit).toBe(true);
    expect(mocks.mutate).toHaveBeenCalledOnce();
  });

  test("reconciles an uncertain POST before retrying and recognizes a write that already succeeded", async () => {
    await mount();
    render().toggle(3328621821);
    mocks.save.mockRejectedValueOnce(new FavoriteResultUnknownError("超时"));
    const refresh = Promise.withResolvers<VideoFavoriteFolders>();
    mocks.mutate.mockReturnValueOnce(refresh.promise);
    const submitting = render().submit();
    await vi.waitFor(() => expect(mocks.mutate).toHaveBeenCalledTimes(2));
    expect(render().canSubmit).toBe(false);
    expect(render().canClose()).toBe(false);
    refresh.resolve({ ...data, list: data.list.map((folder) => ({ ...folder, fav_state: 1 })) });
    expect(await submitting).toBe(false);
    expect(render().selection?.selectedIds).toEqual([303350121, 3328621821]);
    expect(render().selection?.initialIds).toEqual([303350121, 3328621821]);
    expect(render().canSubmit).toBe(false);
    expect(mocks.save).toHaveBeenCalledOnce();
  });

  test("blocks resubmission when reconciliation fails, then preserves desired selection on manual refresh", async () => {
    await mount();
    render().toggle(3328621821);
    mocks.save.mockRejectedValueOnce(new FavoriteResultUnknownError("超时"));
    mocks.mutate.mockRejectedValueOnce(new Error("offline"));
    await render().submit();
    expect(render().needsReload).toBe(true);
    expect(render().canSubmit).toBe(false);
    await render().reload();
    expect(render().needsReload).toBe(false);
    expect(render().selection?.selectedIds).toEqual([303350121, 3328621821]);
    expect(render().canSubmit).toBe(true);
  });

  test("supports initial load failure and retry, and blocks an empty folder list", async () => {
    mocks.mutate.mockRejectedValueOnce(new Error("offline"));
    await mount();
    expect(render().canSubmit).toBe(false);
    expect(render().error?.message).toBe("offline");
    mocks.mutate.mockResolvedValueOnce({ count: 0, list: [] });
    await render().reload();
    expect(render().error).toBeNull();
    expect(render().canSubmit).toBe(false);
    expect(render().selection?.folders).toEqual([]);
  });

  test.each(["unmount", "account change"])(
    "does not publish a success after %s",
    async (reason) => {
      const cleanup = await mount();
      render().toggle(3328621821);
      const saving = Promise.withResolvers<void>();
      mocks.save.mockReturnValueOnce(saving.promise);
      const result = render().submit();
      if (reason === "unmount") {
        cleanup();
      } else {
        mocks.current = false;
      }
      saving.resolve();
      expect(await result).toBe(false);
    },
  );
});
