import { useSyncExternalStore } from "react";

export type AppTheme = "light" | "dark";
export type AppThemePreference = AppTheme | "system";

const THEME_STORAGE_KEY = "frankcards-theme";
const THEME_CHANGE_EVENT = "frankcards:theme-change";
let themePreferenceFallback: AppThemePreference = "system";

function getSystemTheme(): AppTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredThemePreference(): AppThemePreference | null {
  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === "light" || storedTheme === "dark" || storedTheme === "system"
      ? storedTheme
      : null;
  } catch {
    return null;
  }
}

function applyThemePreference(preference: AppThemePreference) {
  if (preference === "system") {
    delete document.documentElement.dataset.theme;
    return;
  }

  document.documentElement.dataset.theme = preference;
}

export function getAppThemePreference(): AppThemePreference {
  return getStoredThemePreference() ?? themePreferenceFallback;
}

export function getAppTheme(): AppTheme {
  const theme = document.documentElement.dataset.theme;
  return theme === "light" || theme === "dark" ? theme : getSystemTheme();
}

export function initializeAppTheme(): AppTheme {
  const preference = getAppThemePreference();
  applyThemePreference(preference);
  return getAppTheme();
}

export function setAppTheme(preference: AppThemePreference) {
  themePreferenceFallback = preference;
  applyThemePreference(preference);

  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // The theme still applies for this visit when storage is unavailable.
  }

  document.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

function subscribeToTheme(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const legacyMediaQuery = mediaQuery as MediaQueryList & {
    addListener?: (listener: () => void) => void;
    removeListener?: (listener: () => void) => void;
  };
  const handleSystemThemeChange = () => {
    if (getAppThemePreference() === "system") onStoreChange();
  };
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    themePreferenceFallback = getStoredThemePreference() ?? "system";
    applyThemePreference(getAppThemePreference());
    onStoreChange();
  };

  document.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", handleStorageChange);
  // Older iOS WebViews expose the legacy MediaQueryList listener API only.
  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", handleSystemThemeChange);
  } else {
    legacyMediaQuery.addListener?.(handleSystemThemeChange);
  }

  return () => {
    document.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", handleStorageChange);
    if (typeof mediaQuery.removeEventListener === "function") {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    } else {
      legacyMediaQuery.removeListener?.(handleSystemThemeChange);
    }
  };
}

export function useAppTheme(): AppTheme {
  return useSyncExternalStore(
    subscribeToTheme,
    getAppTheme,
    () => "light",
  );
}

export function useAppThemePreference(): AppThemePreference {
  return useSyncExternalStore(
    subscribeToTheme,
    getAppThemePreference,
    () => "system",
  );
}
