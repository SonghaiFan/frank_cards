import { useCallback, useSyncExternalStore } from "react";

export const LIBRARY_DESKTOP_QUERY = "(min-width: 64rem)";

export const useMediaQuery = (query: string) => {
  const subscribe = useCallback((onStoreChange: () => void) => {
    const mediaQuery = window.matchMedia(query);
    mediaQuery.addEventListener("change", onStoreChange);
    return () => mediaQuery.removeEventListener("change", onStoreChange);
  }, [query]);

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
