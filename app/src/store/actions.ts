import { useStore } from ".";

export function useMarkHotSearchViewed() {
  const { set$watchedHotSearch, get$watchedHotSearch } = useStore();
  return (name: string) => {
    const viewed = { ...get$watchedHotSearch() };
    viewed[name] = Date.now();
    let list = Object.entries(viewed);
    if (list.length > 100) {
      list = list.sort((a, b) => b[1] - a[1]).slice(0, 100);
      const newViewed: typeof viewed = {};
      for (const [k, t] of list) {
        newViewed[k] = t;
      }
      set$watchedHotSearch(newViewed);
    } else {
      set$watchedHotSearch(viewed);
    }
  };
}
