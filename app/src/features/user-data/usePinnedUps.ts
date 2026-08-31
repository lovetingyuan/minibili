import { userData } from "./store";
import { useUserSettings } from "./useUserSettings";

export function usePinnedUps() {
  const { values, ready, isGuest, authRequired, setSetting } = useUserSettings();
  const disabled = !ready || isGuest || authRequired;

  function setPinned(mid: string | number, pinned: boolean) {
    // 菜单打开后也可能收到 401；会话切换由 setSetting 再次校验。
    if (disabled || userData.getSnapshot().authRequired) return false;
    const id = mid.toString();
    return setSetting("$pinnedUpIds", (previous) => {
      const remaining = previous.filter((item) => item !== id);
      return pinned ? [id, ...remaining] : remaining;
    });
  }

  return {
    pinnedUpIds: values.$pinnedUpIds,
    disabled,
    pin: (mid: string | number) => setPinned(mid, true),
    unpin: (mid: string | number) => setPinned(mid, false),
  };
}
