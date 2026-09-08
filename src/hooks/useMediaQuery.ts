import { useCallback, useSyncExternalStore } from "react";

// A phone in landscape has the horizontal room for the two-column experience
// even though it never reaches the conventional 64rem desktop breakpoint.
export const LIBRARY_DESKTOP_QUERY =
  "(min-width: 64rem), (orientation: landscape) and (min-width: 40rem)";

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
