import { useModifyWatchLater } from "../api/useWatchLater";
import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import {
  handleLoginRequiredError,
  showLoginRequiredAlert,
} from "../features/bilibili-session/login-required-alert";
import { bilibiliSession } from "../features/bilibili-session/session";
import {
  useBilibiliSessionActions,
  useBilibiliSessionState,
} from "../features/bilibili-session/useBilibiliSession";
import { useWatchLaterAids } from "../store/watch-later";
import { showToast } from "../utils";

export type WatchLaterTarget = { aid?: string | number };

export function useWatchLaterActions() {
  const { account, control, error } = useBilibiliSessionState();
  const watchLaterAids = useWatchLaterAids();
  const mutation = useModifyWatchLater();
  const { logout } = useBilibiliSessionActions();
  const preparing = control.phase !== "ready" || (account === undefined && !error);

  function isAdded(aid?: string | number | null) {
    if (aid === undefined || aid === null) {
      return false;
    }
    return Boolean(watchLaterAids[String(aid)]);
  }

  async function toggle(target: WatchLaterTarget) {
    const aid = target.aid === undefined || target.aid === null ? "" : String(target.aid);
    if (preparing) {
      showToast("正在确认登录状态，请稍候重试");
      return;
    }
    if (!account || !bilibiliSession.isCurrentAccount(account)) {
      showLoginRequiredAlert("请先登录 B站，登录后再试");
      return;
    }
    if (!/^[1-9]\d*$/.test(aid)) {
      showToast("视频信息尚未加载完成，请稍候重试");
      return;
    }
    if (mutation.isPending(aid)) {
      showToast("稍后再看操作正在进行，请稍候");
      return;
    }
    const added = !isAdded(aid);
    try {
      await mutation.toggle(account, aid, added);
      if (bilibiliSession.isCurrentAccount(account)) {
        showToast(added ? "已添加到稍后再看" : "已从稍后再看移除");
      }
    } catch (cause) {
      if (
        handleLoginRequiredError(cause, "请先登录 B站后重新操作", {
          session: { account, logout },
        })
      ) {
        return;
      }
      if (!bilibiliSession.isCurrentAccount(account)) {
        showToast("登录状态已改变，请重新操作");
        return;
      }
      showToast(
        cause instanceof BilibiliSessionChangedError
          ? "登录状态已改变，请重新操作"
          : cause instanceof Error
            ? cause.message
            : "稍后再看操作失败，请稍后重试",
      );
    }
  }

  return { isAdded, isPending: mutation.isPending, toggle };
}
