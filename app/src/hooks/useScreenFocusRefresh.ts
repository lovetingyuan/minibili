import { NavigationContext } from "@react-navigation/native";
import { useContext, useEffect, useEffectEvent } from "react";
import { unstable_serialize, useSWRConfig } from "swr";
import type { Cache, Middleware } from "swr";
import { unstable_serialize as serializeInfinite } from "swr/infinite";
import type { SWRInfiniteKeyLoader } from "swr/infinite";

const pendingRevalidations = new WeakMap<Cache, Map<string, Promise<unknown>>>();

export function useScreenFocusRefresh(refresh: () => unknown, enabled = true) {
  const navigation = useContext(NavigationContext);
  const onFocus = useEffectEvent(() => {
    void Promise.resolve(refresh()).catch(() => {});
  });

  useEffect(() => {
    if (!navigation || !enabled) {
      return;
    }
    // 首次进入由 SWR 挂载时请求，只处理离开后再次进入。
    let focused = navigation.isFocused();
    const unsubscribeBlur = navigation.addListener("blur", () => {
      focused = false;
    });
    const unsubscribeFocus = navigation.addListener("focus", () => {
      if (!focused) {
        focused = true;
        onFocus();
      }
    });
    return () => {
      unsubscribeBlur();
      unsubscribeFocus();
    };
  }, [navigation, enabled]);
}

export const screenFocusRevalidation: Middleware = (useSWRNext) =>
  function useScreenSWR(key, fetcher, config) {
    const response = useSWRNext(key, fetcher, config);
    const { cache } = useSWRConfig();
    // 全局中间件也会接收 useSWRMutation 的结果，它没有 mutate，不能自动刷新。
    const shouldRevalidate =
      config.revalidateOnFocus !== false && typeof response.mutate === "function";

    useScreenFocusRefresh(() => {
      if (
        !shouldRevalidate ||
        config.isVisible?.() === false ||
        config.isOnline?.() === false ||
        config.isPaused?.()
      ) {
        return;
      }
      // Infinite 的 key 是分页加载器，序列化第一页才能合并同一列表的请求。
      const cacheKey =
        typeof key === "function" && "setSize" in response
          ? serializeInfinite(key as SWRInfiniteKeyLoader)
          : unstable_serialize(key);
      if (!cacheKey) {
        return;
      }
      let pending = pendingRevalidations.get(cache);
      if (!pending) {
        pending = new Map();
        pendingRevalidations.set(cache, pending);
      }
      const existing = pending.get(cacheKey);
      if (existing) {
        return existing;
      }
      const task = response.mutate().finally(() => pending.delete(cacheKey));
      pending.set(cacheKey, task);
      return task;
    }, shouldRevalidate);

    return response;
  };
