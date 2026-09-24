import { useRef, useState } from "react";

import { useBilibiliFavoriteFolderActions } from "../../api/useBilibiliFavorites";
import {
  countFavoriteFolderNameLength,
  getFavoriteFolderNameError,
  normalizeFavoriteFolderName,
} from "../../features/bilibili-favorites/folder-name";
import { isLoginRequiredError } from "../../features/bilibili-session/login-required";
import { bilibiliSession } from "../../features/bilibili-session/session";

import type { CreateFavoriteFolderDialogProps } from "./Favorites.types";

type Options = Pick<CreateFavoriteFolderDialogProps, "account" | "onCreated" | "onLoginRequired">;

export function useCreateFavoriteFolder({ account, onCreated, onLoginRequired }: Options) {
  const { createFolder } = useBilibiliFavoriteFolderActions();
  const [title, setTitle] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const pending = useRef(false);

  const nameError = getFavoriteFolderNameError(title);
  const canSubmit = !nameError && !saving;

  async function submit() {
    if (pending.current || saving || nameError) {
      return false;
    }
    if (!bilibiliSession.isCurrentAccount(account)) {
      setError(new Error("登录状态已改变，请重新登录后操作"));
      return false;
    }
    pending.current = true;
    setSaving(true);
    setError(null);
    try {
      const folder = await createFolder({
        title: normalizeFavoriteFolderName(title),
        privacy: isPrivate ? 1 : 0,
      });
      onCreated(folder);
      return true;
    } catch (cause) {
      const failure = cause instanceof Error ? cause : new Error("收藏夹创建失败，请稍后重试");
      if (isLoginRequiredError(failure)) {
        onLoginRequired(failure);
        return false;
      }
      setError(failure);
      return false;
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  return {
    title,
    setTitle,
    isPrivate,
    setIsPrivate,
    saving,
    error,
    nameError,
    count: countFavoriteFolderNameLength(normalizeFavoriteFolderName(title)),
    canSubmit,
    submit,
    canClose: () => !pending.current && !saving,
  };
}
