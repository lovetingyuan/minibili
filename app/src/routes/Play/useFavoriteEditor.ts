import { useEffect, useRef, useState } from "react";

import { useModifyVideoFavorites, useVideoFavoriteFolders } from "../../api/useVideoFavorites";
import { FavoriteResultUnknownError, getFavoriteChanges } from "../../api/video-favorites";
import { bilibiliSession } from "../../features/bilibili-session/session";
import type { FavoriteDialogProps, FavoriteSelection } from "./Favorite.types";
import { createFavoriteSelection, toggleFavoriteFolder } from "./favorite-selection";

export function useFavoriteEditor({ account, video }: FavoriteDialogProps) {
  const { trigger: refresh } = useVideoFavoriteFolders(account, video);
  const mutation = useModifyVideoFavorites(account, video);
  const [selection, setSelection] = useState<FavoriteSelection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [needsReload, setNeedsReload] = useState(false);
  const pending = useRef(false);
  const mounted = useRef(false);

  function isActive() {
    return mounted.current && bilibiliSession.isCurrentAccount(account);
  }

  useEffect(() => {
    let active = true;
    mounted.current = true;
    void refresh()
      .then((data) => {
        if (!data) throw new Error("收藏夹加载失败，请重试");
        if (active) setSelection(createFavoriteSelection(data.list));
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause : new Error("收藏夹加载失败，请重试"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      mounted.current = false;
    };
  }, [refresh]);

  async function loadSelection() {
    setLoading(true);
    try {
      const data = await refresh();
      if (!data) throw new Error("收藏夹加载失败，请重试");
      if (isActive()) {
        setSelection((current) => createFavoriteSelection(data.list, current?.selectedIds));
        setNeedsReload(false);
      }
    } finally {
      if (isActive()) setLoading(false);
    }
  }

  async function reload() {
    if (pending.current || mutation.isMutating || !isActive()) return;
    pending.current = true;
    setError(null);
    try {
      await loadSelection();
    } catch (cause) {
      if (isActive())
        setError(cause instanceof Error ? cause : new Error("收藏夹加载失败，请重试"));
    } finally {
      pending.current = false;
    }
  }

  const changes = selection
    ? getFavoriteChanges(selection.initialIds, selection.selectedIds)
    : null;
  const hasChanges = Boolean(changes && (changes.add.length || changes.remove.length));
  const busy = saving || mutation.isMutating;
  const canSubmit = Boolean(
    selection?.folders.length && hasChanges && !loading && !busy && !needsReload,
  );

  async function submit() {
    if (!selection || !canSubmit || pending.current || !isActive()) return false;
    pending.current = true;
    setSaving(true);
    setError(null);
    try {
      await mutation.save(selection.initialIds, selection.selectedIds);
      return isActive();
    } catch (cause) {
      if (!isActive()) return false;
      setError(cause instanceof Error ? cause : new Error("收藏操作失败，请稍后重试"));
      if (cause instanceof FavoriteResultUnknownError) {
        setNeedsReload(true);
        try {
          await loadSelection();
          if (isActive())
            setError(new Error("已重新查询收藏结果，请确认选择；如无变化则无需再次提交"));
        } catch (refreshError) {
          if (isActive())
            setError(
              refreshError instanceof Error ? refreshError : new Error("收藏夹刷新失败，请重试"),
            );
        }
      }
      return false;
    } finally {
      pending.current = false;
      if (isActive()) setSaving(false);
    }
  }

  return {
    selection,
    loading,
    error,
    needsReload,
    busy,
    canSubmit,
    reload,
    submit,
    canClose: () => !pending.current && !busy,
    toggle(folderId: number) {
      if (pending.current || busy || loading || needsReload) return;
      setSelection((current) => (current ? toggleFavoriteFolder(current, folderId) : current));
    },
  };
}
